import 'source-map-support/register';
import app from '../../src/app';
import db from '../../src/db';
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

export function client(method, url, body, expectedStatus, callback) {
  const actualRequest = request(server)[method]('/api/v1/' + url);
  if (method !== 'get' && body) {
    actualRequest.send(body);
  }
  actualRequest
    .expect(expectedStatus)
    .end(callback);
}
