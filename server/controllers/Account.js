const models = require('../models');

const { Account } = models;
const { Novel } = models;

const loginPage = (req, res) => {
  const csrfToken = req.csrfToken();
  // console.log(`Login Page csrf: ${csrfToken}`);
  res.render('login', { csrfToken });
};

const logout = (req, res) => {
  req.session.destroy();
  res.json({ redirect: '/' });
};

const login = (req, res) => {
  const username = `${req.body.username}`;
  const pass = `${req.body.pass}`;

  if (!username || !pass) {
    return res.status(400).json({ error: 'All fields are required!' });
  }

  return Account.AccountModel.authenticate(username, pass, (err, account) => {
    if (err || !account) {
      return res.status(401).json({ error: 'Wrong Username or password!' });
    }

    req.session.account = Account.AccountModel.toAPI(account);

    return res.json({ redirect: '/home' });
  });
};

const signup = async (req, res) => {
  const username = `${req.body.username}`;
  const pass = `${req.body.pass}`;
  const pass2 = `${req.body.pass2}`;

  if (!username || !pass || !pass2) {
    return res.status(400).json({ error: 'All fields are required!' });
  }

  if (pass !== pass2) {
    return res.status(400).json({ error: 'Passwords do not match!' });
  }

  try {
    const hash = await Account.AccountModel.generateHash(pass);
    const newAccount = new Account.AccountModel({ username, password: hash });
    await newAccount.save();
    req.session.account = Account.AccountModel.toAPI(newAccount);
    return res.json({ redirect: '/home' });
  } catch (err) {
    console.log(err);
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Username already in use' });
    }
    return res.status(400).json({ error: 'An error has occurred' });
  }
};

const changePassword = async (req, res) => {
  const oldPass = `${req.body.oldPass}`;
  const newPass1 = `${req.body.newPass1}`;
  const newPass2 = `${req.body.newPass2}`;

  if (newPass1 !== newPass2) {
    return res.status(400).json({ error: 'New passwords do not match!' });
  }

  return Account.AccountModel.authenticate(
    req.session.account.username,
    oldPass,
    async (error, account) => {
      if (error || !account) {
        return res.status(401).json({ error: 'Wrong Username or password!' });
      }

      try {
        const hash = await Account.AccountModel.generateHash(newPass1);
        const updatedAccount = account;
        updatedAccount.password = hash;
        updatedAccount.save();
        req.session.account = Account.AccountModel.toAPI(updatedAccount);
        return res.status(200).json({ message: 'success' });
      } catch (err) {
        console.log(err);
        return res.status(400).json({ error: 'An error has occurred' });
      }
    },
  );
};

const isUsernameAvailable = async (req, res) => {
  const user = await Account.AccountModel.findOne({ username: req.body.username });
  if (user) {
    return res.status(200).json({ found: true });
  }
  return res.status(200).json({ found: false });
};

const isLoggedIn = (req, res) => {
  const logged = req.session.account;
  if (logged) {
    return res.status(200).json({ loggedIn: true });
  }
  return res.status(200).json({ loggedIn: false });
};

const getLoggedInAs = (req, res) => {
  console.log('Get Logged In As');

  // console.log(req.session.account._id);

  return Account.searchByID(req, req.session.account._id, (response) => {
    if (response.error) {
      return res.status(400).json(response.error);
    }
    return res.status(200).json(response);
  });
};

const getToken = (req, res) => {
  const csrfToken = req.csrfToken();
  // console.log(`Get Token csrf: ${csrfToken}`);
  return res.json({ csrfToken });
};

