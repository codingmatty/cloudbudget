import moment from 'moment';
import mongoose, { Schema } from 'mongoose';
import { defaultJSONOptions } from './';
import Transaction from './transaction';

const schema = new Schema({
  frequency: { type: String, enum: [
    'once', 'daily', 'weekly', 'biweekly', 'semimonthly', 'monthly', 'bimonthly', 'quarterly', 'semiannually', 'annually', 'biannually', 'custom'
  ], required: true },
  customFrequency: { type: Object },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  transaction: { type: Transaction.schema, default: new Transaction() }
}, {
  toJSON: defaultJSONOptions((/* doc, ret */) => {
  })
});

schema.static('readonlyProps', () => {
  return ['user'];
});

schema.path('transaction').validate(function validateTransaction(value, next) {
  // const schedule = this;
  const today = moment().utc().startOf('day');
  const transactionDate = moment(new Date(value.date).toISOString()).utc().startOf('day');
  if (transactionDate <= today) {
    return next(false, 'Transaction date must be later than today.');
  }
  next(true);
});

const Schedule = mongoose.model('Schedule', schema);

Schedule.schema.pre('validate', function normalizeSchedule(next) {
  const schedule = this;
  schedule.transaction.user = schedule.user;
  schedule.transaction.date = moment(new Date(schedule.transaction.date).toISOString()).utc().startOf('day');
  next();
});

export default Schedule;
