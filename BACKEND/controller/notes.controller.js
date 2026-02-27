const notes = require('../model/Notes.model.js');

const getNotes = async (req, res) => {
    try {
        const note = await notes.find({user: req.user.id});
        res.status(200).json(note);
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

const getSingleNote = async (req, res) => {
    try {
        const { id } = req.params;
        const note = await notes.findById({_id: id, user:req.user.id});
        res.status(200).json(note);
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

const createNote = async (req, res) => {
    try {
        const newNoteData = {...req.body, user:req.user.id}
        const note = await notes.create(newNoteData);
        res.status(201).json(note);
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

const updateNote = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedNote = await notes.findByIdAndUpdate({_id:id, user:req.user.id}, req.body, {new:true});
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
        const note = await notes.findByIdAndDelete({_id:id, user:req.user.id});

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