import mongoose, { Schema, Types } from 'mongoose';
import { defaultJSONOptions, pruneReadOnlyProps } from './';

const schema = new Schema({
  income: [{ type: Schema.Types.ObjectId, ref: 'Schedule' }],
  bills: [{ type: Schema.Types.ObjectId, ref: 'Schedule' }],
  savings: { type: Number, default: 0 },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  toJSON: defaultJSONOptions()
});

schema.statics.pruneReadOnlyProps = (objToPrune) => {
  const readOnlyProps = ['user'];
  return pruneReadOnlyProps(objToPrune, readOnlyProps);
};

const Plan = mongoose.model('Plan', schema);

export default Plan;
