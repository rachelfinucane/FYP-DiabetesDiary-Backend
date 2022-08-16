// From docs: https://www.npmjs.com/package/mssql#promises
const sql = require('mssql')

const connectionString = process.env['DB_CONNECTION_STRING'];

/**
 * 
 * @returns A promise for an mssql connection pool
 */
 async function getPool() {
    return sql.connect(connectionString);
}

sql.on('error', err => {
    console.log(err);
})

// Logic for exporting an awaited object came from here
// https://stackoverflow.com/a/30356582

let poolAsync = getPool();

module.exports = { sql, poolAsync }