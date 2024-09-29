const express = require('express');
const multer = require('multer');
const path = require('path');
const app = express.Router();
const { MongoClient, ServerApiVersion } = require('mongodb');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

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
  c
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
    username_dict: username,
    about: about,
    major: major,
    bedtime: bedtime,
    clean: clean,
    atmosphere: atmosphere
  };

  const { spawn } = require('child_process');

  // Arguments to pass to the Python script

  let {username_dict, ...filteredDict} = data
  // Spawn a new Python process and execute script.py
  const dataAsArray = JSON.stringify(filteredDict);
  const pythonProcess = await spawn('python3', ['/Users/tld/IDrive Downloads/STLD-C79NL067NH/Desktop/dorm/website2/ranker.py', dataAsArray]);


  const data2 = await new Promise((resolve, reject) => {
    let result = '';

    // Capture stdout data
    pythonProcess.stdout.on('data', (data) => {
        result += data.toString();  // Collect the data from the Python process
    });

    // Handle process exit and resolve the promise with the data
    pythonProcess.on('close', (code) => {
        if (code === 0) {
            resolve({ username: username, data: result });
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
    username,
    password
  }
    

  try {
      user_database = await database.collection("user_data3")
      login_database = await database.collection("password")
      if(!data2){
        console.log("doc is undefined!")
      } else if(!login_data) {
        console.log("doc is undefined bro!")
      }
      await user_database.insertOne(data2);
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
