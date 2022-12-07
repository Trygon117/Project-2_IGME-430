const mongoose = require('mongoose');

const models = require('.');

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
    default: 'No Content Yet...',
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
  publishedChapterCount: doc.publishedChapterCount,
  totalChapterCount: doc.totalChapterCount,
  published: doc.published,
  publicationDate: doc.publicationDate,
  createdDate: doc.createdDate,
  _id: doc._id,
});

NovelModel = mongoose.model('Novels', NovelSchema);

// helper functions

// find a single novel by its _id
const searchByID = async (req, novelID, handler) => {
  const sessionUsername = req.session.account.username;

  await NovelModel.findById(novelID, (err, doc) => {
    if (err) {
      console.log('an error');
      console.log(err);
      handler({ error: 'An error has occurred' });
      return;
    }

    if (doc === null) {
      handler({ error: 'No Novel Found' });
      return;
    }

    let novel = doc;

    // hide information about novels the user isn't allowed to access
    if (!doc.published && doc.author !== sessionUsername) {
      novel = { published: false };
    }

    handler(novel);
  }).clone().catch((err) => {
    console.log('caught error');
    console.log(err);
    handler({ error: 'An error has occurred' });
  });
};

// find multiple novels that meet the given filter requirements
const searchByCriteria = async (req, novelFilters, handler) => {
  const sessionUsername = req.session.account.username;

  await NovelModel.find(novelFilters, (err, docs) => {
    if (err) {
      console.log('an error');
      console.log(err);
      handler({ error: 'An error has occurred' });
      return;
    }

    const novels = {};

    // hide information about novels the user isn't allowed to access
    docs.forEach((novel) => {
      if (!novel.published && novel.author !== sessionUsername) {
        novels[novel.title] = { published: false };
      } else {
        novels[novel.title] = novel;
      }
    });

    if (Object.keys(novels).length === 0) {
      console.log('No Novels Found');
      handler({ error: 'No Novels Found' });
      return;
    }

    // console.log("searchByCriteria (Novel.js)");
    // console.log(novels);

    console.log('found novels');

    handler({ novels });
  }).clone().catch((err) => {
    console.log('caught error');
    console.log(err);
    handler({ error: 'An error has occurred' });
  });
};

// update the content of a specific novel
const updateNovelByID = async (req, updates, handler) => {
  const sessionUsername = req.session.account.username;

  // console.log(updates);

  await NovelModel.findById(updates.novelID, async (err, novel) => {
    if (err) {
      console.log('an error');
      console.log(err);
      handler({ error: 'An error has occurred' });
      return;
    }

    // console.log('novel');
    // console.log(novel);

    if (!novel) {
      handler({ error: `Novel with with id: "${updates.novelID}" not found` });
      return;
    }

    // You can only update novels that you are the author of
    if (!novel.published && novel.author !== sessionUsername) {
      handler({ error: 'User does not have permission to edit the data of this novel ' });
      return;
    }

    const updateNovel = novel;

    Object.entries(updates).forEach((entry) => {
      const [key, value] = entry;
      switch (key) {
        case 'title':
          updateNovel.title = value;
          break;
        case 'author':
          updateNovel.author = value;
          break;
        case 'cover':
          updateNovel.cover = value;
          break;
        case 'coverName':
          updateNovel.coverName = value;
          break;
        case 'coverMime':
          updateNovel.coverMime = value;
          break;
        case 'abstract':
          updateNovel.abstract = value;
          break;
        case 'chapters':
          updateNovel.chapters = value;
          break;
        case 'publishedChapterCount':
          updateNovel.publishedChapterCount = value;
          break;
        case 'totalChapterCount':
          updateNovel.totalChapterCount = value;
          break;
        case 'published':
          updateNovel.published = value;
          break;
        case 'publicationDate':
          updateNovel.publicationDate = value;
          break;
        default:
          break;
      }
    });

    if (novel.chapters && Object.keys(novel.chapters).length !== 0) {
      // update chapter counts
      let publishedChapters = 0;
      let totalChapters = 0;

      // count the chapters
      Object.keys(novel.chapters).forEach((key) => {
        if (key.includes('chapter-')) {
          publishedChapters++;
        }
        totalChapters++;
      });

      updateNovel.publishedChapterCount = publishedChapters;
      updateNovel.totalChapterCount = totalChapters;
    }

    const result = await updateNovel.save();

    await models.Account.updateLibrary(req, () => {
      handler(result);
    });
  }).clone().catch((err) => {
    console.log('caught error');
    console.log(err);
    return { error: 'An error has occurred' };
  });
};

// sends an array of all the novels to the handler function (potentially laggy id too many novels)
const getAllNovels = async (handler) => {
  const novels = await NovelModel.find();

  // for await (const novel of NovelModel.find()) {
  //   // console.log('novel');
  //   // console.log(novel);
  //   novels.unshift(novel);
  // }

  // console.log('novels');
  // console.log(novels);
  handler(novels);
};

// sends every novel individually to the handler function
// const iterateAllNovels = async (handler) => {
//   for await (const novel of NovelModel.find()) {
//     handler(novel);
//   }
// };

module.exports = {
  NovelModel,
  searchByID,
  searchByCriteria,
  updateNovelByID,
  getAllNovels,
  // iterateAllNovels,
};
