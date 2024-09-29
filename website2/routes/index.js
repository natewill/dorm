const express = require('express');
const multer = require('multer');
const path = require('path');
const app = express.Router();

// Configure Multer Storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Ensure this directory exists
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

app.get("/", (req, res) => {
  res.render("signin");
});

app.get("/home", (req, res) => {
  res.render("home")
}) 
// GET signup page
app.get('/signup', (req, res) => {
  res.render('signup'); // Ensure you have a 'signup' view
});

// POST signup with file upload
app.post('/signup', upload.single('file-upload'), async (req, res) => {
  console.log('Form Data:', req.body); // Form fields
  console.log('Uploaded File:', req.file); // Uploaded file info

  // Extract form data
  const {
    username,
    about,
    first_name,
    last_name,
    email,
    gender,
    major,
    dorm,
    bedtime,
    clean,
    atmosphere
  } = req.body;

  // Access the uploaded file via req.file
  const uploadedFile = req.file;

  // Example: Validate and Save Data
  if (!uploadedFile) {
    return res.render('signup', { error: 'Please upload a file.' });
  }

  // Example: Insert Data into Database
  const data = {
    username,
    about,
    firstName,
    lastName,
    email,
    gender,
    major,
    dorm,
    bedtime,
    clean,
    atmosphere,
    photo: uploadedFile.filename // Store the filename or path as needed
  };

  try {
    await collection.insertOne(data); // Replace with your DB logic
    res.render('signin'); // Redirect or render as needed
  } catch (error) {
    console.error(error);
    res.render('signup', { error: 'An error occurred during signup. Please try again.' });
  }
});

app.get("/logout", (req, res) => {
  res.redirect("/login");
});

module.exports = app;
