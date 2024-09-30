// app.js

const createError = require('http-errors');
const express = require('express');
const path = require('path');
const indexRouter = require('./routes/index');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const sharedsession = require('express-socket.io-session');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config(); // Ensure dotenv is loaded early

const app = express();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketIo(server, {
  cors: {
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Session middleware
const sessionMiddleware = session({
  secret: process.env.SECRET_KEY, // Ensure SECRET_KEY is defined in .env
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ 
    mongoUrl: process.env.MONGO_URI, // Use environment variable
    // Additional options if needed
  }),
  cookie: { 
    secure: false, // Set to true if using HTTPS
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
});

// Use session middleware in Express
app.use(sessionMiddleware);

// Share session with Socket.IO
io.use(sharedsession(sessionMiddleware, {
  autoSave: true
}));

// Middleware Setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// View Engine Setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Routes
app.use('/', indexRouter);

// Catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// Error Handler
app.use(function(err, req, res, next) {
  // Set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // Render the error page
  res.status(err.status || 500);
  res.render('error');
});

// Initialize Chat Handler
require('./src/chat')(io);

// Start Server
const PORT = process.env.PORT || 3000; // Use environment variable or default to 3000
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
