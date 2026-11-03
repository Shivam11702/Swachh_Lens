process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/swachhlens_test';
process.env.JWT_SECRET = 'test-secret';
process.env.STORAGE_PROVIDER = 'local';
process.env.ML_PROVIDER = 'stub';
process.env.WEBHOOKS_ENABLED = 'false';
process.env.EMAIL_ENABLED = 'false';
process.env.PUSH_ENABLED = 'false';
process.env.SMS_ENABLED = 'false';

jest.setTimeout(15000);