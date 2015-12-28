import is from 'is_js';
import mongoose, { Schema } from 'mongoose';

const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true,
    validate: {
      validator: (value) => {return is.email(value);},
      message: '{VALUE} is not a valid email address.'
    }
  }
}, {
  toJSON: {
    getters: true,
    virtuals: true,
    transform: (doc, ret) => {
      delete ret._id;
      delete ret.__v;
      delete ret.password;
    }
  }
});

const User = mongoose.model('User', userSchema);

export default User;
