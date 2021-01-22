// Generates a random string to use as visitor, url or account IDs
const generateRandomString = () => {
  return Math.floor((1 + Math.random()) * 100000000).toString(32);
};

// checks to confirm all the required fields in a form have been filled in
const requiredFields = req => {
  return req.body.email && req.body.password;
};

// Given an object of users, and an email, returns the user object whose email matches the provided one
// If no user exists with that email, returns undefined
const getUserByEmail = (users, email) => {
  for (let userID in users) {
    if (users[userID].email === email) {
      return users[userID];
    }
  }
  return undefined;
};

// Given a object containing URL information, returns an array of shortURLs that belong to the user[id]
// If an id isn't provided, returns undefined, otherwise returns an empty array if the user hasn't created any urls
const urlsForUser = (urls, id) => {
  if (id === undefined) {
    return undefined;
  }

  const matchingURLS = [];
  for (const shortURL in urls) {
    if (urls[shortURL].userID === id) {
      let urlInfo = {
        shortURL,
        longURL: urls[shortURL].longURL,
        userID: urls[shortURL].usedID
      };
      matchingURLS.push(urlInfo);
    }
  }
  return matchingURLS;
};

// Confirms that the currently logged in user and the user who own a particular URL are the same person
// returns true if they match, false otherwise
const checkOwner = (parameter, req, urls) => {
  const userID = req.session.user_id;
  const urlOwner = urls[parameter].userID;
  if (userID === urlOwner) {
    return true;
  }
  return false;
};

// First checks if a tracking cookie has been created for this user.
// If it has, parses that tracking cookie into an object, and then checks if it has visited this specific link before
// It it has, returns true, otherwise it pushs the shortURL of this link to the visits log, and then returns false (indicating they haven't been to this link before)
// Otherwise creates a new tracking cookie, and assigns the visitor a unique ID.
const updateTrackingCookie = (req, id) => {
  if (req.session.visits) {
    const visits = JSON.parse(req.session.visits);
    if (visits.sitesVisited.includes(id)) {
      return true;
    }
    visits.sitesVisited.push(id);
    req.session.visits = JSON.stringify(visits);
    return false;
  }
  req.session.visits = JSON.stringify({visID: generateRandomString(), sitesVisited: [id]});
  return false;
};

// Parses the visits cookie, and creates a new visitor log entry for the given url[id]
// as an object with a visitor ID and the current timestamp
const updateVisitLog = (id, urls, req) => {
  const visits = JSON.parse(req.session.visits);
  const newLogEntry = {
    visID: visits.visID,
    date: new Date(Date.now()).toLocaleString('en-us', {timeZone: 'America/Vancouver'})
  };
  urls[id].visits.log.push(newLogEntry);
};

// if updateTrackingCookie returns true (indicating the user has visited this page before)
// increments the total visit counter for that URL
// Otherwise increments both the unique and total counters
// Then updates the log of visits to display on the URL page
const updateVisits = (id, urls, req) => {
  if (updateTrackingCookie(req, id)) {
    urls[id].visits.total += 1;
  } else {
    urls[id].visits.total += 1;
    urls[id].visits.unique += 1;
  }
  updateVisitLog(id, urls, req);
};

module.exports = { generateRandomString, requiredFields, getUserByEmail, urlsForUser, checkOwner, updateVisits };