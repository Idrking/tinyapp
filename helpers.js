const generateRandomString = () => {
  return Math.floor((1 + Math.random()) * 100000000).toString(32);
};

const requiredFields = req => {
  return req.body.email && req.body.password;
};

const getUserByEmail = (users, email) => {
  for (let userID in users) {
    if (users[userID].email === email) {
      return users[userID];
    }
  }
  return undefined;
};

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

const checkOwner = (parameter, req, urls) => {
  const userID = req.session.user_id;
  const urlOwner = urls[parameter].userID;
  if (userID === urlOwner) {
    return true;
  }
  return false;
};

// Updates the total visit tracker, and unique visit tracker on the given urls[id] object.
// If the user has visited the link before, updates total visit tracker
// Otherwise sets a cookie named after the longURL, with a value of true to indicate they've visited that site via this link, and updates the total and unique tracker
const updateVisits = (id, urls, req) => {
  if(req.session[urls[id].longURL]) {
    urls[id].visits.total += 1;
  } else {
    req.session[urls[id].longURL] = true;
    urls[id].visits.total += 1;
    urls[id].visits.unique += 1;
  }
};

module.exports = { generateRandomString, requiredFields, getUserByEmail, urlsForUser, checkOwner, updateVisits };