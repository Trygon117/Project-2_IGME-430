/* This file defines our schema and model interface for the account data.

   We first import bcrypt and mongoose into the file. bcrypt is an industry
   standard tool for encrypting passwords. Mongoose is our tool for
   interacting with our mongo database.
*/
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const Novel = require('./Novel.js');

/* When generating a password hash, bcrypt (and most other password hash
   functions) use a "salt". The salt is simply extra data that gets hashed
   along with the password. The addition of the salt makes it more difficult
   for people to decrypt the passwords stored in our database. saltRounds
   essentially defines the number of times we will hash the password and salt.
*/
const saltRounds = 10;

let AccountModel = {};

/* Our schema defines the data we will store. A username (string of alphanumeric
   characters), a password (actually the hashed version of the password created
   by bcrypt), and the created date.
*/
const AccountSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    match: /^[A-Za-z0-9_\-.]{1,16}$/,
  },
  password: {
    type: String,
    required: true,
  },
  premium: {
    type: Boolean,
    required: true,
    default: false,
  },
  library: {
    type: Array,  // an array of maps which are the different shelves
  },
  chapters: { // A map with the id of the novel as the key and a chapter number as a value
    type: Map,
  },
  createdDate: {
    type: Date,
    default: Date.now,
  },
});

// Converts a doc to something we can store in redis later on.
AccountSchema.statics.toAPI = (doc) => ({
  username: doc.username,
  _id: doc._id,
});

// Helper function to hash a password
AccountSchema.statics.generateHash = (password) => bcrypt.hash(password, saltRounds);

/* Helper function for authenticating a password against one already in the
   database. Essentially when a user logs in, we need to verify that the password
   they entered matches the one in the database. Since the database stores hashed
   passwords, we need to get the hash they have stored. We then pass the given password
   and hashed password to bcrypt's compare function. The compare function hashes the
   given password the same number of times as the stored password and compares the result.
*/
AccountSchema.statics.authenticate = async (username, password, callback) => {
  try {
    const doc = await AccountModel.findOne({ username }).exec();
    if (!doc) {
      return callback();
    }

    const match = await bcrypt.compare(password, doc.password);
    if (match) {
      return callback(null, doc);
    }
    return callback();
  } catch (err) {
    return callback(err);
  }
};

AccountModel = mongoose.model('Account', AccountSchema);

// helper functions

// find a single account by its _id
const searchByID = async (req, userID, handler) => {
  const sessionUsername = req.session.account.username;

  await AccountModel.findById(userID, (err, doc) => {
    if (err) {
      console.log('an error');
      console.log(err);
      handler({ error: 'An error has occurred' });
      return;
    }

    if (doc === null) {
      handler({ error: "No Account Found" });
      return;
    }

    let user = doc;

    // hide some information about users from others
    if (doc._id != userID || sessionUsername != doc.username) {
      user = { username: doc.username, library: doc.library };
    }

    handler(user);
    return;
  }).clone().catch((err) => {
    console.log('caught error');
    console.log(err);
    handler({ error: 'An error has occurred' });
    return;
  });
};

// find multiple accounts that meet the given filter requirements
const searchByCriteria = async (req, userFilters, handler) => {
  const session = req.session.account;

  await AccountModel.find(userFilters, (err, docs) => {
    if (err) {
      console.log('an error');
      console.log(err);
      handler({ error: 'An error has occurred' });
      return;
    }

    console.log(docs);

    const users = {};

    // hide information about novels the user isn't allowed to access
    docs.forEach(user => {

      console.log()
      if (session._id != user._id || session.username != user.username) {
        users[user.username] = { username: user.username, library: user.library };
      } else {
        users[user.username] = user;
      }
    });

    if (Object.keys(users).length === 0) {
      console.log('No users Found');
      handler({ error: 'No Users Found' });
      return;
    }

    console.log('found users');

    handler(users);
    return
  }).clone().catch((err) => {
    console.log('caught error');
    console.log(err);
    handler({ error: 'An error has occurred' });
    return;
  });
};

// update the content of a specific account
const updateAccountByID = async (req, updates, handler) => {
  const sessionUsername = req.session.account.username;

  await AccountModel.findById(updates.userID, async (err, user) => {
    if (err) {
      console.log('an error');
      console.log(err);
      handler({ error: 'An error has occurred' });
      return;
    }

    if (!user) {
      handler({ error: 'No User Found' });
      return;
    }

    // You can only update novels that you are the author of
    if (user._id != updates.userID) {
      handler({ error: "User does not have permission to edit the data of this novel " });
      return;
    }

    Object.entries(updates).forEach(entry => {
      const [key, value] = entry;
      switch (key) {
        case 'username':
          user.username = value;
          break;
        case 'password':
          user.password = value;
          break;
        case 'library':
          user.library = value;
          break;
        default:
          break;
      }
    });


    result = await user.save();


    handler(result);
    return;

  }).clone().catch((err) => {
    console.log('caught error');
    console.log(err);
    handler({ error: 'An error has occurred' });
    return;
  });
};

const updateLibrary = async (req) => {

  const session = req.session.account;

  await AccountModel.findById(session._id, async (err, user) => {
    if (err) {
      console.log('an error');
      console.log(err);
      handler({ error: 'An error has occurred' });
      return;
    }

    console.log(user);

    const library = [];

    for (const shelf of user.library) {
      const newShelf = {};
      for (const key of Object.keys(shelf)) {
        if (key === 'title') {
          newShelf[key] = shelf[key];
          continue;
        }
        await Novel.searchByID(req, key, (response) => {
          if (!response.error) {
            newShelf[key] = response;
          }
        });
      }
      library.unshift(newShelf);
    }

    const updatedUser = user;
    updatedUser.library = library;
    updatedUser.save();

  }).clone().catch((err) => {
    console.log('caught error');
    console.log(err);
    handler({ error: 'An error has occurred' });
    return;
  });
}


module.exports = {
  AccountModel,
  searchByID,
  searchByCriteria,
  updateAccountByID,
  updateLibrary,
};

