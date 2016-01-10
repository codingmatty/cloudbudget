import is from 'is_js';
import bcrypt from 'bcrypt';
import randomKey from 'random-key';
import mongoose, { Schema } from 'mongoose';
import { defaultJSONOptions } from './';

const clientSchema = new Schema({
  name: { type: String, required: true, unique: true },
  clientId: { type: String, required: true, unique: true },
  clientSecret: { type: String, required: true, unique: true },
  permissions: [{ type: String, enum: ['password', 'code'] }],
  redirectUrl: { type: String,
    validate: {
      validator: (value) => {return is.url(value);},
      message: '{VALUE} is not a valid url address.'
    }
  }
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
