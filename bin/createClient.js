var _ = require('lodash');
var Client = require('../dist/db').Client;

var newClient = _.merge({
  name: 'Test Client',
  permissions: ['password', 'code']
}, Client.generateCredentials());

Client.create(newClient, function (err, client) {
  if (err) return err;
  console.log(newClient);
  return 0;
});
