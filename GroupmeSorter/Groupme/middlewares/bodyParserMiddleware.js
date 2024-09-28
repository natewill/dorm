const express = require('express');
const bodyParser = require('body-parser');
const app = express();

// Parse URL-encoded bodies (as sent by HTML forms)
app.use(bodyParser.urlencoded({ extended: true }));

// Parse JSON bodies (as sent by API clients)
app.use(bodyParser.json());

// Import and use your routes
const indexRouter = require('./routes/index');
app.use('/', indexRouter);

// Start the server
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});