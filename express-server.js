const express = require('express');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const methodOverride = require('method-override');

// Helper functions
const { generateRandomString, requiredFields, getUserByEmail, urlsForUser, checkOwner, updateVisits } = require('./helpers');

// Server Set Up
const app = express();
const PORT = 8080;
app.set('view engine', 'ejs');

// Middleware Set Up
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['1553tiny43', '5252app23']
}));
app.use(methodOverride('_method'));

// Mock Databases
const urlDatabase = {};
const users = {};

// GET Requests

// Index route: If a user is logged in from a previous visit, directs them to /urls, otherwise sends them to the login page
app.get('/', (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

// Route for users utilizing the shortened url to link to the intended page
// calls updateVisits to update and/or set the tracking cookie and update the analytics
app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  updateVisits(req.params.shortURL, urlDatabase, req);
  res.redirect(longURL);
});

// Route to display list of all currently active shortened URLs
// If the user is not logged in, shows them a prompt to log in/register instead
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
// If their isn't any url that matches shortURL, displays a 404 error page
app.get('/urls/:shortURL', (req, res) => {
  const templateVars = {
    userInfo: users[req.session.user_id],
    shortURL: req.params.shortURL,
    urlInfo: urlDatabase[req.params.shortURL]
  };
  if (!templateVars.urlInfo) {
    templateVars.status = 404;
    templateVars.errorMessage = "The page or content you're looking for cannot be found";
    return res.status(404).render('errorPage', templateVars);
  }
  console.log(templateVars.urlInfo);
  res.render('urls_show', templateVars);
});

// Serves a registration page to user
app.get('/register', (req, res) => {
  const templateVars = { userInfo : users[req.session.user_id], emailTaken: false};
  if (templateVars.userInfo) {
    return res.redirect('/urls');
  }
  res.render('register', templateVars);
});

// Serves the login page to a user
// If a user is already logged in, redirects them to /urls
app.get('/login', (req, res) => {
  const templateVars = { userInfo : users[req.session.user_id], wrongInfo: false};
  if (templateVars.userInfo) {
    return res.redirect('/urls');
  }
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
      userID: req.session.user_id,
      visits: {
        total: 0,
        unique: 0,
        log: []
      }
    };
    return res.redirect(`/urls/${id}`);
  }
  // If a user is not logged in and tries to create a url, sends them to an error page
  const templateVars = { userInfo : users[req.session.user_id], status: 400, errorMessage: 'You must be logged in to create a URL'};
  res.status(400).render('errorPage', templateVars);
});

// Checks if a user corresponding to the provided email exists, then checks their password matches the provided password
// If both match, logs the user in (sets a cookie with their user_id)
// Otherwise sends back a status code of 403 and refreshes the page with an incorrect username/password prompt
app.post('/login', (req, res) => {
  let user = getUserByEmail(users, req.body.email);
  const templateVars = { userInfo : users[req.session.user_id], wrongInfo: false};
  if (user) {
    bcrypt.compare(req.body.password, user.password)
      .then((result) => {
        if (result) {
          req.session.user_id = user.userRandomID;
          return res.redirect('urls');
        }
        templateVars.wrongInfo = true;
        res.status(403).render('login', templateVars);
      })
      .catch(err => {
        if (err) {
          throw err;
        }
      });
  } else {
    templateVars.wrongInfo = true;
    res.status(403).render('login', templateVars);
  }
});

// Clears all active logins and redirects to the list of URLs
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

// Checks if both required fields were inputted, and that the email isn't already in use
// Then creates a new user with the provided details, and logs them in.
// Otherwise returns a status of 403 and displays an email already taken prompt
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
    const templateVars = { userInfo : users[req.session.user_id], emailTaken: true};
    res.status(403).render('register', templateVars);
  }
});

// PUT Requests

// Updates a given shortURL with a new longURL provided by logged in user
// Then sends them back to the master list of urls
app.put('/urls/:shortURL', (req, res) => {
  if (checkOwner(req.params.shortURL, req, urlDatabase)) {
    urlDatabase[req.params.shortURL].longURL = req.body.newURL;
    return res.redirect('/urls');
  }
  
  // If a user other than the creator attempts to edit the URL, sends them to an error page
  const templateVars = { userInfo: users[req.session.user_id], status: 401, errorMessage: 'You must be the creator of a URL to edit it.' };
  res.status(401).render('errorPage', templateVars);
});

// DELETE Requests

// Removes a given :shortURL from the database after checking to make sure the current user is the one who created the shortened URL
// Then redirects user to the list of all URLs
app.delete('/urls/:shortURL', (req, res) => {
  if (checkOwner(req.params.shortURL, req, urlDatabase)) {
    delete urlDatabase[req.params.shortURL];
    return res.redirect('/urls');
  }

  // If a user other than the one who created it tries to delete it, sends them to an error page
  const templateVars = { userInfo: users[req.session.user_id], status: 401, errorMessage: 'You must be the creator of a URL to delete it.' };
  res.status(401).render('errorPage', templateVars);
});

//404 page - this needs to remain at the bottom
app.get('*', (req, res) => {
  res.statusCode = 404;
  const templateVars = { userInfo: users[req.session.user_id], status: 404, errorMessage: `The page or content you're looking for cannot be found` };
  res.render('errorPage', templateVars);
});

app.post('*', (req, res) => {
  res.statusCode = 404;
  const templateVars = { userInfo: users[req.session.user_id], status: 404, errorMessage: `The page or content you're looking for cannot be found` };
  res.render('errorPage', templateVars);
});

// Function to start the server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});



