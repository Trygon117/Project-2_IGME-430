const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const Novel = require('./Novel.js');

const saltRounds = 10;

let AccountModel = {};

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
    type: Array, // an array of maps which are the different shelves
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
  const session = req.session.account;

  await AccountModel.findById(userID, (err, doc) => {
    if (err) {
      console.log('an error');
      console.log(err);
      handler({ error: 'An error has occurred' });
      return;
    }

    if (doc === null) {
      handler({ error: 'No Account Found' });
      return;
    }

    let user = doc;

    // console.log('doc');
    // console.log(doc);

    // console.log('session');
    // console.log(session);

    // hide some information about users from others
    if (session._id.toString() !== doc._id.toString()) {
      console.log('hiding account info');
      user = { username: doc.username, library: doc.library };
    }

    user.password = 'Nice Try!';

    handler(user);
  }).clone().catch((err) => {
    console.log('caught error');
    console.log(err);
    handler({ error: 'An error has occurred' });
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
    docs.forEach((user) => {
      console.log();
      if (session._id !== user._id || session.username !== user.username) {
        users[user.username] = { username: user.username, library: user.library };
      } else {
        users[user.username] = user;
        users[user.username].password = 'Nice Try!';
      }
    });

    if (Object.keys(users).length === 0) {
      console.log('No users Found');
      handler({ error: 'No Users Found' });
      return;
    }

    console.log('found users');

    handler(users);
  }).clone().catch((err) => {
    console.log('caught error');
    console.log(err);
    handler({ error: 'An error has occurred' });
  });
};

// update the content of a specific account
const updateAccountByID = async (req, updates, handler) => {
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

    // console.log('user');
    // console.log(user);
    // console.log(user._id);
    // console.log(req.session.account._id);

    // You can only update novels that you are the author of
    if (user._id.toString() !== req.session.account._id) {
      handler({ error: 'User does not have permission to edit the data of this Account' });
      return;
    }

    const updatedUser = user;

    Object.entries(updates).forEach((entry) => {
      const [key, value] = entry;
      switch (key) {
        case 'username':
          updatedUser.username = value;
          break;
        case 'password':
          updatedUser.password = value;
          break;
        case 'library':
          updatedUser.library = value;
          break;
        case 'chapters':
          updatedUser.chapters = value;
          break;
        default:
          break;
      }
    });

    const result = await updatedUser.save();

    result.password = 'Nice Try!';

    handler(result);
  }).clone().catch((err) => {
    console.log('caught error');
    console.log(err);
    handler({ error: 'An error has occurred' });
  });
};

const updateLibrary = async (req, handler) => {
  console.log('update library');

  const session = req.session.account;

  return AccountModel.findById(session._id, async (err, user) => {
    if (err) {
      console.log('an error');
      console.log(err);
      return { error: 'An error has occurred' };
    }

    // console.log('user');
    // console.log(user);

    // unfortunatly we have to load all novels because we are only allowed to use for each loops
    const allNovels = await Novel.NovelModel.find();

    // console.log('allNovels');
    // console.log(allNovels);

    let userLibrary = user.library;
    if (userLibrary === undefined) {
      userLibrary = [];
    }

    const newLibrary = [];

    userLibrary.forEach((shelf) => {
      const newShelf = {};

      Object.keys(shelf).forEach(async (key) => {
        if (key === 'title') {
          newShelf[key] = shelf[key];
        } else {
          allNovels.forEach((novel) => {
            if (novel._id.toString() === key) {
              // console.log('novel');
              // console.log(novel);
              newShelf[key] = novel;
            }
          });
        }
      });

      // console.log('newShelf');
      // console.log(newShelf);

      newLibrary.unshift(newShelf);
    });

    // console.log('library');
    // console.log(library);

    const updatedUser = user;
    updatedUser.library = newLibrary;
    updatedUser.save();

    // console.log(updatedUser);

    return handler();
  }).clone().catch((err) => {
    console.log('caught error');
    console.log(err);
    return { error: 'An error has occurred' };
  });
};

module.exports = {
  AccountModel,
  searchByID,
  searchByCriteria,
  updateAccountByID,
  updateLibrary,
};
