const models = require('../models');
const helper = require('../helper.js');

const { Novels } = models;
const { Chapters } = models;

//Novels

createNovel = (req, res) => {
    console.log('Create Novel');
    const title = `${req.body.title}`;
    const cover = req.body.cover;

    const sessionUsername = req.session.account.username;

    console.log(req.files);


    const usersNovels = Novels.find({ author: sessionUsername });

    //console.log(usersNovels);

};

publishNovel = (req, res) => {
    console.log('Publish Novel');
};

editNovel = (req, res) => {
    console.log('Edit Novel');
};

deleteNovel = (req, res) => {
    console.log('Delete Novel');
};

// Chapters

createChapter = (req, res) => {
    console.log('Create Chapter');
};

publishChapter = (req, res) => {
    console.log('Publish Chapter');
};

editChapter = (req, res) => {
    console.log('Delete Chapter');
};

deleteChapter = (req, res) => {
    console.log('Delete Chapter');
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
};