// adds a new shelf to the users library
// requires: shelfName
const addShelfToLibrary = async (req, res) => {
  console.log('add shelf to library');

  if (req.body.shelfName === null) {
    return res.status(400).json({ error: 'No shelf name given' });
  }

  return Account.searchByID(req, req.session.account._id, async (account) => {
    if (account.error) {
      return res.status(400).json(account.error);
    }

    let thisShelf;
    account.library.forEach((shelf) => {
      if (shelf.title === req.body.shelfName) {
        thisShelf = shelf
      }
    });

    if (thisShelf) {
      return res.status(400).json({ error: 'Shelf already exists' });
    }

    const newLibrary = account.library;

    newLibrary.unshift({
      title: req.body.shelfName,
      novels: [],
      public: false
    });

    const accountUpdate = { userID: req.session.account._id };
    accountUpdate.library = newLibrary;

    Account.updateAccountByID(req, accountUpdate, (newAccount) => {
      if (newAccount.error) {
        return res.status(400).json({ error: newAccount.error });
      }
      return res.status(200).json(newAccount);
    });
  });
}

// removes a shelf from the users library
// requires: shelfName
const removeShelfFromLibrary = async (req, res) => {
  console.log('remove shelf from library');

  if (req.body.shelfName === null) {
    return res.status(400).json({ error: 'No shelf name given' });
  }

  return Account.searchByID(req, req.session.account._id, async (account) => {
    if (account.error) {
      return res.status(400).json(account.error);
    }

    const newLibrary = account.library;
    const removedShelf = account.library.filter((shelf, index, arr) => {
      if (shelf.title === req.body.shelfName) {
        //arr.splice(index, 1);
        return true;
      }
      return false;
    });

    if (removedShelf === null) {
      return res.status(400).json({ error: `Shelf doesn't exists` });
    }

    const accountUpdate = { userID: req.session.account._id };
    accountUpdate.library = newLibrary;

    Account.updateAccountByID(req, accountUpdate, (newAccount) => {
      if (newAccount.error) {
        return res.status(400).json({ error: newAccount.error });
      }
      return res.status(200).json(newAccount);
    });
  });
}

// adds a novel to a shelf in the users library
// requires: shelfName, novelID
const addNovelToShelf = async (req, res) => {
  console.log('add novel to shelf');

  if (req.body.shelfName === null) {
    return res.status(400).json({ error: 'No shelf name given' });
  } else if (req.body.novelID === null) {
    return res.status(400).json({ error: 'No novelID given' });
  }

  return Account.searchByID(req, req.session.account._id, async (account) => {
    if (account.error) {
      return res.status(400).json(account.error);
    }

    // find this novel
    return Novel.searchByID(req, req.body.novelID, async (thisNovel) => {
      if (thisNovel.error) {
        return res.status(400).json(thisNovel.error);
      }

      const newLibrary = [];
      let foundShelf = false;
      account.library.forEach((shelf) => {
        if (shelf.title === req.body.shelfName) {
          const updatedShelf = shelf;

          // make sure that the novel isnt already on the shelf
          updatedShelf.novels.forEach(novel => {
            if (novel._id === req.body.novelID) {
              return res.status(400).json({ error: 'novel already on shelf' });
            }
          });

          updatedShelf.novels.unshift(req.body.novelID);
          newLibrary.unshift(updatedShelf);
          foundShelf = true;
        } else {
          newLibrary.unshift(shelf);
        }
      });

      if (!foundShelf) {
        return res.status(400).json({ error: `Shelf doesn't exists` });
      }

      const accountUpdate = { userID: req.session.account._id };
      accountUpdate.library = newLibrary;

      return Account.updateAccountByID(req, accountUpdate, (newAccount) => {
        if (newAccount.error) {
          return res.status(400).json({ error: newAccount.error });
        }
        return res.status(200).json(newAccount);
      });
    });
  });
}

