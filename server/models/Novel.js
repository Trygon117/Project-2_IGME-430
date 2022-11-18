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
        default: "Book Cover",
    },
    coverMime: {
        type: String,
        trim: true,
        required: true,
    },
    chapters: {
        type: Number,
        default: 0,
        required: false,
    },
    published: {
        type: Boolean,
        default: false,
        required: true,
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
    chapters: doc.chapters,
    published: doc.published,
    createdDate: doc.createdDate,
    _id: doc._id,
});


NovelModel = mongoose.model('Novels', NovelSchema);
module.exports = NovelModel;
