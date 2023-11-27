const config = {
    client: 'mssql',
    connection: {
      host : process.env.SQL_HOST,
      user : process.env.SQL_USER,
      password : process.env.SQL_PASS,
      database : process.env.SQL_DATABASE
    }
  }
module.exports = require('knex')(config); 