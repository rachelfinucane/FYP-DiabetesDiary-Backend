/**
 * This file handles all db interaction regarding users
 */

const {sql, poolAsync } = require('./db');

/**
 * Gets the federated credentials (userId, federatedCredentialId, provider, subject)
 * for a given unique issuer, profile pair
 * @param {string} issuer e.g. google.com
 * @param {string} profile a unique id from the issuer
 * @returns the federated credentials (table where store google, facebook, microsoft info)
 */
async function getFederatedCredentials(issuer, profile) {
    const pool = await poolAsync;
    let result = await pool.request()
        .input('provider', sql.VarChar, issuer)
        .input('subject', sql.VarChar, profile.id)
        .query('SELECT * FROM FederatedCredentials WHERE provider = @provider AND subject = @subject');

    return (result.recordsets[0][0]);
}

/**
 * Gets user info for a given user from the db
 * @param {string} userId the userId
 * @returns user information for the given user
 */
async function getUserById(userId) {
    // let pool = await sql.connect(connectionString);
    const pool = await poolAsync;
    let result = await pool.request()
        .input('userId', sql.UniqueIdentifier, userId)
        .query('SELECT * FROM Users WHERE userId = @userId');
    return result.recordsets[0][0];
}

/**
 * Checks if a user exists in the database.
 * @param {string} userId the userId
 * @returns true if user exists, false if user does not exist
 */
async function userExists(userId) {
    // let pool = await sql.connect(connectionString);
    const pool = await poolAsync;
    let result = await pool.request()
        .input('userId', sql.UniqueIdentifier, userId)
        .query('SELECT * FROM Users WHERE userId = @userId');
    return result.rowsAffected[0] > 0;
}

/**
 * Adds a user to the db.
 * @param {string} issuer e.g. google.com
 * @param {string} profile unique id from issuer
 * @returns userId of the inserted user
 */
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

/**
 * Inserts the login credentials for e.g. google.com
 * @param {string} issuer e.g. google.com
 * @param {string} profile unique id from issuer
 * @param {string} userId the userId
 */
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