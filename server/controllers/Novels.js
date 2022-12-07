const models = require('../models');

const { Novel } = models;
const { Chapter } = models;

// Novels

// create a new novel
const createNovel = async (req, res) => {
  console.log('create novel');
  const title = `${req.body.title}`;
  const { cover } = req.files;
  let abstract = `${req.body.abstract}`;

  if (!abstract || abstract === undefined) {
    abstract = 'No Content Yet...';
  }

  const sessionUsername = req.session.account.username;

  // make sure that there isn't already a novel with the same title by the same author
  await Novel.searchByCriteria(req, { author: sessionUsername, title }, async (response) => {
    // console.log(response);

    // meaning there was a different error
    if (response.error && response.error !== 'No Novels Found') {
      return res.status(400).json({ error: response.error });
    }

    // if the novel was found
    if (!response.error) {
      console.log('novel already exists');
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
const publishNovel = async (req, res) => {
  console.log('Publish Novel');

  // console.log(req.body);

  if (req.body.published === null || typeof req.body.published !== 'boolean') {
    return res.status(400).json({ error: 'Missing published' });
  }

  const updates = {
    published: req.body.published,
    novelID: req.body.novelID,
  };

  return Novel.updateNovelByID(req, updates, (updateResponse) => {
    if (updateResponse.error) {
      return res.status(400).json({ error: updateResponse });
    }

    return res.status(200).json(updateResponse);
  });
};

// edit novel data
const editNovel = async (req, res) => {
  console.log('Edit Novel');

  const updates = { novelID: req.body.novelID };

  // these are the only values that can be updated in this manner
  Object.entries(req.body).forEach((entry) => {
    const [key, value] = entry;
    switch (key) {
      case 'title':
        updates.title = value;
        break;
      case 'cover':
        updates.cover = value;
        break;
      case 'coverName':
        updates.coverName = value;
        break;
      case 'coverMime':
        updates.views = value;
        break;
      case 'abstract':
        updates.abstract = value;
        break;
      default:
        break;
    }
  });

  // console.log('Novel Updates:');
  // console.log(updates);

  return Novel.updateNovelByID(req, updates, ((response) => {
    // console.log(novel);

    if (response.error) {
      return res.status(400).json(response);
    }

    return res.status(200).json(response);
  }));
};

// delet the given novel
// const deleteNovel = (req, res) => {
//   console.log('Delete Novel');
// };

// Chapters

// create a new chapter for a given novel
const createChapter = async (req, res) => {
  console.log('Create Chapter');

  const sessionUsername = req.session.account.username;

  // console.log(req.body);

  return Novel.searchByID(req, req.body.novelID, async (response) => {
    // console.log(response);
    // console.log(response.novel.author);
    // console.log(sessionUsername);

    if (response === null) {
      return res.status(400).json({ error: 'Novel Not Found' });
    }

    if (response.error) {
      return res.status(400).json({ error: response.error });
    }

    if (response.author !== sessionUsername) {
      return res.status(400).json({ error: 'User does not have permission to create a chapter for this novel.' });
    }

    // create a unique identifier for each chapter that is created

    let { chapters } = response;

    // console.log('chapters');
    // console.log(chapters);

    if (chapters === undefined) {
      chapters = new Map();
    }

    let draftInt = 0;
    let found = false;
    chapters.forEach((value, chapterKey) => {
      if (found) {
        if (chapters[chapterKey] !== undefined) {
          draftInt++;
        } else {
          found = true;
        }
      }
    });

    const newChapter = new Chapter.ChapterModel({
      title: 'Untitled',
      author: sessionUsername,
      novelID: response._id,
      content: '',
      chapter: `draft-${draftInt}`,
      published: false,
    });

    newChapter.save();

    // update the novel's chapter collection
    response.set(`chapters.draft-${draftInt}`, newChapter._id);
    response.save();

    // console.log(newChapter);
    // console.log(novel.chapters);

    req.session.currentChapter = Chapter.ChapterModel.toAPI(newChapter);

    return res.json({ createdChapter: newChapter });
  });
};

// publish or unpublish chapter
const publishChapter = async (req, res) => {
  console.log('Publish Chapter');

  // console.log(req.body);

  // check if mode was given
  if (req.body.mode !== null && req.body.mode !== 'add-last' && req.body.mode !== 'unpublish') {
    // check if chapter reference was given
    if (req.body.referenceChapter === null) {
      return res.status(400).json({ error: 'Missing chapter reference' });
    }
  }

  // check if the chapter exists
  return Chapter.searchByID(req, req.body.chapterID, async (thisChapter) => {
    // console.log('thisChapter');
    // console.log(thisChapter);

    if (thisChapter.error) {
      return res.status(400).json({ error: thisChapter.error });
    }

    // check if the novel exists && is published
    return Novel.searchByID(req, req.body.novelID, async (novelResponse) => {
      if (novelResponse.error) {
        return res.status(400).json({ error: novelResponse.error });
      }

      if (!novelResponse.published) {
        return res.status(400).json({ error: 'novel not published', novel: novelResponse });
      }

      // console.log(novelResponse);

      const updates = { published: true, chapterID: thisChapter._id };
      let newChapterName = thisChapter.chapter;

      // check the mode to add the novel
      if (req.body.mode === 'unpublish') {
        // unpublish the chapter

        // console.log('pre-unpublish');

        newChapterName = `draft-${novelResponse.totalChapterCount - novelResponse.publishedChapterCount}`;

        updates.chapterNumber = -1;
        updates.published = false;
        updates.chapter = newChapterName;
      } else if (req.body.mode === 'add-last') {
        // add as the last chapter
        // console.log('pre-add-last');

        newChapterName = `chapter-${novelResponse.publishedChapterCount}`;

        // set the chapter number to be the last chapter
        updates.chapterNumber = novelResponse.publishedChapterCount + 1;
        updates.chapter = newChapterName;
      }

      const publish = async (referenceChapter) => {
        // update the chapter

        // console.log('updates');
        // console.log(updates);

        Chapter.updateChapterByID(req, updates, async (chapterResponse) => {
          if (chapterResponse.error) {
            return res.status(400).json({ error: chapterResponse });
          }

          // console.log('chapterResponse');
          // console.log(chapterResponse);

          const novelUpdates = { novelID: req.body.novelID };

          // recursive function to rename and order every ""-chapter
          const renameChapters = (chapters, chapterType) => {
            // console.log('renameChapters');
            // console.log(chapters);
            let chapterNum = 0;
            let changed = false;
            chapters.forEach((value, key) => {
              if (!changed) {
                if (key.includes(chapterType)) {
                  if (key === `${chapterType}-${chapterNum}`) {
                    chapterNum++;
                  } else {
                    chapters.delete(key);
                    chapters.set(`${chapterType}-${chapterNum}`, value);
                    changed = true;
                  }
                }
              }
            });
            if (changed) {
              return renameChapters(chapters, chapterType);
            }
            return chapters;
          };

          const referenceUpdate = {};
          if (referenceChapter) {
            referenceUpdate.chapterID = referenceChapter._id;
          }
          const displacedChapterUpdates = [];

          let { chapters } = novelResponse;

          if (chapters === undefined) {
            chapters = new Map();
          }

          // console.log('referenceUpdate');
          // console.log(referenceUpdate);

          // check the mode to add the novel
          if (req.body.mode === 'unpublish') {
            // unpublish the chapter

            // console.log('unpublish');
            // console.log(req.body);

            // delete the previous id
            await chapters.delete(thisChapter.chapter);

            // set this chapter's id
            await chapters.set(`${newChapterName}`, thisChapter._id);

            renameChapters(chapters, 'chapter');
            renameChapters(chapters, 'draft');

            // console.log('chapters');
            // console.log(chapters);

            novelUpdates.chapters = chapters;
          } else if (req.body.mode === 'replace') {
            // replace the novel

            console.log('replace');

            if (referenceChapter) { // this is the other chapter
              // console.log('referenceChapter');
              // console.log(referenceChapter);

              // set this chapter to be a draft
              referenceUpdate.chapterID = referenceChapter._id;
              referenceUpdate.chapter = `draft-${novelResponse.totalChapterCount - novelResponse.publishedChapterCount}`;
              referenceUpdate.chapterNumber = -1;
              referenceUpdate.published = false;

              // update the novel

              // delete the previous id
              await chapters.delete(thisChapter.chapter);

              // set this chapter as the reference chapter's chapter
              await chapters.set(`${newChapterName}`, thisChapter._id);

              // set the reference chapter as a draft
              await chapters.set(referenceUpdate.chapter, referenceChapter._id);

              // console.log(chapters);

              renameChapters(chapters, 'draft');
              renameChapters(chapters, 'chapter');

              // console.log(chapters);

              novelUpdates.chapters = chapters;
            }
          } else if (req.body.mode === 'insert-before') {
            // add before the given novel

            console.log('insert-before');

            const chapsToIncrease = [];

            if (referenceChapter) { // this is the other chapter
              // set the reference chapter to come after the inserted chapter
              referenceUpdate.chapterID = referenceChapter._id;
              referenceUpdate.chapter = `chapter-${referenceChapter.chapterNumber}`;
              referenceUpdate.chapterNumber = referenceChapter.chapterNumber;
              chapsToIncrease.unshift(referenceUpdate);

              // update the novel

              // delete the previous id
              await chapters.delete(thisChapter.chapter);

              // set this chapter as the reference chapter's chapter
              await chapters.set(`${newChapterName}`, thisChapter._id);

              // set every chapter after this one as it's chapter + 1

              // find all the chapters after this one
              chapters.forEach((value, key) => {
                let numString;
                if (key.includes('chapter-')) {
                  numString = key.replace('chapter-', '');

                  // chapter numbers are one greater than the chapter value
                  const chapNum = parseInt(numString, 10) + 1;

                  // console.log('chapNum');
                  // console.log(chapNum);

                  // this chapter number is greater than the inserted chapter number
                  if (chapNum > chapterResponse.chapterNumber) {
                    // so we don't mess up the the array as we go through it
                    chapsToIncrease.unshift({
                      chapterID: value,
                      chapter: key,
                      chapterNumber: chapNum,
                    });
                  }
                }
              });

              // console.log('chapsToIncrease');
              // console.log(chapsToIncrease);

              // go through the chapters we found
              chapsToIncrease.forEach(async (chap) => {
                // console.log(chap);
                // increase the position by 1
                if (chap.chapter.includes('chapter-')) {
                  // update this chapter
                  const disChapUpdate = {};
                  disChapUpdate.chapterID = chap.chapterID;
                  // the chapter number will already be one greater than this
                  disChapUpdate.chapter = `chapter-${chap.chapterNumber}`;
                  disChapUpdate.chapterNumber = chap.chapterNumber + 1;
                  displacedChapterUpdates.unshift(disChapUpdate);
                  // displace this chapter by 1
                  await chapters.set(`chapter-${chap.chapterNumber}`, chap.chapterID);
                }
              });

              novelUpdates.chapters = chapters;
            }
          } else if (req.body.mode === 'insert-after') {
            // add after the given novel

            // console.log('insert-after');
            // console.log(req.body.referenceChapter);

            const chapsToIncrease = [];

            if (referenceChapter) { // this is the other chapter
              // update the novel

              // delete the previous id
              await chapters.delete(thisChapter.chapter);

              // set this chapter to be increased
              chapsToIncrease.unshift({
                chapterID: thisChapter._id,
                chapter: newChapterName,
                chapterNumber: referenceChapter.chapterNumber,
              });

              // set this chapter as the reference chapter's chapter
              // await chapters.set(`${newChapterName}`, thisChapter._id);

              // set every chapter after this one as it's chapter + 1

              // find all the chapters after this one
              chapters.forEach((value, key) => {
                let numString;
                if (key.includes('chapter-')) {
                  numString = key.replace('chapter-', '');

                  // chapter numbers are one greater than the chapter value
                  const chapNum = parseInt(numString, 10) + 1;

                  // console.log('chapNum');
                  // console.log(chapNum);

                  // if the this chapter number is greater than the inserted chapter number
                  if (chapNum > chapterResponse.chapterNumber) {
                    // so we don't mess up the the array as we go through it
                    chapsToIncrease.unshift({
                      chapterID: value,
                      chapter: key,
                      chapterNumber: chapNum,
                    });
                  }
                }
              });

              // console.log('chapsToIncrease');
              // console.log(chapsToIncrease);

              // go through the chapters we found
              chapsToIncrease.forEach(async (chap) => {
                // console.log(chap);
                // increase the position by 1
                if (chap.chapter.includes('chapter-')) {
                  // update this chapter
                  const disChapUpdate = {};
                  disChapUpdate.chapterID = chap.chapterID;
                  disChapUpdate.chapter = `chapter-${chap.chapterNumber}`; // the chapter number will already be one greater than this
                  disChapUpdate.chapterNumber = chap.chapterNumber + 1;
                  displacedChapterUpdates.unshift(disChapUpdate);
                  // displace this chapter by 1
                  await chapters.set(`chapter-${chap.chapterNumber}`, chap.chapterID);
                }
              });

              novelUpdates.chapters = chapters;
            }
          } else if (req.body.mode === 'add-last') {
            // add as the last chapter
            console.log('add-last');

            // delete the previous id
            await chapters.delete(thisChapter.chapter);

            // set the new id to this chapter
            await chapters.set(`${newChapterName}`, thisChapter._id);

            // console.log(chapters);

            renameChapters(chapters, 'draft');

            // console.log(chapters);

            novelUpdates.chapters = chapters;
          }

          // update the novel
          return Novel.updateNovelByID(req, novelUpdates, async (novelUpdateResponse) => {
            if (req.body.mode === 'replace') {
              // console.log('updating reference chapter');
              // console.log(referenceUpdate);

              return Chapter.updateChapterByID(req, referenceUpdate, (refRes) => {
                if (refRes.error) {
                  return res.status(400).json({ error: refRes.error });
                }

                // console.log('updated reference chapter');
                // console.log(refRes);

                return res.status(200).json({
                  chapter: chapterResponse,
                  refernceNovel: refRes,
                  novel: novelUpdateResponse,
                });
              });
            } if (req.body.mode === 'insert-after' || req.body.mode === 'insert-before') {
              console.log('updating displaced chapters');

              const displacedChapters = [];

              // console.log('displacedChapterUpdates');
              // console.log(displacedChapterUpdates);

              displacedChapterUpdates.forEach(async (update) => {
                await Chapter.updateChapterByID(req, update, (displacedResponse) => {
                  displacedChapters.unshift(displacedResponse);
                });
              });

              return res.status(200).json({
                chapter: chapterResponse,
                novel: novelUpdateResponse,
                displacedChapters,
              });
            }
            if (novelUpdateResponse.error) {
              return res.status(400).json({ error: novelUpdateResponse.error });
            }
            return res.status(200).json({ chapter: chapterResponse, novel: novelUpdateResponse });
          });
        });
      }; // end publish

      // make sure that there is a novel to replace
      if (req.body.referenceChapter) {
        // search by the given chapter and novel
        return Chapter.searchByCriteria(req, {
          chapter: req.body.referenceChapter,
          novelID: req.body.novelID,
        }, (referenceResponse) => {
          // console.log('referenceResponse');
          // console.log(referenceResponse);

          // if there is somehow more than one novel
          if (Object.keys(referenceResponse).length > 1) {
            return res.status(400).json({ error: 'More than one reference novel found' });
          }

          const referenceChapter = Object.values(referenceResponse)[0];

          // check if the found novel is published
          if (referenceChapter.published) {
            if (req.body.mode === 'replace') {
              // replace the novel

              // console.log('pre-replace');

              newChapterName = referenceChapter.chapter;

              // update the new novel
              updates.chapterNumber = referenceChapter.chapterNumber;
              updates.chapter = newChapterName;
              updates.published = true;
            } else if (req.body.mode === 'insert-before') {
              // add before the given novel

              // console.log('pre-insert-before');

              newChapterName = referenceChapter.chapter;

              // update the inserted novel
              updates.chapterNumber = referenceChapter.chapterNumber;
              updates.chapter = newChapterName;
              updates.published = true;
            } else if (req.body.mode === 'insert-after') {
              // add after the given novel

              // console.log('pre-insert-after');

              newChapterName = referenceChapter.chapter;

              // update the new novel
              updates.chapterNumber = referenceChapter.chapterNumber;
              updates.chapter = newChapterName;
              updates.published = true;
            }

            return publish(referenceChapter);
          }
          return res.status(400).json({ error: 'Reference chapter is either unpublished or does not exist' });
        }).catch((err) => {
          console.log(err);
          return res.status(400).json({ error: 'Error searching for reference chapter' });
        });
      }
      return publish(null);
    });
  });
};

const editChapter = async (req, res) => {
  console.log('Edit Chapter');

  const updates = { chapterID: req.body.chapterID };

  // these are the only values that can be updated in this manner
  Object.entries(req.body).forEach((entry) => {
    const [key, value] = entry;
    switch (key) {
      case 'title':
        updates.title = value;
        break;
      case 'chapter':
        updates.chapter = value;
        break;
      case 'content':
        updates.content = value;
        break;
      case 'views':
        updates.views = value;
        break;
      default:
        break;
    }
  });

  // console.log('Chapter Updates:');
  // console.log(updates);

  await Chapter.updateChapterByID(req, updates, (response) => {
    if (response.error) {
      return res.status(400).json(response);
    }

    return res.status(200).json(response);
  });
};

const deleteChapter = (req, res) => {
  console.log('Delete Chapter');

  if (req.body.chapterID === null) {
    return res.status(400).json({ error: 'Missing chapterID' });
  }

  return Chapter.searchByID(req, req.body.chapterID, (chapterResponse) => {
    if (chapterResponse.error) {
      return res.status(400).json({ error: chapterResponse });
    }

    return Novel.searchByID(req, chapterResponse.novelID, async (novelResponse) => {
      if (novelResponse.error) {
        return res.status(400).json({ error: novelResponse.error });
      }

      const novelUpdates = { novelID: chapterResponse.novelID };

      const { chapters } = novelResponse;

      // delete the previous id
      await chapters.delete(chapterResponse.chapter);

      novelUpdates.chapters = chapters;

      return Novel.updateNovelByID(req, novelUpdates, async (novelUpdate) => {
        if (novelUpdate.error) {
          return res.status(400).json({ error: novelUpdate.error });
        }

        await Chapter.ChapterModel.deleteOne({ _id: req.body.chapterID });

        return res.status(200).json({ message: 'Success' });
      });
    });
  });
};

// Searching \\

// search novel by author and given username
const searchNovelsByUser = async (req, res) => {
  console.log(`Searching for novels by: ${req.body.user}`);

  return Novel.searchByCriteria(req, { author: req.body.user }, (response) => {
    if (response.error) {
      return res.status(400).json({ error: response.error });
    }

    return res.status(200).json({ novels: response.novels });
  });
};

// search novel by _id
const searchNovelByID = async (req, res) => {
  const searchedID = req.body.novelID;

  console.log(`Searching for novel by: ${searchedID}`);

  return Novel.searchByID(req, searchedID, (novel) => {
    if (novel === null) {
      return res.status(400).json({ error: `Error finding novel with id: ${searchedID}` });
    } if (novel.error) {
      // console.log('didnt get a novel');
      return res.status(400).json({ error: novel.error });
    }

    return res.status(200).json({ novel });
  });
};

const searchChapterByID = async (req, res) => {
  const searchedID = req.body.chapterID;

  console.log(`Searching for chapter by ID: ${searchedID}`);

  await Chapter.searchByID(req, searchedID, (response) => {
    if (response === null) {
      return res.status(400).json({ error: `Error finding chapter with id: ${searchedID}` });
    } if (response.error) {
      return res.status(400).json({ error: response.error });
    }

    return res.status(200).json({ chapter: response });
  });
};

const searchChapterNumber = async (req, res) => {
  console.log('search chapter number');

  // console.log(req.body);

  if (req.body.novelID === null || req.body.chapterNumber === null) {
    return res.status(400).json({ error: 'both novelID and chapterNumber are required' });
  }

  return Novel.searchByID(req, req.body.novelID, async (novelResponse) => {
    if (novelResponse.error) {
      console.log(novelResponse.error);
      return res.status(400).json(novelResponse.error);
    }

    let { chapters } = novelResponse;

    if (chapters === null) {
      chapters = new Map();
    }

    // console.log('chapters');
    // console.log(chapters);

    let chapterID = null;

    chapters.forEach((value, key) => {
      if (key.includes('chapter')) {
        const number = key.split('chapter-')[1];
        if (number === `${req.body.chapterNumber}` && chapterID === null) {
          console.log('setting chapterID');
          chapterID = value.toString();
        }
      }
    });

    // console.log(chapterID);

    if (!chapterID) {
      return res.status(400).json({ error: 'chapter not found' });
    }

    return Chapter.searchByID(req, chapterID, (chapterResponse) => {
      if (chapterResponse.error) {
        console.log(chapterResponse.error);
        return res.status(400).json(chapterResponse.error);
      }

      return res.status(200).json(chapterResponse);
    });
  });
};

const getAllNovels = async (req, res) => Novel.getAllNovels((response) => {
  // console.log('response');
  // console.log(response);
  if (response.error) {
    return res.status(400).json({ error: response.error });
  }
  return res.status(200).json(response);
});

module.exports = {
  createNovel,
  publishNovel,
  editNovel,
  // deleteNovel,
  createChapter,
  publishChapter,
  editChapter,
  deleteChapter,
  searchNovelsByUser,
  searchNovelByID,
  searchChapterByID,
  getAllNovels,
  searchChapterNumber,
};
