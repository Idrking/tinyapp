const { assert } = require('chai');
const { getUserByEmail } = require('../helpers.js');

const testUsers = {
  'userRandomID': {
    id: 'userRandomID',
    email: 'user@example.com',
    password: 'purple-monkey-dinosaur'
  },
  'user2RandomID': {
    id: 'user2RandomID',
    email: 'user2@example.com',
    password: 'dishwasher-funk'
  }
};

describe('#getUserByEmail', () => {
  it('should return a user with a valid email', () => {
    const user = getUserByEmail(testUsers, 'user@example.com');
    const expectedOutput = 'userRandomID';
    assert.strictEqual(user.id, expectedOutput);
    assert.isObject(user);
  });

  it('should return undefined with an email not in use', () => {
    const user = getUserByEmail(testUsers, 'notarealemail@yahoo.gov');
    assert.isUndefined(user);
  });
})