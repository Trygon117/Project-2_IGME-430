const controllers = require('./controllers');
const mid = require('./middleware');

const router = (app) => {
  app.get('/getToken', mid.requiresSecure, controllers.Account.getToken);

  app.get('/login', mid.requiresSecure, mid.requiresLogout, controllers.Account.loginPage);
  app.post('/login', mid.requiresSecure, mid.requiresLogout, controllers.Account.login);

  app.post('/signup', mid.requiresSecure, mid.requiresLogout, controllers.Account.signup);

  app.post('/isUsernameAvailable', mid.requiresSecure, mid.requiresLogout, controllers.Account.isUserAvailable);

  app.get('/logout', mid.requiresLogin, controllers.Account.logout);

  app.get('/home', mid.requiresSecure, mid.requiresLogin, controllers.Home.homePage);

  app.get('/', mid.requiresSecure, mid.requiresLogout, controllers.Account.loginPage);
};

module.exports = router;
