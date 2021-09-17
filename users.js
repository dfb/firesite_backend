// user/auth related stuff
const database = require('./database');
const admin = require('firebase-admin');

// for use with jsonapis - logs a user in
async function login({u, h})
{
    if (!u || u.length == 0 || !h || h.length == 0)
        return {error:'Missing args'};

    let user = await database.GetDoc(database.firestore.collection('User').where('email', '==', u));
    if (!user || user.passwordHash != h)
        return {error:'Unknown user or incorrect password'};

    // seems legit, create an auth token for Firebase
    let token = await admin.auth().createCustomToken(user.id, {roles:user.roles || {}});
    return {error:'', token};
}
login.anon = true;
exports.login = login;

