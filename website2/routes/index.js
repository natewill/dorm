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
const mongoose = require('mongoose');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

require('dotenv').config();

const MongoStore = require('connect-mongo');

const sessionMiddleware = session({
  secret: process.env.SECRET_KEY ,  // Session secret key
  resave: false,              // Don't save session if unmodified
  saveUninitialized: false,    // Don't create session until something is stored 
  store: MongoStore.create({ mongoUrl: "mongodb+srv://natewilliams:admin@dormie.0whqn7z.mongodb.net/?retryWrites=true&w=majority&appName=Dormie" }) // Store session in MongoDB
});


app.use(sessionMiddleware);

const apiKey =  "mongodb+srv://natewilliams:admin@dormie.0whqn7z.mongodb.net/?retryWrites=true&w=majority&appName=Dormie";

const client = new MongoClient(apiKey, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: false, 
    deprecationErrors: true,
  },
});



// Now you can access the environment variable
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/'); // Ensure this directory exists
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

app.all("/login", async (req, res) => {
  if (req.method === "GET") {
    res.render("signin");
  } else if (req.method === "POST") {
    try {

      
      await client.connect();
      var database = await client.db("Dormie")
      login_database = await database.collection("password")
      var {username, password} = req.body

      const check = await login_database.findOne({ username: username });
      if (check.password === password) {
        req.session.username = username;
        req.session.save((err) => {
          if (err) {
            console.error('Session save error:', err);
            res.status(500).send('Internal Server Error');
          } else {
            res.redirect('/home');
          }
        });
      } else {
        res.send("Wrong Password!");
      }
    } catch {
      res.send("Wrong Details!");
    }
  }
});

app.get("/chats", async (req, res) => {
  const username = req.session.username;
  if (!username) {
    res.redirect("/login");
  } else {
    try {
      // Fetch the user's contacts from the database
      await client.connect();
      const database = client.db("Dormie");
      const messagesCollection = database.collection("messages");

      // Find distinct users who have messaged or been messaged by the current user
      const contactsFrom = await messagesCollection.distinct('to', { from: username });
      const contactsTo = await messagesCollection.distinct('from', { to: username });
      const contactsUsernames = [...new Set([...contactsFrom, ...contactsTo])]; // Unique contacts

      // Fetch contact details from the user collection
      const userCollection = database.collection('user_data4'); // all users
      const contacts = await userCollection.find({ username: { $in: contactsUsernames } }).toArray(); // all contacts that you have chatted with
      
      // Fetch or create chatId for each contact
      const chatsCollection = database.collection('chats');
      const contactsWithChatId = await Promise.all(contacts.map(async (contact) => {
        const existingChat = await chatsCollection.findOne({
          participants: { $all: [username, contact.username].sort() }
        });

        return {
          ...contact,
          chatId: existingChat ? existingChat._id.toString() : null
        };
      }));

      // Replace null chatIds with newly created chatIds
      for (let contact of contactsWithChatId) {
        if (!contact.chatId) {
          const newChat = {
            participants: [username, contact.username].sort(),
            createdAt: new Date(),
            lastMessageAt: new Date()
          };
          const result = await chatsCollection.insertOne(newChat);
          contact.chatId = result.insertedId.toString();
        }
      }

      const users = await userCollection.find({ username: { $ne: username } }).toArray(); // users that you can start a chat with

      res.render("chat", { username, contacts: contactsWithChatId, users });
    } catch (error) {
      console.error('Error fetching contacts:', error);
      res.status(500).send('Internal Server Error');
    } finally {
      await client.close();
    }
  }
});

