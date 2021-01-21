const express = require('express');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');

// Helper functions
const { generateRandomString } = require('./helpers');
const { requiredFields } = require('./helpers');
const { getUserByEmail } = require('./helpers');
const { urlsForUser } = require('./helpers');
const { checkOwner } = require('./helpers.js');


// Server Set Up
const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['1553tiny43', '5252app23']
}));
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
  if(req.session.user_id) {
    res.redirect('/urls');
  } else {
    res.redirect('/login')
  }
});

// Route for users utilizing the shortened url to link to the intended page
app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

// Route to display list of all currently active shortened URLs
app.get('/urls', (req, res) => {
  const user = req.session.user_id;
  const urlsToShow = urlsForUser(urlDatabase, user);
  const templateVars = {userInfo : users[req.session.user_id], urls: urlsToShow};
  res.render('urls_index', templateVars);
});

// Serves a page to a user that allows them to create a new URL if the user is logged in.
// Otherwise redirects them to the login page
app.get('/urls/new', (req, res) => {
  const templateVars = {userInfo : users[req.session.user_id]};
  if (req.session.user_id) {
    res.render('urls_new', templateVars);
  } else {
    res.render('login', templateVars);
  }
});

// Displays information specific to the :shortURL provided, including ability to edit it
app.get('/urls/:shortURL', (req, res) => {
  const templateVars = {
    userInfo: users[req.session.user_id],
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
  const templateVars = { userInfo : users[req.session.user_id]};
  res.render('register', templateVars);
});

// Serves the login page to a user
app.get('/login', (req, res) => {
  const templateVars = { userInfo : users[req.session.user_id]};
  res.render('login', templateVars);
});


// POST requests

// Generates a new shortened URL for a given longURL, assigns it an ID and saves it in the mock database object
// Then redirects user to the informational page about their new URL
app.post('/urls', (req, res) => {
  // only logged in users should be able to create URLs
  if (req.session.user_id) {
    let id = generateRandomString();
    urlDatabase[id] = {
      longURL: req.body.longURL,
      userID: req.session.user_id
    };
    res.redirect(`/urls/${id}`);
  }
});

// Removes a given :shortURL from the database after checking to make sure the current user is the one who created the shortened URL
// Then redirects user to the list of all URLs
app.post('/urls/:shortURL/delete', (req, res) => {
  if (checkOwner(req.params.shortURL, req, urlDatabase)) {
    delete urlDatabase[req.params.shortURL];
  }
  res.redirect('/urls');
});

// Updates a given shortURL with a new longURL provided by logged in user
// Then refreshes the page
app.post('/urls/:shortURL', (req, res) => {
  if (checkOwner(req.params.shortURL, req, urlDatabase)) {
    urlDatabase[req.params.shortURL].longURL = req.body.newURL;
  }
  res.redirect('back');
});

// Checks if a user corresponding to the provided email exists, then checks their password matches the provided password
// If both match, logs the user in (sets a cookie with their user_id)
// Otherwise sends back a status code of 403 and refreshes the page
app.post('/login', (req, res) => {
  let user = getUserByEmail(users, req.body.email);
  if (user) {
    bcrypt.compare(req.body.password, user.password)
      .then((result) => {
        if (result) {
          req.session.user_id = user.userRandomID;
          return res.redirect('urls');
        }
        res.status(403).send('Username or Password incorrect');
      })
      .catch(err => {
        if (err) {
          throw err;
        }
      });
  } else {
    res.status(403).send('Username or Password incorrect');
  }
});

// Clears all active logins and redirects to the list of URLs
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

// Checks if both required fields were inputted, and that the email isn't already in use
// Then creates a new user with the provided details, and logs them in.
// Otherwise returns a status of 400 and refreshes the page
app.post('/register', (req, res) => {
  if (requiredFields(req) && !getUserByEmail(users, req.body.email)) {
    bcrypt.hash(req.body.password, 10)
      .then((hash) => {
        let newID = generateRandomString();
        users[newID] = {
          userRandomID: newID,
          email: req.body.email,
          password: hash
        };
        req.session.user_id = newID;
        res.redirect('/urls');
      });
  } else {
    res.status(400).send('That email is unavailable');
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



