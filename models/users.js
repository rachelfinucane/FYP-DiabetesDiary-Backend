// From docs: https://www.npmjs.com/package/mssql#promises
const sql = require('mssql')

sql.on('error', err => {
    // ... error handler
})

const connectionString = "Server=tcp:db-server-diabetes-diary.database.windows.net,1433;Initial Catalog=db-diabetes-diary;Persist Security Info=False;User ID=c18735641;Password=rk-yGH7P*NN*Bk_ajUZd;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"

async function getFederatedCredentials(issuer, profile) {
    let pool = await sql.connect(connectionString);
    let result = await pool.request()
        .input('provider', sql.VarChar, issuer)
        .input('subject', sql.VarChar, profile.id)
        .query('SELECT * FROM FederatedCredentials WHERE provider = @provider AND subject = @subject');

    console.log("get federated ", result.recordsets[0][0]);
    return (result.recordsets[0][0]);
}

async function getUserById(userId) {
    let pool = await sql.connect(connectionString);
    let result = await pool.request()
        .input('UserId', sql.UniqueIdentifier, userId)
        .query('SELECT * FROM Users WHERE UserId = @UserId');
    return result.recordsets[0][0];
}

async function userExists(userId) {
    let pool = await sql.connect(connectionString);
    let result = await pool.request()
        .input('UserId', sql.UniqueIdentifier, userId)
        .query('SELECT * FROM Users WHERE UserId = @UserId');
    console.log("get user ", result);
    return result.rowsAffected[0] > 0;
}

async function addUser(issuer, profile) {
    let pool = await sql.connect(connectionString);
    let result = await pool.request()
        .input('Username', sql.VarChar, profile.displayName)
        .query('INSERT INTO Users (username) OUTPUT inserted.UserId VALUES (@username)');

    console.log("add user ", result);
    return (result.recordsets[0][0].UserId);
}

async function addFederatedCredentials(issuer, profile, userId) {
    let pool = await sql.connect(connectionString);
    let result = await pool.request()
        .input('UserId', sql.UniqueIdentifier, userId)
        .input('Provider', sql.VarChar, issuer)
        .input('Subject', sql.VarChar, profile.id)
        .query('INSERT INTO FederatedCredentials (UserId, Provider, Subject) VALUES (@UserId, @Provider, @Subject)')
    console.log("add fed ", result);
}

// async function verifyUser(issuer, profile) {
//     console.log("issuer: ", issuer, "\nprofile: ", profile);

//     let federatedCredentials = await getFederatedCredentials(issuer, profile);
//     if (federatedCredentials) {
//         if (userExists(federatedCredentials.userId)) {
//             console.log("user exists: ", federatedCredentials);
//             return { userId: federatedCredentials.userId };
//         }
//     } else {
//         let userId = await addUser(issuer, profile);
//         await addFederatedCredentials(issuer, profile, userId);
//         return {
//             userId: userId
//         };
//     }
// }


// sql.connect(connectionString).then(pool => {
//     // Query

//     return pool.request()
//         .input('provider', sql.VarChar, issuer)
//         .input('subject', sql.VarChar, profile.id)
//         // .query('select * from mytable where id = @input_parameter')
//         .query('SELECT * FROM FederatedCredentials WHERE provider = @provider AND subject = @subject')
//         .then(result => {
//             console.log("successfully selected: ", result);
//             console.log("successfully selected: ", result.rowsAffected);

//             if (result.rowsAffected[0]) {
//                 console.log("record exists");
//                 // // 'SELECT * FROM users WHERE id = ?', [ row.user_id ]

//                 // return pool.request()
//                 // .input('id', sql.UniqueIdentifier, todo)
//                 // // .query('select * from mytable where id = @input_parameter')
//                 // .query('SELECT * FROM Users WHERE id = @issuer AND subject = @profile')
//                 console.log("User exists: ", result);
//             } else {
//                 return pool.request()
//                     .input('username', sql.VarChar, profile.displayName)
//                     .query('INSERT INTO Users (username) OUTPUT inserted.UserId VALUES (@username)')
//                     .then((result) => {
//                         console.log("id", result);
//                         console.log("id", result.recordsets[0][0].UserId);
//                         return pool.request()
//                             .input('UserId', sql.UniqueIdentifier, result.recordsets[0][0].UserId)
//                             .input('Provider', sql.VarChar, issuer)
//                             .input('Subject', sql.VarChar, profile.id)
//                             .query('INSERT INTO FederatedCredentials (UserId, Provider, Subject) VALUES (@UserId, @Provider, @Subject)')
//                     })
//                     .then(result => console.log("final result", result));
//             }
//         })
// }).catch(err => {
//     console.log(err);
//     return cb(null, false);
// });



// // get users
// function getFederatedCredential(issuer, profile) {
//     sql.connect(connectionString).then(pool => {
//         // Query

//         return pool.request()
//             .input('issuer', sql.VarChar, value)
//             .input('profile', sql.VarChar, value)
//             // .query('select * from mytable where id = @input_parameter')
//             .query('SELECT * FROM federated_credentials WHERE provider = @issuer AND subject = @profile')
//     }).then(result => {
//         console.dir(result)
//     }).catch(err => {
//         // ... error checks
//     });
// }
// insert users

// get federated users
// insert federated users

module.exports = { getFederatedCredentials, getUserById, userExists, addUser, addFederatedCredentials };