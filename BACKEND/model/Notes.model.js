const mongoose = require('mongoose');

const notesSchema = mongoose.Schema(
    {
        Title: {
            type: String,
            required: true
        },
        Document: {
            type: String,
            required: true
        }

    },
    {
        timestamps: true
    }
);

const notes = mongoose.model("Notes", notesSchema);
module.exports = notes;
