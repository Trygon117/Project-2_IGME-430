const e = require('express');
const models = require('../models');

const { Account } = models;
const { Novel } = models;

const loginPage = (req, res) => {
  const csrfToken = req.csrfToken();
  //console.log(`Login Page csrf: ${csrfToken}`);
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

  //console.log(req.session.account._id);

  Account.searchByID(req, req.session.account._id, (response) => {
    if (response.error) {
      return res.status(400).json(response.error);
    }
    return res.status(200).json(response);
  });
};

const getToken = (req, res) => {
  const csrfToken = req.csrfToken();
  //console.log(`Get Token csrf: ${csrfToken}`);
  return res.json({ csrfToken });
};

// add a novel to the users account
const addNovelToLibrary = async (req, res) => {
  console.log('add novel to library');
  const novelID = req.body.novelID;

  // console.log('given info');
  // console.log(req.body);

  Account.searchByID(req, req.session.account._id, (accountResponse) => {
    // console.log('accountResponse');
    // console.log(accountResponse);

    const library = accountResponse.library;
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

    models.Novel.searchByID(req, novelID, (novelResponse) => {

      // console.log('novelResponse');
      // console.log(novelResponse);

      if (novelResponse.error) {
        return res.status(400).json(novelResponse.error);
      }

      // the novel id will be a unique identifier
      mainShelf[novelID] = novelResponse;

      // console.log('mainShelf');
      // console.log(mainShelf);

      library.unshift(mainShelf);

      // console.log(library);

      const updates = { userID: req.session.account._id, library }

      Account.updateAccountByID(req, updates, (updateResponse) => {
        // console.log('updateResponse');
        // console.log(updateResponse);
        if (updateResponse.error) {
          return res.status(400).json(updateResponse.error);
        }

        res.json({ updateResponse });
      });
    });
  });
};

const removeNovelFromLibrary = (req, res) => {
  console.log('remove novel from library');
  const novelID = req.body.novelID;

  Account.searchByID(req, req.body.userID, (response) => {
    console.log('response');
    console.log(response);

    const library = response.library;
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
    for (const key of Object.keys(mainShelf)) {
      if (key === novelID) {
        // delete the novel from the library
        delete mainShelf[key];
      }
    }

    library.unshift(mainShelf);

    const updates = { userID: req.body.userID, library }

    Account.updateAccountByID(req, updates, (updateResponse) => {
      console.log('updateResponse');
      console.log(updateResponse);
      if (updateResponse.error) {
        return res.status(400).json(updateResponse.error);
      }

      res.json({ updateResponse });


      models.Novel.searchByID(req, novelID, (novelResponse) => {

        if (novelResponse.error) {
          return res.status(400).json(novelResponse.error);
        }

      });
    });
  });
}

const getMyLibrary = async (req, res) => {
  console.log('getLibrary');

  await Account.updateLibrary(req);

  const session = req.session.account;
  //console.log(session);

  Account.searchByID(req, session._id, (response) => {
    // console.log('response');
    // console.log(response);

    if (response.error) {
      return res.status(400).json(response.error);
    }

    res.status(200).json(response.library);
  });
}

const getChapterNumber = (req, res) => {
  console.log('get chapter');

  const session = req.session.account;

  if (!req.body.novelID) {
    return res.status(400).json({ error: 'Missing Novel ID' });
  }

  Account.searchByID(req, session._id, async (response) => {
    if (response.error) {
      return res.status(400).json({ error: response.error });
    }

    if (response.chapters) {
      const chapterNumber = response.chapters.get(req.body.novelID);
      if (chapterNumber === null) {
        const newAccount = response;
        let chapters = response.chapters;
        chapters.set(req.body.novelID, 0);
        newAccount.chapters = chapters;
        await newAccount.save();
      }
      return res.status(200).json(chapterNumber);
    } else {
      const newAccount = response;
      let chapters;
      chapters = new Map();
      chapters.set(req.body.novelID, 0);
      newAccount.chapters = chapters;
      await newAccount.save();

      return res.status(200).json(0);
    }
  });
}


const setChapterNumber = (req, res) => {
  console.log('set chapter number');

  const session = req.session.account;

  if (req.body.novelID === null) {
    return res.status(400).json({ error: 'Missing NovelID' });
  }

  if (req.body.chapterNumber === null) {
    return res.status(400).json({ error: 'Missing chapterNumber' });
  }

  Account.searchByID(req, session._id, async (accountResponse) => {
    if (accountResponse.error) {
      return res.status(400).json({ error: accountResponse.error });
    }

    Novel.searchByID(req, req.body.novelID, async (response) => {
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

      if (response.chapters) {
        chapters = accountResponse.chapters;
      } else {
        chapters = new Map();
      }

      chapters.set(req.body.novelID, req.body.chapterNumber);

      newAccount.chapters = chapters;

      console.log(newAccount);

      account = await newAccount.save();

      res.status(200).json(account);

    });
  });
}

module.exports = {
  loginPage,
  logout,
  login,
  signup,
  getToken,
  isUsernameAvailable,
  isLoggedIn,
  getLoggedInAs,
  addNovelToLibrary,
  removeNovelFromLibrary,
  getMyLibrary,
  getChapterNumber,
  setChapterNumber,
};
