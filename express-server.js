const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

// Helper functions
const { generateRandomString } = require('./helpers');
const { requiredFields } = require('./helpers');
const { getUserByEmail } = require('./helpers')

// Server Set Up
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
const PORT = 8080;
app.set('view engine', 'ejs');

// Mock Databases
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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

app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get('/urls', (req, res) => {
  const templateVars = {userInfo : users[req.cookies.user_id], urls: urlDatabase};
  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {
  const templateVars = {userInfo : users[req.cookies.user_id]};
  res.render('urls_new', templateVars);
});

app.get('/urls/:shortURL', (req, res) => {
  const templateVars = {userInfo: users[req.cookies.user_id], shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL]};
  res.render('urls_show', templateVars);
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b>World</b></body></html>');
});

app.get('/register', (req, res) => {
  const templateVars = { userInfo : users[req.cookies.user_id]};
  res.render('register', templateVars);
});

app.get('/login', (req, res) => {
  const templateVars = { userInfo : users[req.cookies.user_id]};
  res.render('login', templateVars);
})


// POST requests

app.post('/urls', (req, res) => {
  let id = generateRandomString();
  urlDatabase[id] = req.body.longURL;
  res.redirect(`/urls/${id}`);
});

app.post('/urls/:shortURL/delete', (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

app.post('/urls/:id', (req, res) => {
  urlDatabase[req.params.id] = req.body.newURL;
  res.redirect('back');
});

app.post('/login', (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect('/urls')
})

app.post('/logout', (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls');
})

app.post('/register', (req, res) => {
  if(requiredFields(req) && !getUserByEmail(users, req.body.email)) {
    let newID = generateRandomString();
    users[newID] = {
      userRandomID: newID,
      email: req.body.email,
      password: req.body.password
    }
    res.cookie('user_id', newID);
    res.redirect('/urls')
  } else {
    res.statusCode = 400;
    res.redirect('back')
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



