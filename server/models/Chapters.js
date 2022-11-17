const mongoose = require('mongoose');

let ChapterModel = {};

const ChapterSchema = new mongoose.Schema({
    novelID: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    chapter: {
        type: Number,
        unique: true,
        required: true,
    },
    content: {
        type: String,
        trim: true,
        required: true,
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
ChapterSchema.statics.toAPI = (doc) => ({
    novelID: doc.novelID,
    chapter: doc.chapter,
    content: doc.content,
    createdDate: doc.createdDate,
    _id: doc._id,
})


ChapterModel = mongoose.model('Chapters', ChapterSchema);
module.exports = ChapterModel;
