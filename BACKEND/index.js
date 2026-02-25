require('dotenv').config();
const cors = require('cors');
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const noteRoute = require('./routes/notes.routes.js');

app.use(cors());
app.use(express.json());
app.use('/api/notes', noteRoute);


mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        app.listen(process.env.PORT, () => {

            console.log(`server is running on port ${process.env.PORT}`)
        });
        console.log("DB connection successfull")
    })
    .catch(() => {
        console.log("Failed to connect to DB")
    });