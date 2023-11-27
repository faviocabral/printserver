const knex = require('./config.js')
/**
 * Function de consulta sql
 * @param {number} nroOt - pasamos el nro de ot que queremos retornar de la base 
 * @returns {array} - retorna un array de objeto de la base datos 
 */
const queryServicio = async(nroOt)=> {
    try {
        const sql = `SELECT 
        callID NroOt
        , callID NroLlamada
        , DocNum NroDocumento
        , createDate FechaApertura 
        , isnull( closeDate, '') FechaCierre 
        , (select top 1 v.DocDate 
            from  OINV v with(nolock), INV1 d 
            where v.DocEntry = d.DocEntry 
            and v.cardname not like '%garden%'
            and v.u_liiv = 1 
            and d.ItemCode = OSCL.itemCode ORDER BY V.DOCDATE ASC ) FechaVenta
        --, status OtEstado 
        , customer CodigoCliente 
        , custmrName NombreCliente 
        , (select top 1 address from ocrd with(nolock) where cardcode = oscl.customer ) Direccion
        , (select top 1 isnull( phone1, '') + ' - ' + isnull( Phone2, '') + ' - ' + isnull( Cellular, '')  from ocrd with(nolock) where cardcode = oscl.customer ) Telefono
        , itemCode Chassis 
        --, itemName Vehiculo 
        , Street Chapa 
        , Room Identificador 
        , U_KmEntrada Kilometraje 
        , U_KmSalida KilometrajeSalida 
		,UPPER( case U_Tipo 
            when 1 then '1 - Cargo Cliente' 
            when 2 then '2 - Pre - Entrega' 
            when 3 then '3 - Garantia' 
            when 4 then '4 - Rep. Usado vta' 
            when 5 then '5 - Promocion' 
            when 6 then '6 - Uso Taller/Garden' 
            when 7 then '7 - Service en Casa' 
          end ) as TipoServicio
        , (select upper(name) from OSCT t1 with(nolock) where oscl.callType = t1.callTypeID )TipoLlamada  
        ,subject Motivo 
        ,descrption PedidoCliente 
        ,isnull(resolution, '') Observacion
        ,(select t2.Name from oitm t1 with(nolock), [@COLOR]  t2 where ItemCode = oscl.itemcode and t1.U_Color = t2.Code ) Color
        ,(	
            select t2.Name marca 
            from OITM t1 with(nolock), [@MARCAS] t2 , [@MODELOS] t3 
            where t1.U_Marca = t2.Code 
            and t1.U_Modelo = t3.Code
            and itemcode = oscl.itemCode
        )Marca 
        , itemName Modelo
        /*,(	
            select t3.Name modelo
            from OITM t1 with(nolock), [@MARCAS] t2 , [@MODELOS] t3 
            where t1.U_Marca = t2.Code 
            and t1.U_Modelo = t3.Code
            and itemcode = oscl.itemCode
        )Modelo2*/
        ,(select U_NAME from ousr with(nolock) where oscl.ASSIGNEE = USERID ) Asesor
        ,(select U_NAME + ' - ' + isnull( MobileIMEI, '' ) from ousr where oscl.ASSIGNEE = USERID ) Asesor2, 
        --isnull( Observaciones, '') Observaciones, 
        --isnull( Detalle_vehiculo, '') as DetalleVehiculo , 
        'Accesorios: ' + isnull( Accesorios, '') +' - Observaciones: '+ isnull(Observaciones, '') Accesorios, 
        isnull( Combustible, 0) Combustible, 
        isnull( Combustible, 0) Combustible2, 
        isnull( contacto_cliente, '') as contacto_cliente, 
        replace( left( convert( varchar(100), t1.fecha_promesa ,121 ),16), '-', '/') as FechaPrometida, 
        --t1.sucursal sucursal ,
        --t1.campanha campanha , 
        isnull((select E_Mail from OCRD with(nolock)  where CardCode = oscl.customer), t1.email ) as contacto_email , 
        case when t1.lavado = 'SI' then 'X' else '' end lavadoSi,
        case when t1.lavado = 'SI' then '' else 'X' end lavadoNo,
        t1.costoServicio
    FROM OSCL with(nolock) left outer join control.dbo.ot_tablet T1 with(nolock) on OSCL.callID = t1.ot 
    WHERE ( callID = ${nroOt} ) 
    `
    const datos = await knex.raw(sql)
    return datos 

    } catch (error) {
        console.log('hubo un error en la consulta sql ', error)
    }
}


/**
 * Function de consulta sql
 * @param {number} nroOt - pasamos el nro de ot que queremos retornar de la base 
 * @returns {array} - retorna un array de objeto de la base datos 
 */
const queryMora = async(nroOt)=> {
    try {
    const sql = `
    select top 1 datediff( day , t2.DueDate  , getdate() ) mora 
    from oinv t1 with(nolock)
        inner join inv6 t2 with(nolock) on t1.DocEntry = t2.DocEntry 
        inner join INV1 t3 with(nolock) on t1.DocEntry = t3.DocEntry 
    and t1.U_ConceptoFactura = 'vhe' 
    and t1.U_LIIV = 1 
    where  ( t2.InsTotal - t2.PaidToDate ) <> 0 
    and t2.DueDate <= GETDATE() 
    and t3.ItemCode =(select top 1 itemcode from oscl where callid = ${nroOt}) 
    and t1.cardcode not in ( 'CGARA956330O' , 'CGAUA0266090C' , 'C80091866-5')
    order by t2.DueDate
    `
    const datos = await knex.raw(sql)
    return datos 
        
    } catch (error) {
        console.log('hubo un error en la consulta sql ', error)
    }
}

/**
 * Function de consulta sql
 * @param {number} nroOt - pasamos el nro de ot que queremos retornar de la base 
 * @returns {array} - retorna un array de objeto de la base datos 
 */
const queryCampaña = async(nroOt)=> {
    try {
        const sql = `
        select top 1 'Vehiculo con Campaña!' texto
        from ( 
            select distinct t1.Cod_Camp CODIGO, vin VIN, open_date FECHA, status ESTADO, upper( Desc_camp ) TRABAJO , upper( tipo ) TIPO , ot OT , t1.marca
            from control.dbo.campanha t1 
            inner join control.dbo.Des_Camp t2 on t1.Cod_Camp = t2.Cod_Camp 
            where vin COLLATE Modern_Spanish_CI_AS = ( select top 1 right( itemcode , 17) from oscl where callid = ${nroOt} ) 
            )tabla 
        `
        const datos = await knex.raw(sql)
        return datos 
            
    } catch (error) {
        console.log('hubo un error en la consulta sql ', error)
    }
}

/**
 * Function de consulta sql
 * @param {number} nroOt - pasamos el nro de ot que queremos retornar de la base 
 * @returns {array} - retorna un array de objeto de la base datos 
 */
const queryPlanPlus = async(nroOt)=> {
    try {
        const sql = `
        select 'Plan Plus 3 ( Servicio Gratuito )' texto
        from oinv t1 with(nolock)
            inner join inv1 t2 with(nolock) on t1.docentry = t2.docentry 
        where u_conceptofactura = 'vhe'
            and t1.Project in ('PLAN_PLUS_3_36' , 'PLAN_PLUS_3_48')
            and t1.U_LIIV = '1'
            and right( t2.itemCode , 12)= ( select top 1 right(itemcode, 12) from oscl where callid = ${nroOt}) 
        `
        const datos = await knex.raw(sql)
        return datos 
    } catch (error) {
        console.log('hubo un error en la consulta sql ', error)
    }
}

module.exports = {queryServicio , queryMora, queryCampaña, queryPlanPlus }