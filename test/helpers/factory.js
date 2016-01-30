import _ from 'lodash';
import chai from 'chai';
import bcrypt from 'bcrypt';
import randomKey from 'random-key';
import chaiJsFactories from 'chai-js-factories';
import * as dbModels from '../../src/db';

chai.use(chaiJsFactories);
const Factory = chai.factory;

export function insertFactoryModel(model, attributes, callback) {
  dbModels[model].create(Factory.create(model, attributes), (err, doc) => {
    callback(err, doc ? doc.toJSON() : null);
  });
}

Factory.define('AccessToken', function (attributes = {}) {
  return _.merge({
    token: randomKey.generate(64),
    refreshToken: randomKey.generate(64),
    permissions: 'password'
  }, attributes);
});

Factory.define('Client', function (attributes = {}) {
  const {
    name = this.sequence(i => `Name ${i}`)
  } = attributes;
  return _.merge({ name }, dbModels.Client.generateCredentials(), attributes);
});

Factory.define('User', function (attributes = {}) {
  const {
    username = this.sequence(i => `User ${i}`),
    password = this.sequence(i => bcrypt.hashSync(`password${i}`, 8)),
    email = this.sequence(i => `user${i}@test.com`)
  } = attributes;
  return _.merge({
    username,
    password,
    email,
    nonce: { key: randomKey.generate(12) }
  }, attributes);
});

Factory.define('Account', function (attributes = {}) {
  const {
    name = this.sequence(i => `Account ${i}`),
    group = this.sequence(i => `Group ${i}`)
  } = attributes;
  return _.merge({
    name,
    group,
    type: this.sample('savings', 'checking', 'credit_card', 'loan', 'investment'),
    budget: true,
    notes: 'This note applies to an Account'
  }, attributes);
});

Factory.define('Transaction', function (attributes = {}) {
  const {
    payee = this.sequence(i => `Payee ${i}`)
  } = attributes;
  return _.merge({
    payee,
    state: this.sample('unapproved', 'pending', 'cleared', 'reconciled'),
    amount: 0,
    memo: 'This memo applies to a Transaction',
    tags: ['Tag 1', 'Tag 2', 'Tag 3']
  }, attributes);
});

// export Factory;
