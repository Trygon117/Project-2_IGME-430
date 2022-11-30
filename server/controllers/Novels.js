const { response } = require('express');
const models = require('../models');

const { Novel } = models;
const { Chapter } = models;

// Novels

// create a new novel
const createNovel = async (req, res) => {
  const title = `${req.body.title}`;
  const { cover } = req.files;
  let abstract = `${req.body.abstract}`;


  if (!abstract) {
    abstract = "No Content Yet...";
  }

  const sessionUsername = req.session.account.username;

  const novel = await Novel.searchByCriteria(req, { author: sessionUsername, title });

  if (novel.error) {
    return res.status(400).json({ error: novel.error });
  }

  //console.log(novel);

  if (novel.length !== 0) {
    console.log('novel exists');
    return res.status(400).json({ error: `User already has novel with title: ${title}` });
  }

  const newNovel = new Novel.NovelModel({
    title,
    author: sessionUsername,
    cover: cover.data,
    coverName: cover.name,
    coverMime: cover.mimetype,
    abstract,
  });

  await newNovel.save();

  req.session.currentNovel = Novel.NovelModel.toAPI(newNovel);

  return res.json({ createdNovel: req.session.currentNovel });
};

// set the novel to published
const publishNovel = (req, res) => {
  console.log('Publish Novel');
};

// edit novel data
const editNovel = async (req, res) => {
  console.log('Edit Novel');

  updatedNovel = await Novel.updateNovelByID(req, req.body);
  //console.log(novel);

  if (response.error) {
    return res.status(400).json(updatedNovel);
  }

  return res.status(200).json({ updatedNovel });
};

// delet the given novel
const deleteNovel = (req, res) => {
  console.log('Delete Novel');
};

// Chapters

// create a new chapter for a given novel
const createChapter = async (req, res) => {
  console.log('Create Chapter');

  const sessionUsername = req.session.account.username;

  console.log(req.body);

  let novel = await Novel.searchByID(req, req.body.novelID);

  if (novel === null) {
    return res.status(400).json({ error: 'Novel Not Found' });
  }

  if (novel.error) {
    return res.status(400).json({ error: novel.error });
  }



  if (novel.author !== sessionUsername) {
    return res.status(400).json({ error: 'User does not have permission to create a chapter for this novel.' });
  }

  const newChapter = new Chapter.ChapterModel({
    title: "Untitled",
    author: sessionUsername,
    novelID: novel._id,
    content: "",
    published: false,
  });

  newChapter.save();

  // create a unique identifier for each chapter that is created
  let available = false;
  let draftInt = 0;
  while (!available) {
    let checkName = await novel.get(`chapters.draft-${draftInt}`);
    if (checkName === undefined) {
      available = true;
    } else {
      draftInt++;
    }
  }

  novel.set(`chapters.draft-${draftInt}`, newChapter._id);

  novel.save();

  console.log(newChapter);
  console.log(novel.chapters);

  req.session.currentChapter = Chapter.ChapterModel.toAPI(newChapter);

  return res.json({ createdChapter: newChapter });
};

// 
const publishChapter = (req, res) => {
  console.log('Publish Chapter');
};

const editChapter = async (req, res) => {
  console.log('Edit Chapter');

  updatedChapter = await Chapter.updateChapterByID(req, req.body);

  if (response.error) {
    return res.status(400).json(updatedChapter);
  }

  return res.status(200).json({ updatedChapter });
};

const deleteChapter = (req, res) => {
  console.log('Delete Chapter');
};

// Searching \\

// search novel by author and given username
const searchNovelsByUser = async (req, res) => {
  console.log(`Searching for novel author name: ${req.body.user}`);

  let novels = await Novel.searchByCriteria(req, { author: req.body.user });

  if (novels.error) {
    return res.status(400).json({ error: novels.error });
  }

  return res.status(200).json({ novels });
};

// search novel by _id
const searchNovelByID = async (req, res) => {
  const searchedID = req.body.novelID;

  console.log(`Searching for novel by ID: ${searchedID}`);

  let novel = await Novel.searchByID(req, searchedID);

  if (novel === null) {
    return res.status(400).json({ error: `Error finding novel with id: ${searchedID}` });
  } else if (novel.error) {
    return res.status(400).json({ error: novel.error });
  }

  return res.status(200).json({ novel });
}

const searchChapterByID = async (req, res) => {
  const searchedID = req.body.chapterID;

  console.log(`Searching for chapter by ID: ${searchedID}`);

  let chapter = await Chapter.searchByID(req, searchedID);

  if (chapter === null) {
    return res.status(400).json({ error: `Error finding chapter with id: ${searchedID}` });
  } else if (chapter.error) {
    return res.status(400).json({ error: chapter.error });
  }

  return res.status(200).json({ chapter });
}

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
  searchNovelByID,
  searchChapterByID,
};
