import express from 'express';
import dotenv from 'dotenv';
import * as dynamoose from 'dynamoose';
import users from './users';
import groups from './groups';

dotenv.config();

dynamoose.aws.sdk.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_DEFAULT_REGION,
});

const app = express();

app.use(express.json());

app.use('/users', users);
app.use('/groups', groups);

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});
