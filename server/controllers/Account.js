const models = require('../models');

const { Account } = models;

const loginPage = (req, res) => {
  const csrfToken = req.csrfToken();
  console.log(csrfToken);
  res.render('login', { csrfToken: csrfToken });
};

const logout = (req, res) => {
  req.session.destroy();
  res.redirect('/');
};

const login = (req, res) => {
  const username = `${req.body.username}`;
  const pass = `${req.body.pass}`;

  if (!username || !pass) {
    return res.status(400).json({ error: 'All fields are required!' });
  }

  return Account.authenticate(username, pass, (err, account) => {
    if (err || !account) {
      return res.status(401).json({ error: 'Wrong Username or password!' });
    }

    req.session.account = Account.toAPI(account);

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
    const hash = await Account.generateHash(pass);
    const newAccount = new Account({ username, password: hash });
    await newAccount.save();
    req.session.account = Account.toAPI(newAccount);
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
  const user = await Account.findOne({ username: req.body.username });
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
  const logged = req.session.account;
  return res.status(200).json({ username: logged.username });
};

const getToken = (req, res) => {
  const csrfToken = req.csrfToken();
  console.log(csrfToken);
  return res.json({ csrfToken: csrfToken });
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
};
