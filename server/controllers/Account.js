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

  Account.searchByID(req, req.session.account._id, (response) => {
    if (response.error) {
      console.log(response.error);
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

// add a novel to the users account
const addNovelToLibrary = async (req, res) => {
  console.log('add novel to library');
  const { novelID } = req.body;

  // console.log('given info');
  // console.log(req.body);

  Account.searchByID(req, req.session.account._id, (accountResponse) => {
    // console.log('accountResponse');
    // console.log(accountResponse);

    const { library } = accountResponse;
    let mainShelf;

    if (!accountResponse.library || accountResponse.library.length === 0) {
      console.log('library empty');
      mainShelf = { title: 'Main Shelf' };
    } else {
      // remove and get the first item in the array
      mainShelf = accountResponse.library.shift();
    }

    // console.log('mainShelf');
    // console.log(mainShelf);

    return models.Novel.searchByID(req, novelID, (novelResponse) => {
      // console.log('novelResponse');
      // console.log(novelResponse);

      if (novelResponse.error) {
        // console.log(novelResponse.error);
        return res.status(400).json(novelResponse.error);
      }

      // the novel id will be a unique identifier
      mainShelf[novelID] = novelResponse;

      // console.log('mainShelf');
      // console.log(mainShelf);

      library.unshift(mainShelf);

      // console.log('library');
      // console.log(library);

      // console.log(req.session.account._id);

      const updates = { userID: req.session.account._id, library };

      return Account.updateAccountByID(req, updates, (updateResponse) => {
        // console.log('updateResponse');
        // console.log(updateResponse);
        if (updateResponse.error) {
          // console.log(updateResponse.error);
          return res.status(400).json(updateResponse.error);
        }

        // console.log('updateResponse');
        // console.log(updateResponse);

        return res.json({ updateResponse });
      });
    });
  });
};

const removeNovelFromLibrary = (req, res) => {
  console.log('remove novel from library');
  const { novelID } = req.body;

  return Account.searchByID(req, req.session.account._id, (response) => {
    if (response.error) {
      console.log(response.error);
      return res.status(400).json({ error: response.error });
    }
    // console.log('response');
    // console.log(response);

    const { library } = response;
    let mainShelf;

    if (!response.library || response.library.length === 0) {
      console.log('library empty');
      mainShelf = { title: 'Main Shelf' };
    } else {
      // remove and get the first item in the array
      mainShelf = response.library.shift();
    }

    console.log('mainShelf');
    console.log(Object.keys(mainShelf));

    // check if the novel is in the library
    Object.keys(mainShelf).forEach((key) => {
      if (key === novelID) {
        // delete the novel from the library
        delete mainShelf[key];
      }
    });

    library.unshift(mainShelf);

    const updates = { userID: req.session.account._id, library };

    return Account.updateAccountByID(req, updates, (updateResponse) => {
      if (updateResponse.error) {
        console.log(updateResponse.errror);
        return res.status(400).json({ error: updateResponse.error });
      }

      // console.log('updateResponse');
      // console.log(updateResponse);

      if (updateResponse.error) {
        return res.status(400).json(updateResponse.error);
      }

      return res.json({ updateResponse });
    });
  });
};

const getMyLibrary = async (req, res) => {
  console.log('getLibrary');

  const session = req.session.account;
  // console.log(session);

  return Account.searchByID(req, session._id, (response) => {
    // console.log('response');
    // console.log(response);

    if (response.error) {
      return res.status(400).json(response.error);
    }

    return res.status(200).json(response.library);
  });
};

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

      const newAccount = accountResponse;
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

      newAccount.chapters = chapters;

      // console.log(newAccount);

      const account = await newAccount.save();

      return res.status(200).json(account);
    });
  });
};

const activatePremium = (req, res) => {
  const session = req.session.account;

  Account.searchByID(req, session._id, async (accountResponse) => {
    if (accountResponse.error) {
      return res.status(400).json({ error: accountResponse.error });
    }

    const newAccount = accountResponse;

    newAccount.premium = true;

    const account = await newAccount.save();

    return res.status(200).json(account);
  });
};

const deactivatePremium = (req, res) => {
  const session = req.session.account;

  Account.searchByID(req, session._id, async (accountResponse) => {
    if (accountResponse.error) {
      return res.status(400).json({ error: accountResponse.error });
    }

    const newAccount = accountResponse;

    newAccount.premium = false;

    const account = await newAccount.save();

    return res.status(200).json(account);
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
  addNovelToLibrary,
  removeNovelFromLibrary,
  getMyLibrary,
  getChapterNumber,
  setChapterNumber,
  activatePremium,
  deactivatePremium,
  isPremium,
};
