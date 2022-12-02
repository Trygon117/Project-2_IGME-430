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
      handler({ error: "No Chapter Found" });
      return;
    }

    let chapter = doc;

    // hide information about novels the user isn't allowed to access
    if (!doc.published && doc.author != sessionUsername) {
      chapter = { published: false };
    }

    handler({ chapter });
    return;
  }).clone().catch((err) => {
    console.log('caught error');
    console.log(err);
    handler({ error: 'An error has occurred' });
    return;
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
    if (!chapter.published && chapter.author != sessionUsername) {
      handler({ error: "User does not have permission to edit the data of this novel " });
      return;
    }

    if (chapterResponse.error) {
      return chapterResponse.error;
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
    handler(result);
    return;

  }).clone().catch((err) => {
    console.log('caught error');
    console.log(err);
    handler({ error: 'An error has occurred' });
    return;
  });
};

module.exports = {
  ChapterModel,
  searchByID,
  updateChapterByID,
};
