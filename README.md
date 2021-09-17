# firesite_backend
Server-side code to accompany firesite repo

The [Firesite](https://github.com/dfb/firesite) project combines some code/steps I found myself repeating over and over while building some small websites on top of [Firebase](https://firebase.google.com/). The code in this repo assists in developing the server side / cloud functions. Ideally it'd live in the same repo as Firesite, but I spent way too much time battling Node and other tools trying to get that to work (I don't want websites to fork this project, but to just use the code in a way that's easy to keep them up to date as more features are added), so for now I'm punting and splitting things into two separate projects.

This project supplies a ready-made backend login function (assuming you are willing to abide by its conventions), some ease-of-use helpers, and some wrappers for making it easier to expose APIs to the client side of things.

# Setup
It is assumed that you've already been through the setup work for setting up a Firesite project.

1. Create a 'functions' directory if one does not already exist (and if it did not exist, run 'npm init' in it).
1. `cd` into the functions dir.
1. Run `git clone git@github.com:dfb/firesite_backend.git firesite`
1. Run `npm i uuid firebase-admin firebase-functions`.
1. Create an index.js with the following:

```js
// main entry point for all backend functions
const admin = require('firebase-admin');
admin.initializeApp();
const firesite = require('./firesite');
exports.main = firesite.jsonapis.Expose({login:firesite.users.login});
```

# Usage
If all you need to do is support logging in, the instructions in the Setup section are sufficient. If you want to expose additional cloud functions to call from your website, define them and expose them in the `firesite.jsonapis.Expose` line. See `jsonapis.js` for information on conventions, especially on controlling access. Be careful that you don't expose powerful functions to anonymous users!

To deploy modifications: `firebsae deploy --only functions`

