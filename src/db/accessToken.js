import randomKey from 'random-key';
import mongoose, { Schema } from 'mongoose';
import { defaultJSONOptions } from './';

const accessTokenSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  clientId: { type: Schema.Types.ObjectId, ref: 'Client' },
  token: { type: String, required: true },
  refreshToken: { type: String, required: true },
  date: { type: Date, default: Date.now, expires: '14d' } // AccessToken expires in 14 days.
}, {
  toJSON: defaultJSONOptions()
});

accessTokenSchema.statics.generateTokens = () => {
  return {
    token: randomKey.generate(64),
    refreshToken: randomKey.generate(64)
  };
};

const AccessToken = mongoose.model('AccessToken', accessTokenSchema);

export default AccessToken;
