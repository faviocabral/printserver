const express = require('express')
const app = express()
const puppeteer = require('puppeteer')
const fs = require('fs');
const path = require('path')
const printPdf = require('pdf-to-printer').print
const request = require('request')
const moment = require('moment')
require('dotenv').config()
const knex = require('./db/config.js')
const sql = require('./db/query.js')

let page;
let fileExist=0
let cola = []
let stop = 0 
let list = [
    573533,
    573534,
    573539,
    573540,
    573541,
    573543,
    573545,
    573546,
    573547,
    573548,
    // 573552,
    // 573553,
    // 573554,
    // 573555,
    // 573556,
    // 573559,
    // 573564,
    // 573566,
    // 573567,
    // 573568,
    // 573569,
    // 573570,
    // 573571,
    // 573572,
    // 573575,
    // 573576,
    // 573578,
    // 573581,
    // 573582,
    // 573584,
    // 573588,
    // 573589,
    // 573593,
    // 573594,
    // 573598,
    // 573599,
    // 573600,
    // 573601,
    // 573604,
    // 573607,
    // 573608,
    // 573612,
    // 573613,
    // 573614,
    // 573616,
    // 573617,
    // 573619,
    // 573621,
    // 573622,
    // 573625,
];	

//funcion para levantar la pagina y quedar en espera 
const upPage = async()=>{
    const browser = await puppeteer.launch({
        headless: true, //true para no mostrar el navegador | true para mostrar el navegador y hacer degbug 
        defaultViewport: false,
    })
    page = await browser.newPage()
    await page.goto( `http://192.168.10.170:8089/impresion999.php` , { waitUntil: 'domcontentloaded' } )//levantamos la pagina de impresion
    console.log('pagina lista ', moment().format('YYYY-MM-DD hh:mm:ss'))
}

//se ejecuta cada vez que se inicia el proceso luego queda en espera la pagina de impresion
upPage() 

//funcion que realiza la opracion de editar la pagina 
const getPage = async (nroOt =  561604 )=>{
    try {
        stop = nroOt // para manejar cola... 
        const rows = await sql.queryServicio(nroOt) //consultamos datos de la ot 
        const rowsMora = await sql.queryMora(nroOt) //consultamos datos de mora 
        const rowsCampaña = await sql.queryCampaña(nroOt) //consultamos datos de campaña
        const rowsPlanPlus = await sql.queryPlanPlus(nroOt) //consultamos datos promocion 
        console.log(nroOt, 'consulta lista ', moment().format('YYYY-MM-DD hh:mm:ss.mmm'))
        if(rowsMora.length > 0 ){//si existe datos de mora mostramos en pantalla 
            await page.$eval( `#mora`, (el, val) => el.innerText = val, `Cliente con ${rowsMora[0].mora} dias Mora`)
        }else{
            await page.$eval( `#mora`, (el, val) => el.innerText = val, 'Cliente al Dia!')
        } 
        if(rowsCampaña.length > 0 ){
            await page.$eval( `#campanha`, (el, val) => el.innerText = val, rowsCampaña[0].texto) //si existe campaña mostramos el mensaje
        }else{
            await page.$eval( `#campanha`, (el, val) => el.innerText = val, '') //ceramos
        } 
        if(rowsPlanPlus.length > 0 ){
            await page.$eval( `#PlanPlus3`, (el, val) => el.innerText = val, rowsPlanPlus[0].texto)//si existe la promocion mostramos el mensaje 
        }else{
            await page.$eval( `#PlanPlus3`, (el, val) => el.innerText = val, '')//ceramos
        } 
        const parametros =  Object.entries(rows[0])//obtenemos los campos y datos para insertar en la pagina e crear el pdf y luego imprimir 
        await Promise.all([ //esperamos que se complete todos los campos de 
            parametros.forEach(async(item) =>{ 
                await page.$eval( `#${item[0]}`, (el, val) => el.innerText = val, (item[0].includes('Fecha') ? String(item[1]).slice(0,10) : item[1] ) )
            })
        ])
        .then(async() => {
            setTimeout(async()=>{
                await printPage(nroOt)//preparamos la pagina para crear el pdf y luego imprimir
                console.log(nroOt, 'impresion lista ', moment().format('YYYY-MM-DD hh:mm:ss.mmm'))
                setTimeout(()=>stop = 0 , 500) //
            }, 500)
        })
    } catch (error) {
        console.log('ocurrio un error en la funcion getPage ', nroOt , error ) 
    }
}

