const controllers = require('./controllers');
const mid = require('./middleware');

const router = (app) => {
  app.get('/getToken', mid.requiresSecure, controllers.Account.getToken);

  app.get('/login', mid.requiresSecure, mid.requiresLogout, controllers.Account.loginPage);
  app.post('/login', mid.requiresSecure, mid.requiresLogout, controllers.Account.login);

  app.post('/signup', mid.requiresSecure, mid.requiresLogout, controllers.Account.signup);

  app.post('/isUsernameAvailable', mid.requiresSecure, mid.requiresLogout, controllers.Account.isUsernameAvailable);

  app.get('/isLoggedIn', mid.requiresSecure, controllers.Account.isLoggedIn);

  app.get('/logout', mid.requiresLogin, controllers.Account.logout);

  app.get('/home', mid.requiresSecure, controllers.Pages.homePage);

  app.get('/create', mid.requiresSecure, mid.requiresLogin, controllers.Pages.createPage);

  app.get('/library', mid.requiresSecure, mid.requiresLogin, controllers.Pages.libraryPage);

  app.get('/profile', mid.requiresSecure, mid.requiresLogin, controllers.Pages.profilePage);

  app.get('/', mid.requiresSecure, controllers.Pages.homePage);
};

module.exports = router;
