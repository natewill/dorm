const express = require('express');
const multer = require('multer');
const path = require('path');
const app = express.Router();
const crypto = require('crypto')
const session = require('express-session');
const { MongoClient, ServerApiVersion } = require('mongodb');
const { spawn } = require('child_process');
const { Writable } = require('stream');
const MMA = require('../src/MMA');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

require('dotenv').config();

app.use(session({
  secret: process.env.SECRET_KEY,  // Session secret key
  resave: false,              // Don't save session if unmodified
  saveUninitialized: false   // Don't create session until something is stored 
}));



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


      const client = new MongoClient(apiKey, {
        serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true,
        }
      });

      
      await client.connect();
      var database = await client.db("Dormie")
      login_database = await database.collection("password")
      var {username, password} = req.body


      const check = await login_database.findOne({ username: username });
      if (check.password === password) {
        req.session.username = username;
        res.redirect("/home");
      } else {
        res.send("Wrong Password!");
      }
    } catch {
      res.send("Wrong Details!");
    }
  }
});

app.get("/", (req, res) => {
  res.redirect("/home")
});

app.get("/logout", (req, res) => {
  res.redirect("/login");
});

app.get("/search",  async (req, res) => {
  res.render('search')
})

app.get("/home", async (req, res) => {
  if(!req.session.username){
    res.redirect("/login")
  }

  var usersFromPython = await MMA(req.session.username);

  res.render('home', {users: usersFromPython});

}) 
// GET signup page
app.get('/signup', (req, res) => {
  res.render('signup'); // Ensure you have a 'signup' view
});

// POST signup with file upload
app.post('/signup', upload.single('file-upload'), async (req, res) => {


  // Extract form data
  const {
    username_in_req,
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
  const data_dict = {
    username: username_in_req,
    about: about,
    major: major,
    bedtime: bedtime,
    clean: clean,
    atmosphere: atmosphere,
    first_name: first_name,
    last_name: last_name,
    gender: gender,
    dorm: dorm,
    email: email
  };

  const { spawn } = require('child_process');

  // Arguments to pass to the Python script

  let {username, ...filteredDict} = data_dict //all the data except the username
  // Spawn a new Python process and execute script.py
  const dataAsArray = JSON.stringify(filteredDict); //turn into json
  const pythonProcess = await spawn('python3', ['ranker.py', dataAsArray]); //port into python


  const data2 = await new Promise((resolve, reject) => {
    let result = '';

    // Capture stdout data
    pythonProcess.stdout.on('data', (data) => {
        result += data.toString();  // Collect the data from the Python process
    });

    // Handle process exit and resolve the promise with the data
    pythonProcess.on('close', (code) => {
        if (code === 0) {
            resolve({ ...data_dict, vector: JSON.parse(result)});
            console.log("Python script finished successfully.");
        } else {
            reject(new Error(`Python process exited with code ${code}`));
        }

        pythonProcess.on('error', (err) => {
          reject(err);
      });
    });
  })



  const login_data = {
    username: username_in_req,
    password
  }
    

  try {
      user_database = await database.collection("user_data4")
      login_database = await database.collection("password")
      if(!data2){
        console.log("doc is undefined!")
      } else if(!login_data) {
        console.log("doc is undefined bro!")
      }
      await user_database.insertOne(data2);
      await login_database.insertOne(login_data)
      res.redirect('login'); // Redirect or render as needed
    } catch (error) {
      console.error(error);
      res.render('signup', { error: 'An error occurred during signup. Please try again.' });
    }

    client.close();
});

app.get("/logout", (req, res) => {
  res.redirect("/signin");
});

app.get("/chat", (req, res) => {
  res.render("chat")
})

app.get("/search", (req, res) => {
  res.render("search")
})

module.exports = app;