// removes a novel from a shelf in the users library
// requires: shelfName, novelID
const removeNovelFromShelf = async (req, res) => {
  console.log('remove novel from shelf');

  if (req.body.shelfName === null) {
    return res.status(400).json({ error: 'No shelf name given' });
  } else if (req.body.novelID === null) {
    return res.status(400).json({ error: 'No novelID given' });
  }

  // find this account
  return Account.searchByID(req, req.session.account._id, async (account) => {
    if (account.error) {
      return res.status(400).json(account.error);
    }

    // find this novel
    return Novel.searchByID(req, req.body.novelID, async (thisNovel) => {
      if (thisNovel.error) {
        return res.status(400).json(thisNovel.error);
      }

      const newLibrary = [];
      let foundShelf = false;
      account.library.forEach((shelf) => {
        if (shelf.title === req.body.shelfName) {
          const updatedShelf = shelf;
          updatedShelf.novels.filter((novel, index, arr) => {
            if (novel === req.body.novelID) {
              //arr.splice(index, 1);
              return true;
            }
            return false;
          });
          newLibrary.unshift(updatedShelf);
          foundShelf = true;
        } else {
          newLibrary.unshift(shelf);
        }
      });

      if (!foundShelf) {
        return res.status(400).json({ error: `Shelf doesn't exists` });
      }

      const accountUpdate = { userID: req.session.account._id };
      accountUpdate.library = newLibrary;

      return Account.updateAccountByID(req, accountUpdate, (newAccount) => {
        if (newAccount.error) {
          return res.status(400).json({ error: newAccount.error });
        }
        return res.status(200).json(newAccount);
      });
    });
  });
}

// finds the library of the current sessions user
// requires: nothing
const getMyLibrary = async (req, res) => {
  console.log('getLibrary');

  const session = req.session.account;
  // console.log(session);

  return Account.searchByID(req, session._id, (response) => {
    if (response.error) {
      return res.status(400).json(response.error);
    }

    return res.status(200).json(response.library);
  });
};

// returns an array of novels that are in a specified shelf
// requires: shelfName
const getNovelsInShelf = async (req, res) => {
  console.log('getNovelsInShelf');

  const session = req.session.account;

  if (req.body.shelfName === null) {
    return res.status(400).json({ error: 'Missing shelfName' });
  }

  const account = await Account.searchByID(req, session._id, async (account) => {
    return account;
  });
  console.log('account');
  console.log(account);
  if (account.error) {
    return res.status(400).json(account.error);
  }

  console.log('account');
  console.log(account);

  let shelf;
  account.library.forEach((thisShelf) => {
    if (shelf.title === req.body.shelfName) {
      shelf = thisShelf;
    }
  });

  if (shelf === null) {
    return res.status(400).json({ error: 'Shelf not found' });
  }

  const novels = await Promise.all(shelf.novels.map(async (novelID) => {
    const novel = Novel.searchByID(req, novelID, (novel) => {
      return novel;
    });

    if (novel.error) {
      return res.status(400).json(novel.error);
    }

    return novel;
  }));

  return res.status(200).json(novels);
}

const getChapterNumber = (req, res) => {
  console.log('get chapter number');

  const session = req.session.account;

  if (!req.body.novelID) {
    return res.status(400).json({ error: 'Missing Novel ID' });
  }

  return Account.searchByID(req, session._id, async (account) => {
    if (account.error) {
      // console.log(account.error);
      return res.status(400).json({ error: account.error });
    }

    // console.log('account');
    // console.log(account);

    const accountUpdates = { userID: session._id };

    let chapterNumber = 0;

    // console.log(account.chapters);

    if (account.chapters !== undefined) {
      // console.log('account.chapters exists');
      chapterNumber = await account.chapters.get(req.body.novelID);

      // console.log(chapterNumber);

      // if the chapterNumber for this novel is null
      if (chapterNumber === undefined) {
        // console.log('chapter number is null for this novel');
        // create a chapterNumber for this novel

        const { chapters } = account;
        chapters.set(req.body.novelID, 0);

        // console.log('chapters');
        // console.log(chapters);

        accountUpdates.chapters = chapters;

        chapterNumber = 0;
      } else {
        return res.status(200).json(chapterNumber);
      }
    } else {
      // create a new map and set this novels chapter to 0

      const chapters = new Map();
      chapters.set(req.body.novelID, 0);

      accountUpdates.chapters = chapters;
    }

    // console.log('updating account');

    return Account.updateAccountByID(req, accountUpdates, (accountUpdate) => {
      if (accountUpdate.error) {
        console.log(accountUpdate.error);
        return res.status(400).json({ error: accountUpdate.error });
      }
      // console.log('returning chapter number: ', chapterNumber);
      return res.status(200).json(chapterNumber);
    });
  });
};

