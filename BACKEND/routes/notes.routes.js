const express = require('express');
const router = express.Router();
const { getNotes, getSingleNote, createNote, updateNote, deleteNote } = require('../controller/notes.controller.js');
const requireAuth = require('../middleware/auth.middleware.js');

router.use(requireAuth);

router.get('/', getNotes);
router.get('/:id', getSingleNote);

router.post('/', createNote);

router.put('/:id', updateNote);

router.delete('/:id', deleteNote);

module.exports = router;