const notes = require('../model/Notes.model.js');

const getNotes = async (req, res) => {
    try {
        const note = await notes.find({});
        res.status(200).json(note);
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

const getSingleNote = async (req, res) => {
    try {
        const { id } = req.params;
        const note = await notes.findById(id);
        res.status(200).json(note);
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

const createNote = async (req, res) => {
    try {
        const note = await notes.create(req.body);
        res.status(201).json(note);
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

const updateNote = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedNote = await notes.findByIdAndUpdate(id, req.body, {new:true});
        if (!updatedNote) {
            return res.status(404).json({ message: "Note not found" });
        }
        res.status(200).json(updatedNote);
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

const deleteNote = async (req, res) => {
    try {
        const { id } = req.params;
        const note = await notes.findByIdAndDelete(id);

        if (!note) {
            return res.status(404).json({ message: "Note not found" })
        }
        res.status(200).json({ message: "Note deleted successfully" })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

module.exports = {
    getNotes,
    getSingleNote,
    updateNote,
    deleteNote,
    createNote
};