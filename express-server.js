const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

// Helper functions
const { generateRandomString } = require('./helpers');
const { requiredFields } = require('./helpers');
const { getUserByEmail } = require('./helpers');
const { urlsForUser } = require('./helpers');


// Server Set Up
const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
const PORT = 8080;
app.set('view engine', 'ejs');

// Mock Databases
const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: 'e3434e'},
  "9sm5xK": { longURL: "http://www.google.com", userID: 'e3434e'}
};

const users = {
  e3434e: {
    userRandomID: 'e3434e',
    email: 'testemail@yahoo.gov',
    password: 'arealpassword'
  }
};

// GET Requests

app.get('/', (req, res) => {
  res.send("Hello!");
});

// Route for users utilizing the shortened url to link to the intended page
app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

// Route to display list of all currently active shortened URLs
app.get('/urls', (req, res) => {
  const user = req.cookies.user_id;
  const urlsToShow = urlsForUser(urlDatabase, user);
  const templateVars = {userInfo : users[req.cookies.user_id], urls: urlsToShow};
  res.render('urls_index', templateVars);
});

// Serves a page to a user that allows them to create a new URL
app.get('/urls/new', (req, res) => {
  const templateVars = {userInfo : users[req.cookies.user_id]};
  if (req.cookies.user_id) {
    res.render('urls_new', templateVars);
  } else {
    res.render('login', templateVars)
  }
});

// Displays information specific to the :shortURL provided, including ability to edit it
app.get('/urls/:shortURL', (req, res) => {
  const templateVars = {
    userInfo: users[req.cookies.user_id],
    shortURL: req.params.shortURL,
    urlInfo: urlDatabase[req.params.shortURL]
  };
  res.render('urls_show', templateVars);
});

// returns the active shortened URLs as a JSON object
app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

// Serves a registration page to user
app.get('/register', (req, res) => {
  const templateVars = { userInfo : users[req.cookies.user_id]};
  res.render('register', templateVars);
});

// Serves the login page to a user
app.get('/login', (req, res) => {
  const templateVars = { userInfo : users[req.cookies.user_id]};
  res.render('login', templateVars);
});


// POST requests

// Generates a new shortened URL for a given longURL, assigns it an ID and saves it in the mock database object
// Then redirects user to the informational page about their new URL
app.post('/urls', (req, res) => {
  let id = generateRandomString();
  urlDatabase[id] = {
    longURL: req.body.longURL,
    userID: req.cookies.user_id
  };
  res.redirect(`/urls/${id}`);
});

// Removes a given :shortURL from the database
// Then redirects user to the list of all URLs
app.post('/urls/:shortURL/delete', (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

// Updates a given shortURL with a new longURL provided by user
// Then refreshes the page
app.post('/urls/:shortURL', (req, res) => {
  urlDatabase[req.params.shortURL].longURL = req.body.newURL;
  res.redirect('back');
});

// Checks if a user corresponding to the provided email exists, then checks their password matches the provided password
// If both match, logs the user in (sets a cookie with their user_id)
// Otherwise sends back a status code of 403 and refreshes the page
app.post('/login', (req, res) => {
  let user = getUserByEmail(users, req.body.email);
  if (user) {
    if (req.body.password === user.password) {
      res.cookie('user_id', user.userRandomID);
      res.redirect('urls');
      return;
    }
  }
  res.statusCode = 403;
  res.redirect('back');
});

// Clears all active logins and redirects to the list of URLs
app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

// Checks if both required fields were inputted, and that the email isn't already in use
// Then creates a new user with the provided details, and logs them in.
// Otherwise returns a status of 400 and refreshes the page
app.post('/register', (req, res) => {
  if (requiredFields(req) && !getUserByEmail(users, req.body.email)) {
    let newID = generateRandomString();
    users[newID] = {
      userRandomID: newID,
      email: req.body.email,
      password: req.body.password
    };
    res.cookie('user_id', newID);
    res.redirect('/urls');
  } else {
    res.statusCode = 400;
    res.redirect('back');
  }
});

//404 page - this needs to remain at the bottom
app.get('*', (req, res) => {
  res.statusCode = 404;
  res.render('404');
});

app.post('*', (req, res) => {
  res.statusCode = 404;
  res.render('404');
});

// Function to start the server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});



