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
  const userID = req.cookies.user_id;
  const urlOwner = urls[parameter].userID;
  if (userID === urlOwner) {
    return true;
  }
  return false;
};

module.exports = { generateRandomString, requiredFields, getUserByEmail, urlsForUser, checkOwner };