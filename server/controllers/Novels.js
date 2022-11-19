const models = require('../models');

const { Novel } = models;
const { Chapter } = models;

// Novels

const createNovel = async (req, res) => {
  const title = `${req.body.title}`;
  const { cover } = req.files;

  const sessionUsername = req.session.account.username;

  await Novel.find({ author: sessionUsername, title }, async (err, docs) => {
    if (err) {
      console.log('an error');
      console.log(err);
      return res.status(400).json({ error: 'An error has occurred' });
    } if (docs.length !== 0) {
      console.log('novel exists');
      return res.status(400).json({ error: `User already has novel with title: ${title}` });
    }

    const newNovel = new Novel({
      title,
      author: sessionUsername,
      cover: cover.data,
      coverName: cover.name,
      coverMime: cover.mimetype,
    });

    await newNovel.save();

    req.session.currentNovel = Novel.toAPI(newNovel);

    return res.json({ createdNovel: req.session.currentNovel });
  }).clone().catch((err) => {
    console.log('caught error');
    console.log(err);
    return res.status(400).json({ error: 'An error has occurred' });
  });
};

const publishNovel = (req, res) => {
  console.log('Publish Novel');
};

const editNovel = (req, res) => {
  console.log('Edit Novel');
};

const deleteNovel = (req, res) => {
  console.log('Delete Novel');
};

// Chapters

const createChapter = (req, res) => {
  console.log('Create Chapter');
};

const publishChapter = (req, res) => {
  console.log('Publish Chapter');
};

const editChapter = (req, res) => {
  console.log('Delete Chapter');
};

const deleteChapter = (req, res) => {
  console.log('Delete Chapter');
};

// Searching

const searchNovelsByUser = async (req, res) => {
  const sessionUsername = req.session.account.username;
  const searchedUser = req.body.user;

  let seeUnpublished = false;

  if (sessionUsername === searchedUser) {
    seeUnpublished = true;
  }

  await Novel.find({ author: searchedUser }, (err, docs) => {
    if (err) {
      console.log('an error');
      console.log(err);
      return res.status(400).json({ error: 'An error has occurred' });
    }
    // console.log(docs);
    if (!seeUnpublished) {
      console.log('filtering');
      docs.filter((doc) => doc.published);
    }
    return res.status(200).json({ novels: docs });
  }).clone().catch((err) => {
    console.log('caught error');
    console.log(err);
    return res.status(400).json({ error: 'An error has occurred' });
  });
};

module.exports = {
  createNovel,
  publishNovel,
  editNovel,
  deleteNovel,
  createChapter,
  publishChapter,
  editChapter,
  deleteChapter,
  searchNovelsByUser,
};
