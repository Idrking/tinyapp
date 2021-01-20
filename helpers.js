const generateRandomString = () => {
  return Math.floor((1 + Math.random()) * 100000000).toString(32);
};

const requiredFields = req => {
  return req.body.email && req.body.password
};

const getUserByEmail = (users, email) => {
  for (let userID in users) {
    if (users[userID].email === email) {
      return users[userID];
    }
  }
  return undefined;
};


module.exports = { generateRandomString, requiredFields, getUserByEmail };