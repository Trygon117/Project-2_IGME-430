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

  await Novel.searchByCriteria(req, { author: sessionUsername, title }, async (response) => {
    if (response.error) {
      return res.status(400).json({ error: response.error });
    }

    //console.log(novel);

    if (response.length !== 0) {
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
  });
};

// set the novel to published
const publishNovel = (req, res) => {
  console.log('Publish Novel');
};

// edit novel data
const editNovel = async (req, res) => {
  console.log('Edit Novel');

  await Novel.updateNovelByID(req, req.body, (response => {
    //console.log(novel);

    if (response.error) {
      return res.status(400).json(response);
    }

    return res.status(200).json(response);
  }));

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

  await Novel.searchByID(req, req.body.novelID, async (response) => {
    if (response === null) {
      return res.status(400).json({ error: 'Novel Not Found' });
    }

    if (response.error) {
      return res.status(400).json({ error: novel.error });
    }

    if (response.author !== sessionUsername) {
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
  });
};

// 
const publishChapter = async (req, res) => {
  console.log('Publish Chapter');

  // check if the novel is published
  await Novel.searchByID(req, req.body.novelID, async (response) => {
    if (response.error) {
      return res.status(400).json({ error: response.error });
    }

    if (!response.published) {
      return res.status(400).json({ error: 'novel not published', novel: response });
    }

    const updates = {
      published: true,
    };

    await Chapter.updateChapterByID(req, updates, (updateResponse) => {
      if (updateResponse.error) {
        return res.status(400).json({ error: updateResponse });
      }

      return res.status(200).json(updateResponse);
    });
  });
};

const editChapter = async (req, res) => {
  console.log('Edit Chapter');

  const updates = {};

  // these are the only values that can be updated in this manner
  Object.entries(updates).forEach(entry => {
    const [key, value] = entry;
    switch (key) {
      case "title":
        updates.title = value;
        break;
      case "chapter":
        updates.chapter = value;
        break;
      case "content":
        updates.content = value;
        break;
      case "views":
        updates.views = value;
        break;
      default:
        break;
    }
  });

  await Chapter.updateChapterByID(req, updates, (response) => {
    if (response.error) {
      return res.status(400).json(response);
    }

    return res.status(200).json(response);
  });
};

const deleteChapter = (req, res) => {
  console.log('Delete Chapter');
};

// Searching \\

// search novel by author and given username
const searchNovelsByUser = async (req, res) => {
  console.log(`Searching for novel author name: ${req.body.user}`);

  await Novel.searchByCriteria(req, { author: req.body.user }, response => {
    if (response.error) {
      return res.status(400).json({ error: response.error });
    }

    return res.status(200).json(response);
  });
};

// search novel by _id
const searchNovelByID = async (req, res) => {
  const searchedID = req.body.novelID;

  console.log(`Searching for novel by ID: ${searchedID}`);

  await Novel.searchByID(req, searchedID, (novel) => {
    if (novel === null) {
      return res.status(400).json({ error: `Error finding novel with id: ${searchedID}` });
    } else if (novel.error) {
      console.log('didnt get a novel');
      return res.status(400).json({ error: novel.error });
    }

    return res.status(200).json(novel);
  });
}

const searchChapterByID = async (req, res) => {
  const searchedID = req.body.chapterID;

  console.log(`Searching for chapter by ID: ${searchedID}`);

  await Chapter.searchByID(req, searchedID, (response) => {
    if (response === null) {
      return res.status(400).json({ error: `Error finding chapter with id: ${searchedID}` });
    } else if (response.error) {
      return res.status(400).json({ error: response.error });
    }

    return res.status(200).json(response);
  });
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
