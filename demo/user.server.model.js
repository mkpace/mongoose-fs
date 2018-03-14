
const mongooseFs = require('./../lib/mongoose-fs');
const Schema = mongooseFs.Schema;

/**
 * Create a new schema - same as Mongoose
 */
const userSchema = new Schema({
  fname: String,
  lname: String,
  email: String,
  age: Number,
  created: { type: Date, default: Date.now }
});

/**
 * Register the model - same as Mongoose
 */
mongooseFs.model('User', userSchema);