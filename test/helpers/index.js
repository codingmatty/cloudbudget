import 'source-map-support/register';
import request from 'supertest';
import { insertFactoryModel } from './factory';
import db, * as dbModels from '../../src/db';
import app from '../../src/app';

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

export function httpClient(method, url, { accessToken, basicToken, jwtToken, body }, expectedStatus, callback) {
  const actualRequest = request(server)[method]('/api/v1/' + url);
  if (accessToken) {
    actualRequest.set('Authorization', `Bearer ${accessToken}`);
  }
  if (basicToken) {
    actualRequest.set('Authorization', `Basic ${basicToken}`);
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
    callback(null, dbUser.generateJwt({
      issuer: 'admin@cloudbudget.io',
      audience: 'cloudbudget.io',
      algorithms: ['RS256'],
      jwtid: dbUser.nonce.key
    }));
  });
}

export function getAccessToken(user, callback) {
  insertFactoryModel('Client', {}, (err, client) => {
    if (err) return callback(err);
    insertFactoryModel('AccessToken', {
      userId: user.id,
      clientId: client.id
    }, callback);
  });
}

export * from './factory';
