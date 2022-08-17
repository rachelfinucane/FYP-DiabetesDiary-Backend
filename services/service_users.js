const { getFederatedCredentials, userExists,
    insertUser, insertFederatedCredentials, getUserById } = require('../models/models_users.js')

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

async function getUser(userId) {
    return await getUserById(userId);
}

module.exports = { verifyUser, getUser };