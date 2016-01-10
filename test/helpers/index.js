import 'source-map-support/register';
import app from '../../src/app';
import { insertFactoryModel } from './factory';
import db, * as dbModels from '../../src/db';
import request from 'supertest';

function clearDb() {
  const collections = db.connection.collections;
  for (const key in collections) {
    if (collections.hasOwnProperty(key)) {
      collections[key].remove({});
    }
  }
  db.connection.db.collection('sessions').remove({});
}

let server;
before(function (done) {
  const waitForDb = setInterval(() => {
    if (db.connection.readyState === 1) {
      clearInterval(waitForDb);
      clearDb();
      server = app.listen(8080);
      return done();
    }
  }, 500);
});
after(function () {
  db.disconnect();
  server.close();
});

export { server };

export function clearCollections(collections = []) {
  collections.forEach((collection) => {
    db.connection.db.collection(collection).remove({});
  });
}

export function httpClient(method, url, { accessToken, jwtToken, body }, expectedStatus, callback) {
  const actualRequest = request(server)[method]('/api/v1/' + url);
  if (accessToken) {
    actualRequest.set('Authorization', `Bearer ${accessToken}`);
  }
  if (jwtToken) {
    actualRequest.set('Authorization', `JWT ${jwtToken}`);
  }
  if (method !== 'get' && body) {
    actualRequest.send(body);
  }
  actualRequest
    .expect(expectedStatus)
    .end(callback);
}

export function getJwtToken(user, callback) {
  dbModels.User.findOne({ username: user.username }, (findErr, dbUser) => {
    if (findErr) return callback(findErr);
    callback(null, dbUser.generateJwt({ jwtid: dbUser.nonce }));
  });
}

export function getAccessToken(user, callback) {
  insertFactoryModel('Client', {}, (err, client) => {
    insertFactoryModel('AccessToken', {
      userId: user.id,
      clientId: client.id
    }, callback);
  });
}

export * from './factory';
