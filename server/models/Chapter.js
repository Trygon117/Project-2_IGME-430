const mongoose = require('mongoose');
const models = require('.');

let ChapterModel = {};

const ChapterSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    default: 'Untitled',
  },
  author: {
    type: String,
    trim: true,
    required: true,
  },
  novelID: {
    type: mongoose.ObjectId,
    required: true,
  },
  chapter: {
    type: String,
    unique: false,
    required: true,
  },
  chapterNumber: {
    type: Number,
    default: -1, // meaning it is unpublished
    required: false,
  },
  content: {
    type: String,
    trim: true,
  },
  published: {
    type: Boolean,
    default: false,
    required: true,
  },
  views: {
    type: Number,
    default: 0,
  },
  createdDate: {
    type: Date,
    default: Date.now,
  },
});

// Converts a doc to something we can store in redis later on.
ChapterSchema.statics.toAPI = (doc) => ({
  title: doc.title,
  author: doc.author,
  novelID: doc.novelID,
  chapter: doc.chapter,
  content: doc.content,
  published: doc.published,
  views: doc.views,
  createdDate: doc.createdDate,
  _id: doc._id,
});

ChapterModel = mongoose.model('Chapters', ChapterSchema);

// helper functions

// find a single novel by its _id
const searchByID = async (req, chapterID, handler) => {
  const sessionUsername = req.session.account.username;

  await ChapterModel.findById(chapterID, (err, doc) => {
    if (err) {
      console.log('an error');
      console.log(err);
      handler({ error: 'An error has occurred' });
      return;
    }

    if (doc === null) {
      handler({ error: 'No Chapter Found' });
      return;
    }

    let chapter = doc;

    // hide information about novels the user isn't allowed to access
    if (!doc.published && doc.author !== sessionUsername) {
      chapter = { published: false };
    }

    handler(chapter);
  }).clone().catch((err) => {
    console.log('caught error');
    console.log(err);
    handler({ error: 'An error has occurred' });
  });
};

// find multiple chapters that meet the given filter requirements
const searchByCriteria = async (req, chapterFilters, handler) => {
  const sessionUsername = req.session.account.username;

  await ChapterModel.find(chapterFilters, (err, docs) => {
    if (err) {
      console.log('an error');
      console.log(err);
      handler({ error: 'An error has occurred' });
      return;
    }

    const chapters = {};

    // hide information about novels the user isn't allowed to access
    docs.forEach((chapter) => {
      if (!chapter.published && chapter.author !== sessionUsername) {
        chapters[chapter.title] = { published: false };
      } else {
        chapters[chapter.title] = chapter;
      }
    });

    if (Object.keys(chapters).length === 0) {
      console.log('No Chapters Found');
      handler({ error: 'No Chapters Found' });
      return;
    }

    // console.log("searchByCriteria (Novel.js)");
    // console.log(novels);

    console.log('found chapters');

    handler(chapters);
  }).clone().catch((err) => {
    console.log('caught error');
    console.log(err);
    handler({ error: 'An error has occurred' });
  });
};

// update the content of a specific chapter
const updateChapterByID = async (req, updates, handler) => {
  const sessionUsername = req.session.account.username;

  await ChapterModel.findById(updates.chapterID, async (err, chapter) => {
    if (err) {
      console.log('an error');
      console.log(err);
      handler({ error: 'An error has occurred' });
      return;
    }

    if (!chapter) {
      handler({ error: 'No Chapter Found' });
      return;
    }

    // You can only update novels that you are the author of
    if (!chapter.published && chapter.author !== sessionUsername) {
      handler({ error: 'User does not have permission to edit the data of this novel ' });
      return;
    }

    const updateChapter = chapter;

    Object.entries(updates).forEach((entry) => {
      const [key, value] = entry;
      switch (key) {
        case 'title':
          updateChapter.title = value;
          break;
        case 'author':
          updateChapter.author = value;
          break;
        case 'novelID':
          updateChapter.novelID = value;
          break;
        case 'chapter':
          updateChapter.chapter = value;
          break;
        case 'chapterNumber':
          updateChapter.chapterNumber = value;
          break;
        case 'content':
          updateChapter.content = value;
          break;
        case 'published':
          updateChapter.published = value;
          break;
        case 'views':
          updateChapter.views = value;
          break;
        default:
          break;
      }
    });

    // console.log('chapter');
    // console.log(chapter);

    const result = await updateChapter.save();

    await models.Account.updateLibrary(req, () => {
      handler(result);
    });
  }).clone().catch((err) => {
    console.log('caught error');
    console.log(err);
    handler({ error: 'An error has occurred' });
  });
};

module.exports = {
  ChapterModel,
  searchByID,
  searchByCriteria,
  updateChapterByID,
};