app.get('/chats/:chatId/messages', async (req, res) => {
  const username = req.session.username;
  const { chatId } = req.params;

  if (!username) {
    return res.status(401).json({ error: 'User not logged in' });
  }

  try {
    await client.connect();
    const database = client.db("Dormie");
    const chatsCollection = database.collection("chats");//chats?
    const messagesCollection = database.collection("messages");//messages

    // Verify that the user is a participant in the chat
    const chat = await chatsCollection.findOne({
      _id: new mongoose.Types.ObjectId(chatId),
      participants: username
    });//find the chat that you are in

    if (!chat) {
      return res.status(403).json({ error: 'Not authorized to view this chat' });
    }

    // Retrieve messages
    const chatMessages = await messagesCollection.find({
      chatId: new mongoose.Types.ObjectId(chatId)
    }).sort({ timestamp: 1 }).toArray();//get all messages pertaining to this chat and sort them by recency

    return res.status(200).json({ messages: chatMessages });
  } catch (error) {
    console.error('Error retrieving messages:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await client.close();
  }
});

app.post('/chats/:chatId/messages', async (req, res) => {
  const username = req.session.username;
  const { chatId } = req.params; //? how does this work
  const { message } = req.body; //from a form?

  if (!username) {
    return res.status(401).json({ error: 'User not logged in' });
  }

  if (!message) {
    return res.status(400).json({ error: 'Message content is required' });
  }

  try {
    await client.connect();
    const database = client.db("Dormie");
    const chatsCollection = database.collection("chats"); //chats
    const messagesCollection = database.collection("messages"); //messages

    // Verify that the user is a participant in the chat
    const chat = await chatsCollection.findOne({
      _id: new mongoose.Types.ObjectId(chatId),
      participants: username
    });

    if (!chat) {
      return res.status(403).json({ error: 'Not authorized to send messages in this chat' });
    }

    // Determine the recipient
    const recipient = chat.participants.find(participant => participant !== username); //? find the other person in the chat ???

    // Insert the message
    const msgDoc = {
      chatId: new mongoose.Types.ObjectId(chatId),
      from: username,
      to: recipient,
      message,
      timestamp: new Date()
    }; //interesting

    await messagesCollection.insertOne(msgDoc); //add message to the database

    // Update the lastMessageAt in chats
    await chatsCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(chatId) },
      { $set: { lastMessageAt: new Date() } }
    ); //update the the time the last message was sent

    return res.status(201).json({ message: 'Message sent' });
  } catch (error) {
    console.error('Error sending message:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await client.close();
  }
});

app.post('/search', async (req, res) => {
  const username = req.session.username;
  const { first_name, last_name, major, dorm } = req.body;

  if (!username) {
    return res.status(401).json({ error: 'User not logged in' });
  }

  try {
    // Build the search_array
    const search_array = [];

    if (first_name) {
      search_array.push({ search_term: 'first_name', query: [first_name] });
    }
    if (last_name) {
      search_array.push({ search_term: 'last_name', query: [last_name] });
    }
    if (major) {
      search_array.push({ search_term: 'major', query: [major] });
    }
    if (dorm) {
      search_array.push({ search_term: 'dorm', query: [dorm] });
    }

    // Call MMA with the search_array
    const results = await MMA(username, search_array);

    // Return the search results to the client
    return res.status(200).json({ results });
  } catch (error) {
    console.error('Error searching:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/startChat', async (req, res) => {
  const username = req.session.username;      // User initiating the chat
  const { recipient } = req.body;             // Username of the recipient

  if (!username) {
    return res.status(401).json({ error: 'User not logged in' });
  }

  if (!recipient) {
    return res.status(400).json({ error: 'Recipient username is required' });
  }

  try {
    // Connect to MongoDB
    const client = new MongoClient(apiKey);
    await client.connect();
    const database = client.db("Dormie");
    const chatsCollection = database.collection("chats");
    const usersCollection = database.collection("user_data4");

    // Verify recipient exists
    const recipientUser = await usersCollection.findOne({ username: recipient }); //find the recerpient
    if (!recipientUser) {
      await client.close();
      return res.status(404).json({ error: 'Recipient user not found' });
    }

    // Check if a chat between these two users already exists
    const existingChat = await chatsCollection.findOne({
      participants: { $all: [username, recipient].sort() }
    }); 

    if (existingChat) {
      // Chat already exists
      await client.close();
      return res.status(200).json({ chatId: existingChat._id });
    } else {
      // Create a new chat document
      const newChat = {
        participants: [username, recipient].sort(),
        createdAt: new Date(),
        lastMessageAt: new Date()
      };

      const result = await chatsCollection.insertOne(newChat);
      await client.close();

      // Return the chat ID to the client
      return res.status(201).json({ chatId: result.insertedId }); //?look for this in the front end
    }
  } catch (error) {
    console.error('Error starting chat:', error);
    return res.status(500).json({ error: 'Internal server error' });
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

app.get("/settings", async (req, res) => {
  res.render('settings')
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
    class_year,
    atmosphere,
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
    email: email,
    uploadedFile: uploadedFile ? uploadedFile.filename : null,
    class_year: class_year
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


app.get("/search", (req, res) => {
  res.render("search")
})

module.exports = app;
