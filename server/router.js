const controllers = require('./controllers');
const mid = require('./middleware');

const router = (app) => {
  app.get('/getToken', mid.requiresSecure, controllers.Account.getToken);

  app.get('/login', mid.requiresSecure, mid.requiresLogout, controllers.Account.loginPage);
  app.post('/login', mid.requiresSecure, mid.requiresLogout, controllers.Account.login);

  app.post('/signup', mid.requiresSecure, mid.requiresLogout, controllers.Account.signup);

  app.post('/isUsernameAvailable', mid.requiresSecure, mid.requiresLogout, controllers.Account.isUsernameAvailable);

  app.get('/isLoggedIn', mid.requiresSecure, controllers.Account.isLoggedIn);

  app.get('/getLoggedInAs', mid.requiresLogin, mid.requiresSecure, controllers.Account.getLoggedInAs);

  app.get('/logout', mid.requiresLogin, controllers.Account.logout);

  app.get('/home', mid.requiresSecure, controllers.Pages.homePage);

  app.get('/create', mid.requiresSecure, mid.requiresLogin, controllers.Pages.createPage);

  app.get('/library', mid.requiresSecure, mid.requiresLogin, controllers.Pages.libraryPage);

  app.get('/profile', mid.requiresSecure, mid.requiresLogin, controllers.Pages.profilePage);

  // Novels
  app.post('/createNovel', mid.requiresLogin, mid.requiresSecure, controllers.Novels.createNovel);

  app.post('/deleteNovel', mid.requiresLogin, mid.requiresSecure, controllers.Novels.deleteNovel);

  app.post('/editNovel', mid.requiresLogin, mid.requiresSecure, controllers.Novels.editNovel);

  app.post('/publishNovel', mid.requiresLogin, mid.requiresSecure, controllers.Novels.publishNovel);

  // Chapters
  app.post('/createChapter', mid.requiresLogin, mid.requiresSecure, controllers.Novels.createChapter);

  app.post('/deleteChapter', mid.requiresLogin, mid.requiresSecure, controllers.Novels.deleteChapter);

  app.post('/editChapter', mid.requiresLogin, mid.requiresSecure, controllers.Novels.editChapter);

  app.post('/publishChapter', mid.requiresLogin, mid.requiresSecure, controllers.Novels.publishChapter);

  // Searching
  app.post('/searchNovelsByUser', mid.requiresSecure, controllers.Novels.searchNovelsByUser);

  app.get('/', mid.requiresSecure, controllers.Pages.homePage);
};

module.exports = router;
