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

module.exports = {
  ChapterModel,
  searchByID,
};
