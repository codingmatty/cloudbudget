import moment from 'moment';
import mongoose, { Schema } from 'mongoose';
import { defaultJSONOptions, pruneReadOnlyProps } from './';
import Transaction from './transaction';

const schema = new Schema({
  frequency: { type: String, enum: [
    'once', 'daily', 'weekly', 'biweekly', 'semimonthly', 'monthly', 'bimonthly', 'quarterly', 'semiannually', 'annually', 'custom'
  ], required: true },
  customFrequency: { type: Object },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  transaction: { type: Transaction.schema, default: new Transaction() }
}, {
  toJSON: defaultJSONOptions((/* doc, ret */) => {
  })
});

schema.statics.pruneReadOnlyProps = (objToPrune) => {
  const readOnlyProps = ['user', 'transaction.user'];
  return pruneReadOnlyProps(objToPrune, readOnlyProps);
};

schema.methods.submitTransaction = function submitTransaction(callback) {
  const schedule = this;
  const newTransaction = new Transaction(schedule.transaction.toJSON());
  newTransaction.save((err) => {
    if (err) return callback(err);
    if (schedule.frequency === 'once') {
      return schedule.remove({ _id: schedule.id }, callback);
    }
    let duration = null;
    switch (schedule.frequency) {
      case 'daily': duration = moment.duration(1, 'd'); break;
      case 'weekly': duration = moment.duration(1, 'w'); break;
      case 'biweekly': duration = moment.duration(2, 'w'); break;
      case 'semimonthly': duration = moment.duration(0.5, 'M'); break;
      case 'monthly': duration = moment.duration(1, 'M'); break;
      case 'bimonthly': duration = moment.duration(2, 'M'); break;
      case 'quarterly': duration = moment.duration(3, 'M'); break;
      case 'semiannually': duration = moment.duration(0.5, 'y'); break;
      case 'annually': duration = moment.duration(1, 'y'); break;
      case 'custom': break;
      default: break;
    }
    schedule.transaction.date = moment(schedule.transaction.date).add(duration);
    schedule.save(callback);
  });
};

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
