const {sql, poolAsync } = require('./db');

// const pool = await poolAsync;

async function getFederatedCredentials(issuer, profile) {
    // let pool = await sql.connect(connectionString);
    const pool = await poolAsync;
    let result = await pool.request()
        .input('provider', sql.VarChar, issuer)
        .input('subject', sql.VarChar, profile.id)
        .query('SELECT * FROM FederatedCredentials WHERE provider = @provider AND subject = @subject');

    return (result.recordsets[0][0]);
}

async function getUserById(userId) {
    // let pool = await sql.connect(connectionString);
    const pool = await poolAsync;
    let result = await pool.request()
        .input('userId', sql.UniqueIdentifier, userId)
        .query('SELECT * FROM Users WHERE userId = @userId');
    return result.recordsets[0][0];
}

async function userExists(userId) {
    // let pool = await sql.connect(connectionString);
    const pool = await poolAsync;
    let result = await pool.request()
        .input('userId', sql.UniqueIdentifier, userId)
        .query('SELECT * FROM Users WHERE userId = @userId');
    return result.rowsAffected[0] > 0;
}

async function insertUser(issuer, profile) {
    // let pool = await sql.connect(connectionString);
    const pool = await poolAsync;
    let result = await pool.request()
        .input('Username', sql.VarChar, profile.displayName)
        // https://stackoverflow.com/questions/36745952/node-mssql-transaction-insert-returning-the-inserted-id
        // For returning the inserted ID
        .query('INSERT INTO Users (username) OUTPUT inserted.userId VALUES (@username)');

    return (result.recordsets[0][0].userId);
}

async function insertFederatedCredentials(issuer, profile, userId) {
    // let pool = await sql.connect(connectionString);
    const pool = await poolAsync;
    let result = await pool.request()
        .input('userId', sql.UniqueIdentifier, userId)
        .input('Provider', sql.VarChar, issuer)
        .input('Subject', sql.VarChar, profile.id)
        .query('INSERT INTO FederatedCredentials (userId, Provider, Subject) VALUES (@userId, @Provider, @Subject)')
}

module.exports = { getFederatedCredentials, getUserById, userExists, insertUser, insertFederatedCredentials };