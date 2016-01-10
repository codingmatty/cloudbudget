import randomKey from 'random-key';
import mongoose, { Schema } from 'mongoose';
import { defaultJSONOptions } from './';

const accessTokenSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  clientId: { type: Schema.Types.ObjectId, ref: 'Client' },
  token: { type: String, default: randomKey.generate(64) },
  refreshToken: { type: String, default: randomKey.generate(64) }
}, {
  toJSON: defaultJSONOptions()
});

const AccessToken = mongoose.model('AccessToken', accessTokenSchema);

export default AccessToken;
