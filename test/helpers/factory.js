import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import * as dbModels from '../../src/db';

export function insertUser(callback) {
  dbModels.User.create({
    username: 'test',
    password: bcrypt.hashSync('test', 8),
    email: 'test@test.com',
    key: 'abcdef012345'
  }, callback);
}

export function getAccessToken(callback) {
  dbModels.User.findOne({ username: 'test' }, (err, user) => {
    if (err) return callback(err);
    jwt.sign(user.toJSON(), user.key, {
      expiresIn: '7d'
    }, (token) => {
      callback(null, token);
    });
  });
}
