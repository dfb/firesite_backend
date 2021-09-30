// main entry point for all backend functions
const admin = require('firebase-admin');
admin.initializeApp();
const firesite = require('./firesite');

exports.main = firesite.jsonapis.Expose({login:firesite.users.login});

