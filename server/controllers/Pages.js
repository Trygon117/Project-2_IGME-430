const models = require('../models');

const homePage = (req, res) => res.render('home');

const createPage = (req, res) => res.render('create');

const libraryPage = (req, res) => res.render('library');

const profilePage = (req, res) => res.render('profile');

const editNovelPage = (req, res) => res.render('editNovel');

const editChapterPage = (req, res) => res.render('editChapter');

module.exports = {
  homePage,
  createPage,
  libraryPage,
  profilePage,
  editNovelPage,
  editChapterPage,
};
