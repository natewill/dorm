const express = require('express');
const multer = require('multer');
const path = require('path');
const app = express.Router();
const { MongoClient, ServerApiVersion } = require('mongodb');

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
  res.render('home');
}) 
// GET signup page
app.get('/signup', (req, res) => {
  res.render('signup'); // Ensure you have a 'signup' view
});

// POST signup with file upload
app.post('/signup', upload.single('file-upload'), async (req, res) => {


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

  
  const client = new MongoClient(process.env.MONGO_URI, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });

  await client.connect();

  var database = await client.db("Dormie")
  // Example: Insert Data into Database
  const data = {
    about: about,
    major: major,
    bedtime: bedtime,
    clean: clean,
    atmosphere: atmosphere
  };

  /*const login_data = {
    username
  }
    */

  try {
      user_data = await database.collection("user_data2")
      //login_data = await database.collection("password")
      await user_data.insertOne(data); // Replace with your DB logic
      //await login_data.insertOne()
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
