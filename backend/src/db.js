const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env'), override: true });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/swachhlens';
const uriHost = MONGODB_URI.replace(/^(mongodb(?:\+srv)?:\/\/)([^:@]+:)?([^@]+@)?/, '$1*****@');
console.log('Connecting to MongoDB URI', uriHost);

async function connect() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  // Mongoose 6+ no longer needs useNewUrlParser/useUnifiedTopology options
  await mongoose.connect(MONGODB_URI);
  console.log('MongoDB connected to', mongoose.connection.name);
  return mongoose.connection;
}

module.exports = { connect, mongoose };