/**
 * Funcion 
 * @param {number} nroOt - pasamos el nro de ot que queremos imprimir 
 */
const printPage = async (nroOt) => {
    try {
        await page.emulateMediaType('print')
        await page.pdf({ path: `public/${nroOt}.pdf`, format: 'Legal', scale: 0.98 }) //creamos la impresion a pdf 
        console.log(nroOt, 'imprimir ot ', moment().format('YYYY-MM-DD hh:mm:ss'))
    } catch (error) { /*si hay error en la creacion del pdf */ }
}

//funcion para imprimir en la impresora destinada 
const print = async(nroOt)=>{
    try {
        await (function(){
            return new Promise((resolve, reject)=>{
                setTimeout(async()=>{
                    const options = {
                        printer: "Samsung M4370 5370 Series (192.168.70.21)",
                        paperSize: 'Folio'
                    };
                    printPdf( `public/${nroOt}.pdf` , options).then((e)=> {
                        console.log(`impresion enviada ${nroOt} `, moment().format('YYYY-MM-DD hh:mm:ss'))
                        fs.unlinkSync( path.join(__dirname, `/public/${nroOt}.pdf`)) //eliminamos el pdf creado 
                    })
                    resolve('impresion lista')
                }, 500) //delay para liberar buffer 
            })
        })()
    } catch (error) {
        console.log('ocurrio un error en la impresion funcion print ', error )        
    }
}

//endpoint para la impresion de la ot 
app.get('/print/:ot', async (req, res )=>{
    try {
        const nroOt = req.params.ot
        let wait = setInterval(async()=>{
            if(stop === 0){
                getPage(nroOt)
                clearInterval(wait)
            }
         }, 800)

        let findFile = setInterval(async() =>{
            //si ya existe el archivo en fisico correr el proceso 
            if (fs.existsSync( path.join(__dirname, `/public/${nroOt}.pdf`) )) {
                print(nroOt) //funcion principal que envia la impresion ... 
                res.send('impresion lista ' + moment().format('YYYY-MM-DD hh:mm:ss'))
                clearInterval(findFile)//paramos el buscador... 
            }
        }, 500)
    } catch (error) {
        res.status(500).send('ocurrio un error')
        console.log('ocurrio un error en el endpoint print ot ', error )        
    }
})

// para test... 
app.get('/orden/:ot', async(req, res )=>{
    const ot = req.params.ot
    const datos = await sql.queryServicio(req.params.ot)
    const datosMora = await sql.queryMora(req.params.ot)
    const datosCampaña = await sql.queryCampaña(req.params.ot)
    res.send({orden: datos , mora: datosMora , campaña: datosCampaña})
})

//prueba de stresss 
app.get('/test', async(req, res)=>{
    process.setMaxListeners(100);
    let pruebas = []
        list.forEach( (item, x)=>{
            setTimeout(async()=>{
                request(`http://localhost:3200/print/${item}`, function (error, response, body) {
                    //console.log('test listo' , moment().format('YYYY-MM-DD hh:mm:ss'))
                    pruebas.push({ id: pruebas.length +1 , ot:item, time: moment().format('YYYY-MM-DD hh:mm:ss') })
                    //console.log('lista ', pruebas)
                })
            }, x * 500)
        })
        res.send('enviado' + moment().format('YYYY-MM-DD hh:mm:ss'))
})


app.get('/', async (req , res )=>{ 
    res.send('servidor impresion ot')
})

app.listen(3200, console.log('servidor impresion ot port 3200'))
