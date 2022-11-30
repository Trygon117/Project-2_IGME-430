const mongoose = require('mongoose');

let ChapterModel = {};

const ChapterSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    default: "Untitled",
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
    type: Number,
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
const searchByID = async (req, chapterID) => {
  const sessionUsername = req.session.account.username;

  return await ChapterModel.findById(chapterID, (err, doc) => {
    if (err) {
      console.log('an error');
      console.log(err);
      return { error: 'An error has occurred' };
    }

    if (doc === null) {
      return { error: "No Chapter Found" };
    }

    let chapter = doc;

    // hide information about novels the user isn't allowed to access
    if (!doc.published && doc.author != sessionUsername) {
      chapter = { published: false };
    }

    return { chapter };
  }).clone().catch((err) => {
    console.log('caught error');
    console.log(err);
    return { error: 'An error has occurred' };
  });
};

// update the content of a specific chapter
const updateChapterByID = async (req, updates) => {
  const sessionUsername = req.session.account.username;

  const chapter = await ChapterModel.findById(updates.chapterID, (err, doc) => {
    if (err) {
      console.log('an error');
      console.log(err);
      return { error: 'An error has occurred' };
    }

    // You can only update novels that you are the author of
    if (!doc.published && doc.author != sessionUsername) {
      return { error: "User does not have permission to edit the data of this novel " };
    }

    return doc;

  }).clone().catch((err) => {
    console.log('caught error');
    console.log(err);
    return { error: 'An error has occurred' };
  });

  if (chapter.error) {
    return chapter.error;
  }

  Object.entries(updates).forEach(entry => {
    const [key, value] = entry;
    switch (key) {
      case "title":
        chapter.title = value;
        break;
      case "author":
        chapter.author = value;
        break;
      case "novelID":
        chapter.novelID = value;
        break;
      case "chapter":
        chapter.chapter = value;
        break;
      case "content":
        chapter.content = value;
        break;
      case "published":
        chapter.published = value;
        break;
      case "views":
        chapter.views = value;
        break;
      default:
        break;
    }
  });

  result = await chapter.save();
  //console.log("updated");
  //console.log(result);
  return result;
};

module.exports = {
  ChapterModel,
  searchByID,
  updateChapterByID,
};
