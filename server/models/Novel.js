const mongoose = require('mongoose');

let NovelModel = {};

const NovelSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  author: {
    type: String,
    required: true,
    trim: true,
  },
  cover: {
    type: Buffer,
    required: true,
  },
  coverName: {
    type: String,
    trim: true,
    default: 'Book Cover',
  },
  coverMime: {
    type: String,
    trim: true,
    required: true,
  },
  abstract: {
    type: String,
    trim: true,
    default: "No Content Yet...",
    required: true,

  },
  chapters: {
    type: Map,
    of: mongoose.ObjectId,
  },
  publishedChapterCount: {
    type: Number,
    default: 0,
    required: true,
  },
  totalChapterCount: {
    type: Number,
    default: 0,
    required: true,
  },
  published: {
    type: Boolean,
    default: false,
    required: true,
  },
  publicationDate: {
    type: Date,
    required: false,
  },
  createdDate: {
    type: Date,
    default: Date.now,
  },
});

// Converts a doc to something we can store in redis later on.
NovelSchema.statics.toAPI = (doc) => ({
  title: doc.username,
  author: doc.author,
  cover: doc.cover,
  coverName: doc.coverName,
  coverMime: doc.coverMime,
  abstract: doc.abstract,
  chapters: doc.chapters,
  published: doc.published,
  publicationDate: doc.publicationDate,
  createdDate: doc.createdDate,
  _id: doc._id,
});

NovelModel = mongoose.model('Novels', NovelSchema);

// helper functions

// find a single novel by its _id
const searchByID = async (req, novelID) => {
  const sessionUsername = req.session.account.username;

  return await NovelModel.findById(novelID, (err, doc) => {
    if (err) {
      console.log('an error');
      console.log(err);
      return { error: 'An error has occurred' };
    }

    if (doc === null) {
      return { error: "No Novel Found" };
    }

    let novel = doc;

    // hide information about novels the user isn't allowed to access
    if (!doc.published && doc.author != sessionUsername) {
      novel = { published: false };
    }

    //console.log("searchByID (Novel.js)");
    //console.log({ novel });

    return { novel };
  }).clone().catch((err) => {
    console.log('caught error');
    console.log(err);
    return { error: 'An error has occurred' };
  });
};

// find multiple novels that meet the given filter requirements
const searchByCriteria = async (req, novelFilters) => {
  const sessionUsername = req.session.account.username;

  return await NovelModel.find(novelFilters, (err, docs) => {
    if (err) {
      console.log('an error');
      console.log(err);
      return { error: 'An error has occurred' };
    }

    const novels = {};

    // hide information about novels the user isn't allowed to access
    docs.forEach(novel => {
      if (!novel.published && novel.author != sessionUsername) {
        novels[novel.title] = { published: false };
      } else {
        novels[novel.title] = novel;
      }
    });

    console.log(Object.keys(novels).length);

    if (Object.keys(novels).length === 0) {
      console.log('No Novels Found.');
      return { error: 'No Novels Found.' };
    }

    // console.log("searchByCriteria (Novel.js)");
    // console.log(novels);

    console.log('found novels');

    return { novels };
  }).clone().catch((err) => {
    console.log('caught error');
    console.log(err);
    return { error: 'An error has occurred' };
  });
};


// update the content of a specific novel
const updateNovelByID = async (req, updates) => {
  const sessionUsername = req.session.account.username;

  const novel = await NovelModel.findById(updates.novelID, (err, doc) => {
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

  if (novel.error) {
    return novel.error;
  }

  Object.entries(updates).forEach(entry => {
    const [key, value] = entry;
    switch (key) {
      case "title":
        novel.title = value;
        break;
      case "author":
        novel.author = value;
        break;
      case "cover":
        novel.cover = value;
        break;
      case "coverName":
        novel.coverName = value;
        break;
      case "coverMime":
        novel.coverMime = value;
        break;
      case "abstract":
        novel.abstract = value;
        break;
      case "chapters":
        novel.chapters = value;
        break;
      case "publicationDate":
        novel.publicationDate = value;
        break;
      default:
        break;
    }
  });

  result = await novel.save();
  //console.log("updated");
  //console.log(result);
  return result;
};

module.exports = {
  NovelModel,
  searchByID,
  searchByCriteria,
  updateNovelByID,
};