const setChapterNumber = (req, res) => {
  console.log('set chapter number');

  const session = req.session.account;

  if (req.body.novelID === null) {
    return res.status(400).json({ error: 'Missing NovelID' });
  }

  if (req.body.chapterNumber === null) {
    return res.status(400).json({ error: 'Missing chapterNumber' });
  }

  return Account.searchByID(req, session._id, async (accountResponse) => {
    if (accountResponse.error) {
      return res.status(400).json({ error: accountResponse.error });
    }

    return Novel.searchByID(req, req.body.novelID, async (response) => {
      if (response.error) {
        return res.status(400).json({ error: response.error });
      }

      if (req.body.chapterNumber > response.publishedChapterCount - 1) {
        return res.status(400).json({ error: 'There are no more chapters' });
      }

      if (req.body.chapterNumber < 0) {
        return res.status(400).json({ error: 'You cannot view a chapter with a negative index' });
      }
      let chapters;

      // console.log(accountResponse);
      // console.log(accountResponse.chapters);

      if (accountResponse.chapters !== undefined) {
        chapters = accountResponse.chapters;
      } else {
        console.log('creating map');
        chapters = new Map();
      }

      // console.log(chapters);

      chapters.set(req.body.novelID, req.body.chapterNumber);

      const accountUpdate = { chapters, userID: session._id };

      return Account.updateAccountByID(req, accountUpdate, (accountUpdateResponse) => {
        if (accountUpdateResponse.error) {
          return res.status(400).json({ error: accountUpdateResponse.error });
        }
        return res.status(200).json(accountUpdateResponse);
      });
    });
  });
};

const activatePremium = (req, res) => {
  const session = req.session.account;

  return Account.searchByID(req, session._id, async (accountResponse) => {
    if (accountResponse.error) {
      return res.status(400).json({ error: accountResponse.error });
    }

    const accountUpdate = { premium: true, userID: session._id };

    return Account.updateAccountByID(req, accountUpdate, (updateResponse) => {
      if (updateResponse.error) {
        return res.json(400).json({ error: updateResponse.error });
      }
      return res.status(200).json(updateResponse);
    });
  });
};

const deactivatePremium = (req, res) => {
  const session = req.session.account;

  return Account.searchByID(req, session._id, async (accountResponse) => {
    if (accountResponse.error) {
      return res.status(400).json({ error: accountResponse.error });
    }

    const accountUpdate = { premium: false, userID: session._id };

    return Account.updateAccountByID(req, accountUpdate, (updateResponse) => {
      if (updateResponse.error) {
        return res.json(400).json({ error: updateResponse.error });
      }
      return res.status(200).json(updateResponse);
    });
  });
};

const isPremium = (req, res) => {
  const session = req.session.account;

  Account.searchByID(req, session._id, async (accountResponse) => {
    if (accountResponse.error) {
      return res.status(400).json({ error: accountResponse.error });
    }

    return res.status(200).json(accountResponse.premium);
  });
};

module.exports = {
  loginPage,
  logout,
  login,
  signup,
  changePassword,
  getToken,
  isUsernameAvailable,
  isLoggedIn,
  getLoggedInAs,
  // addNovelToLibrary,
  // removeNovelFromLibrary,
  addShelfToLibrary,
  removeShelfFromLibrary,
  addNovelToShelf,
  removeNovelFromShelf,
  getNovelsInShelf,
  getMyLibrary,
  getChapterNumber,
  setChapterNumber,
  activatePremium,
  deactivatePremium,
  isPremium,
};
