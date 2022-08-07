const { getFederatedCredentials, userExists,
    addUser, addFederatedCredentials, getUserById } = require('../models/users.js')

async function verifyUser(issuer, profile) {

    let federatedCredentials = await getFederatedCredentials(issuer, profile);
    if (federatedCredentials) {
        if (userExists(federatedCredentials.userId)) {
            return { userId: federatedCredentials.userId };
        }
    } else {
        let userId = await addUser(issuer, profile);
        await addFederatedCredentials(issuer, profile, userId);
        return {
            userId: userId
        };
    }
}

async function getUser(userId) {
    return await getUserById(userId);
}

module.exports = { verifyUser, getUser };