const controllers = require('./controllers');
const mid = require('./middleware');

const router = (app) => {
  // account
  app.get('/getToken', mid.requiresSecure, controllers.Account.getToken);

  app.get('/login', mid.requiresSecure, mid.requiresLogout, controllers.Account.loginPage);

  app.post('/login', mid.requiresSecure, mid.requiresLogout, controllers.Account.login);

  app.post('/signup', mid.requiresSecure, mid.requiresLogout, controllers.Account.signup);

  app.post('/changePassword', mid.requiresSecure, mid.requiresLogin, controllers.Account.changePassword);

  app.post('/isUsernameAvailable', mid.requiresSecure, mid.requiresLogout, controllers.Account.isUsernameAvailable);

  app.get('/isLoggedIn', mid.requiresSecure, controllers.Account.isLoggedIn);

  app.get('/getLoggedInAs', mid.requiresLogin, mid.requiresSecure, controllers.Account.getLoggedInAs);

  app.get('/logout', mid.requiresLogin, mid.requiresSecure, controllers.Account.logout);

  app.get('/getMyLibrary', mid.requiresLogin, mid.requiresSecure, controllers.Account.getMyLibrary);

  app.post('/getChapterNumber', mid.requiresLogin, mid.requiresSecure, controllers.Account.getChapterNumber);

  app.post('/setChapterNumber', mid.requiresLogin, mid.requiresSecure, controllers.Account.setChapterNumber);

  app.get('/activatePremium', mid.requiresLogin, mid.requiresSecure, controllers.Account.activatePremium);

  app.get('/deactivatePremium', mid.requiresLogin, mid.requiresSecure, controllers.Account.deactivatePremium);

  app.get('/isPremium', mid.requiresLogin, mid.requiresSecure, controllers.Account.isPremium);

  app.post('/addNovelToLibrary', mid.requiresLogin, mid.requiresSecure, controllers.Account.addNovelToLibrary);

  app.post('/removeNovelFromLibrary', mid.requiresLogin, mid.requiresSecure, controllers.Account.removeNovelFromLibrary);


  // pages

  app.get('/home', mid.requiresSecure, controllers.Pages.homePage);

  app.get('/create', mid.requiresSecure, mid.requiresLogin, controllers.Pages.createPage);

  app.get('/editNovel', mid.requiresSecure, mid.requiresLogin, controllers.Pages.editNovelPage);

  app.get('/editChapter', mid.requiresSecure, mid.requiresLogin, controllers.Pages.editChapterPage);

  app.get('/library', mid.requiresSecure, mid.requiresLogin, controllers.Pages.libraryPage);

  app.get('/profile', mid.requiresSecure, mid.requiresLogin, controllers.Pages.profilePage);

  app.get('/viewNovel', mid.requiresSecure, controllers.Pages.viewNovelPage);

  app.get('/readNovel', mid.requiresSecure, controllers.Pages.readNovelPage);

  // Novels
  app.post('/createNovel', mid.requiresLogin, mid.requiresSecure, controllers.Novels.createNovel);

  // app.post('/deleteNovel', mid.requiresLogin,
  // mid.requiresSecure, controllers.Novels.deleteNovel);

  app.post('/editNovel', mid.requiresLogin, mid.requiresSecure, controllers.Novels.editNovel);

  app.post('/publishNovel', mid.requiresLogin, mid.requiresSecure, controllers.Novels.publishNovel);

  // Chapters
  app.post('/createChapter', mid.requiresLogin, mid.requiresSecure, controllers.Novels.createChapter);

  app.post('/deleteChapter', mid.requiresLogin, mid.requiresSecure, controllers.Novels.deleteChapter);

  app.post('/editChapter', mid.requiresLogin, mid.requiresSecure, controllers.Novels.editChapter);

  app.post('/publishChapter', mid.requiresLogin, mid.requiresSecure, controllers.Novels.publishChapter);

  // Searching
  app.post('/searchNovelsByUser', mid.requiresSecure, controllers.Novels.searchNovelsByUser);

  app.post('/searchNovelByID', mid.requiresSecure, controllers.Novels.searchNovelByID);

  app.post('/searchChapterByID', mid.requiresSecure, controllers.Novels.searchChapterByID);

  app.post('/searchChapterNumber', mid.requiresSecure, controllers.Novels.searchChapterNumber);

  app.get('/getAllNovels', mid.requiresSecure, controllers.Novels.getAllNovels);

  // default

  app.get('/', mid.requiresSecure, controllers.Pages.homePage);

  app.get('/*', controllers.Pages.notFound);
};

module.exports = router;
