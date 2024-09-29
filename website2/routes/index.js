const express = require('express');
const multer = require('multer');
const path = require('path');
const app = express.Router();
const { MongoClient, ServerApiVersion } = require('mongodb');

// Configure Multer Storage

require('dotenv').config();

// Now you can access the environment variable
const apiKey =  "mongodb+srv://natewilliams:admin@dormie.0whqn7z.mongodb.net/?retryWrites=true&w=majority&appName=Dormie";

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

const client = new MongoClient(apiKey, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

app.all("/login", async (req, res) => {
  if (req.method === "GET") {
    res.render("signin");
  } else if (req.method === "POST") {
    try {
      await client.connect();

      var database = await client.db("Dormie")
      login_database = await database.collection("password")
      const check = await login_database.findOne({ name: req.body.username });

      if (check.password === req.body.password) {
        res.render("home");
      } else {
        res.send("Wrong Password!");
      }
    } catch {
      res.send("Wrong Details!");
    }
  }
});

app.get("/logout", (req, res) => {
  res.redirect("/login");
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
    password,
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

  const login_data = {
    username,
    password
  }
    

  try {
      user_database = await database.collection("user_data2")
      login_database = await database.collection("password")
      await user_database.insertOne(data);
      await login_database.insertOne(login_data)
      res.render('signin'); // Redirect or render as needed
    } catch (error) {
      console.error(error);
      res.render('signup', { error: 'An error occurred during signup. Please try again.' });
    }

    client.close();
});

app.get("/logout", (req, res) => {
  res.redirect("/signin");
});

module.exports = app;
