/**
 * This file handles all business logic for users.
 */

const { getFederatedCredentials, userExists,
    insertUser, insertFederatedCredentials, getUserById } = require('../models/models_users.js')

/**
 * Checks if user exists. If it doesn't, adds them. Returns their ID.
 * @param {string} issuer e.g. google.com
 * @param {string} profile unique id from issuer
 * @returns object containing user id
 */
async function verifyUser(issuer, profile) {

    try {
        let federatedCredentials = await getFederatedCredentials(issuer, profile);

        if (federatedCredentials) {
            if (userExists(federatedCredentials.userId)) {
                return { userId: federatedCredentials.userId };
            }
        } else {
            let userId = await insertUser(issuer, profile);
            await insertFederatedCredentials(issuer, profile, userId);
            return {
                userId: userId
            };
        }
    }
    catch (err) {
        console.log("couldnt verify user ", err);
    }
}

/**
 * Gets the user by their id
 * @param {string} userId userId (GUID)
 * @returns user
 */
async function getUser(userId) {
    return await getUserById(userId);
}

module.exports = { verifyUser, getUser };