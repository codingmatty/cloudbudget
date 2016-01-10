import randomKey from 'random-key';
import bcrypt from 'bcrypt';
import mongoose, { Schema } from 'mongoose';
import { defaultJSONOptions } from './';

const clientSchema = new Schema({
  name: { type: String, required: true, unique: true },
  clientId: { type: String, required: true, unique: true },
  clientSecret: { type: String, required: true, unique: true },
  permissions: [{ type: String, enum: ['password', 'code'] }]
}, {
  toJSON: defaultJSONOptions()
});

clientSchema.statics.generateCredentials = () => {
  const secret = randomKey.generate(32);
  return {
    clientId: randomKey.generate(32),
    secret,
    clientSecret: bcrypt.hashSync(secret, 8)
  };
};

clientSchema.methods.verifySecret = function verifyClientSecret(secret) {
  return bcrypt.compareSync(secret, this.clientSecret);
};

const Client = mongoose.model('Client', clientSchema);

export default Client;
