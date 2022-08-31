/**
 * This file sets up the connection to the database using node-mssql.
 * The connection pool is exported and used for every db interaction.
 */

const sql = require('mssql')

const connectionString = process.env.DB_CONNECTION_STRING;

/**
 * Gets a connection pool to the database
 * that will be used for all queries.
 * @returns A promise for an mssql connection pool
 */
 async function getPool() {
    return sql.connect(connectionString);
}

/**
 * Logs any SQL error
 */
sql.on('error', err => {
    console.log(err);
})

// Connection pool that is used for all queries.
// Logic for exporting an awaited object came from here
// https://stackoverflow.com/a/30356582
const poolAsync = getPool();

module.exports = { sql, poolAsync }