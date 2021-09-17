// Helper for exposing JSON web APIs
// Firebase's onCall functions look to be just what we want - both client and server APIs are pretty clean and straightforward,
// but they are great right up until you try to use them. Permission issues, CORS issues, issues running in the dev emulator
// vs production, etc. After burning a whole day on this nonsense, I'm giving up and writing a single entry point that works
// the way we want, and it then fans out to sub-functions for individual tasks
// Note: the above is from sometime in early 2020 IIRC - maybe things are better now? Anyway, we use the same code for 3 main
// scenarios:
// - anonymous functions: login API
// - user-auth'd functions: stuff from the launcher
// - admin functions: Modus admin web UI
const admin = require('firebase-admin');
const functions = require("firebase-functions");
const { GetDoc, firestore } = require('./utils.js');

const ACCESS_ADMIN = exports.ACCESS_ADMIN ='A';
const ACCESS_ANONYMOUS = exports.ACCESS_ANONYMOUS = '?';
const ACCESS_USER = exports.ACCESS_USER = 'U';

// Use this to expose one or more functions as JSON APIs, where actions is an object with individual handler functions, e.g.
// exports.main = jsonapis.Expose({test, myfunc}); // exposes test and myfunc as web-callable.
// Each handler function should be marked as async and is called like (payload, user, request, response) where payload is the
// parsed JSON payload of the request and the user is the user making the request (null for anonymous APIs, an object with a
// few members for admin APIs, and a User record for user APIs). The return value from each should be an object to be
// converted to JSON and returned to the caller.
// By default, a function is only callable by admins (but can be changed with the defaultAccess parameter). To make one function
// anonymously callable, mark it like:
//   async function foo(...) {}
//   foo.anonymous = true;
// Similarly, to make it callable by a user (customer):
//   foo.user = true;
exports.Expose = function(actions, defaultAccess=ACCESS_ADMIN)
{
    return functions.https.onRequest(async (req, resp) =>
    {
        // make it work with CORS
        resp.append('Access-Control-Allow-Origin', '*');
        resp.append('Access-Control-Allow-Headers', 'Content-Type');
        resp.append('Access-Control-Allow-Methods', 'POST, OPTIONS');
        if (req.method == 'OPTIONS')
            return resp.status(204).end();

        // dispatch
        let ret = null;
        try
        {
            let user = null;
            let customer = null;

            //console.log('ACTION:', req.body.action);
            let func = actions[req.body.action];
            if (!func)
                throw `Invalid action "${req.body.action}"`;

            // make a note of what type of access the caller needs to have
            let requiredAccess = defaultAccess;
            if (func.admin)
                requiredAccess = ACCESS_ADMIN;
            else if (func.user)
                requiredAccess = ACCESS_USER;
            else if (func.anonymous || func.anon)
                requiredAccess = ACCESS_ANONYMOUS;

            if (requiredAccess != ACCESS_ANONYMOUS)
            {   // some sort of authentication is required
                if (!req.body.auth)
                    throw 'Not authenticated';

                if (requiredAccess == ACCESS_ADMIN)
                {
                    let tok = await admin.auth().verifyIdToken(req.body.auth);
                    if (tok && tok.admin === true)
                        user = {id:tok.uid, email:tok.email}; // the token is some OpenID thing with the custom claims on the top level - there are other properties we can add to user as needed
                    else
                        throw 'Invalid user or login';
                }
                else
                {   // user access - for now we need to maintain compatibility with existing launchers, and the way they
                    // make authenticated calls is to pass 'u' (username / email) and 'h' (password hash) parameters in every call. :(
                    let reqAuth = req.body.auth;
                    if (!reqAuth || !reqAuth.u || !reqAuth.h)
                        throw 'Invalid cloud call';
                    let u = await GetDoc(firestore.collection('User').where('email', '==', reqAuth.u.toLowerCase()));
                    if (!u)
                        throw 'Invalid user or login [CC]';
                    if (reqAuth.h != u.passwordHash)
                        throw 'Invalid user or login [CCh]';
                    user = u;
                    customer = await GetDoc('Customer', u.customer);
                }
            }

            // call the handler and collect its response
            ret = await func(req.body.payload, {customer, user, req, resp});
        } catch (e)
        {
            if (typeof e == 'string')
            {
                console.log('ERROR:', e);
                ret = {error:e};
            }
            else
            {
                console.log('ERROR:', e.name, e.message, e.stack);
                ret = {error:'Unhandled exception', name:e.name, message:e.message, stack:JSON.stringify(e.stack)};
            }
        }
        resp.append('Content-Type', 'application/json');
        resp.status(200).send(JSON.stringify(ret));
    });
}

