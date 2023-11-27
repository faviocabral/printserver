const express = require('express')
const app = express()
const puppeteer = require('puppeteer')
const fs = require('fs');
const path = require('path');
const printPdf = require('pdf-to-printer').print
const moment = require('moment')
require('dotenv').config()
const knex = require('./db/config.js')
const sql = require('./db/query.js')

let page;
let fileExist=0;
let list = [
    573530,
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
    573552,
    573553,
    573554,
    573555,
];	

const Ids = [
    "TipoServicio",
    "TipoLlamada",
    "campaña",
    "PlanPlus3",
    "mora",
    "contenido",
    "NroLlamada",
    "FechaApertura",
    "FechaPrometida",
    "FechaVenta",
    "FechaCierre",
    "Identificador",
    "NroDocumento",
    "Asesor",
    "contacto_cliente",
    "contacto_email",
    "NombreCliente",
    "Chassis",
    "Direccion",
    "Marca",
    "Telefono",
    "Modelo",
    "CodigoCliente",
    "Kilometraje",
    "KilometrajeSalida",
    "Chapa",
    "Color",
    "PedidoCliente",
    "Motivo",
    "Accesorios",
    "list-accesorios",
    "lavadoSi",
    "lavadoNo",
    "costoServicio",
    "fuelMeterDiv",
    "Observacion",
    "ticket",
    "sucu-direccion",
    "fuelMeterDiv",
    "NroOt2",
    "tabla2",
]



const getPage = async (nroOt =  561604 )=>{
    const browser = await puppeteer.launch({
        headless: true,
        defaultViewport: false,
    })
    
    page = await browser.newPage()

/*
    page.on('response', async (response)=>{
        let url = await response.url()
        let campo= [], valores = {}

        if(url == 'http://192.168.10.170:8089/consulta.php'){ 
            datos = await response.json() 
            console.log(datos) 
            if(datos.length > 0){ 
                campo = Object.keys(datos[0]) 
                valores = datos[0] 
                const listIds = await page.evaluate((sel) =>{ return  Array.from(document.querySelectorAll('[id]')).map(item=> item.id) }) 
                console.log(listIds) 
                let newList = campo.filter(item => listIds.includes(item)) 
                Promise.all([
                    newList.forEach(async(item) =>{ 
                        await page.$eval( `#${item}`, (el, val) => el.innerText = val, (item.includes('Fecha') ? valores[item].slice(0,10) : valores[item] ) )
                    })
                ])
                .then(() => {console.log('ya termino de completar el formulario')})
                .then(() => {
                    setTimeout(() => {
                        console.log('ahora imprime en pdf')
                        printPage(nroOt)
                    }, 500);
                })
            } 
        } 
    }) 
*/
    //await page.goto( `http://192.168.10.170:8089/impresion99.php?NroOt=${nroOt}&sucursal=victoria` , {waitUntil: 'domcontentloaded'} )
    await page.goto( `http://192.168.10.170:8089/impresion999.php` , {waitUntil: 'domcontentloaded'} )
    console.log('ya recupero los datos de la ot')
    const rows = await sql.query(nroOt)
    const parametros =  Object.entries(rows[0])
    console.log(parametros )
    Promise.all([
        parametros.forEach(async(item) =>{ 
            console.log(item[0] , item[1])
            await page.$eval( `#${item[0]}`, (el, val) => el.innerText = val, (item[0].includes('Fecha') ? String(item[1]).slice(0,10) : item[1] ) )
        })
    ])
    .then(() => {console.log('ya termino de completar el formulario')})
    .then(() => {
        setTimeout(() => {
            console.log('ahora imprime en pdf')
            printPage(nroOt)
        }, 500);
    })

    //await page.$eval( '#getData' , btn => btn.click() )
}
/**
 * Funcion 
 * @param {number} nroOt - pasamos el nro de ot que queremos imprimir 
 */
const printPage = async (nroOt) => {
    try {
        //let fileName = moment().format('YYYYMMDDhhmmss')
        await page.emulateMediaType('print')
        await page.pdf({ path: `./src/public/${nroOt}.pdf`, format: 'Legal', scale: 0.98 })
        //await page.screenshot({ path: 'screenshot.png' })
        fileExist =1;
        console.log('impresion lista!')
    } catch (error) { /*si hay error en la creacion del pdf */ }
}

app.get('/', async (req , res )=>{ 
    res.send('servidor impresion ot')
})

app.get('/print/:ot', async (req , res )=>{
    //console.time('print')
    const nroOt = req.params.ot
    await getPage(nroOt)
    res.send('impresion lista ' + moment().format('YYYY-MM-DD hh:mm:ss'))

    // let findFile = setInterval(() => {
    //     if (fileExist === 1 ){
    //         res.send('impresion lista ' + moment().format('YYYY-MM-DD hh:mm:ss'))
    //         //res.download(path.join(__dirname, `/public/${nroOt}.pdf`), (err)=>{/*si hubo un error en la descarga del archivo*/} )
    //         console.timeEnd('print')
    //         console.log('se descargo el pdf nro ot ', nroOt)
    //         fileExist = 0 
    //         clearInterval(findFile)
    //     } 
    // }, 500);


})

app.get('/orden/:ot', async(req, res )=>{
    const ot = req.params.ot
    const datos = await sql.query(req.params.ot)
    console.log(datos)
    res.send(datos)

})






app.listen(3200, console.log('servidor impresion ot port 3200'))
