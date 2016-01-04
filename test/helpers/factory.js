import _ from 'lodash';
import bcrypt from 'bcrypt';
import chai from 'chai';
import chaiJsFactories from 'chai-js-factories';
import * as dbModels from '../../src/db';
import randomKey from 'random-key';

chai.use(chaiJsFactories);
const Factory = chai.factory;

export function insertFactoryModel(model, attributes, callback) {
  dbModels[model].create(Factory.create(model, attributes), (err, doc) => {
    callback(err, doc.toJSON());
  });
}

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
    key: randomKey.generate(12)
  }, attributes);
});

Factory.define('AccountGroup', function (attributes = {}) {
  const {
    name = this.sequence(i => `Account Group ${i}`)
  } = attributes;
  return _.merge({
    name
  }, attributes);
});

Factory.define('Account', function (attributes = {}) {
  const {
    name = this.sequence(i => `Account ${i}`)
  } = attributes;
  return _.merge({
    name,
    accountType: this.sample('savings', 'checking', 'credit_card', 'loan', 'investment'),
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
    state: this.sample('none', 'cleared', 'reconciled'),
    amount: 0,
    memo: 'This memo applies to a Transaction',
    tags: ['Tag 1', 'Tag 2', 'Tag 3']
  }, attributes);
});

// export Factory;
