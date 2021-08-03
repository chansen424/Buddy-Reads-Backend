import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import * as dynamoose from 'dynamoose';
import users from './users';
import groups from './groups';
import reads from './reads';
import messages from './messages';
import progress from './progress';

dotenv.config();

dynamoose.aws.sdk.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_DEFAULT_REGION,
});

const app = express();

app.use(cors({
  origin: '*'
}));
app.use(express.json());

app.use('/users', users);
app.use('/groups', groups);
app.use('/reads', reads);
app.use('/messages', messages);
app.use('/progress', progress);

const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});
