import express from 'express';
import * as dynamoose from 'dynamoose';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const schema = new dynamoose.Schema({
  id: String,
  username: String,
  password: String,
}, {
  timestamps: true,
});

const model = dynamoose.model('User', schema);

// Get all users
router.get('/', async (req, res) => {
  const users = await model.scan().exec();
  res.status(200).json(users);
});

// Get user by id
router.get('/:id', async (req, res) => {
  try {
    const user = await model.get(req.params.id);
    if (user === undefined) {
      throw Error('User does not exist!');
    }
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

// Create user
const saltRounds = 10;
router.post('/', async (req, res) => {
  const { username, password } = req.body;
  try {
    if (username === undefined || password === undefined) {
      throw Error('Please provide a username AND password.');
    }
    bcrypt.hash(password, saltRounds, async (err, hash) => {
      const user = await model.create({ id: uuidv4(), username, password: hash });
      res.status(200).json(user);
    });
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

let refreshTokens: string[] = [];
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (username === undefined || password === undefined) {
    return res.status(400).json({ err: 'Username AND password required.' });
  }
  const userResults = await model.scan('username').eq(username).limit(1).exec();
  const user = userResults[0];
  if (user === undefined) {
    return res.status(500).json({ err: 'User does not exist. Please sign up first.' });
  }
  return bcrypt.compare(password, user.password, (err, result) => {
    if (err) {
      return res.status(500).json({ err });
    }
    if (result) {
      const accessToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET as string, { expiresIn: '1h' });
      const refreshToken = jwt.sign({ id: user.id }, process.env.REFRESH_SECRET as string);

      refreshTokens.push(refreshToken);

      return res
        .status(200)
        .json({
          accessToken,
          refreshToken,
        });
    }
    return res.status(400).json({ err: 'Incorrect password!' });
  });
});

router.post('/token', async (req, res) => {
  const { token } = req.body;

  if (token === undefined) {
    return res.status(401).json({ err: 'No refresh token found' });
  }

  if (!refreshTokens.includes(token)) {
    return res.status(403).json({ err: 'Invalid refresh token' });
  }

  return jwt.verify(token, process.env.REFRESH_SECRET as string,
    (err: jwt.VerifyErrors | null, payload: jwt.JwtPayload | undefined) => {
      if (err) {
        return res.status(403).json({ err });
      }

      const user = payload as { id: string };
      return res
        .status(200)
        .json({
          accessToken: jwt.sign({ id: user.id }, process.env.JWT_SECRET as string, { expiresIn: '1h' }),
        });
    });
});

router.post('/logout', (req, res) => {
  const { token } = req.body;
  refreshTokens = refreshTokens.filter((t) => t !== token);
  res.send('Logout successful');
});

// Update an existing user
router.put('/:id', async (req, res) => {
  try {
    const user = await model.update({ id: req.params.id }, { ...req.body }, { condition: new dynamoose.Condition().filter('id').exists() });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ err: 'User does not exist and, therefore, cannot be updated.' });
  }
});

// Delete a user
router.delete('/:id', async (req, res) => {
  try {
    await model.delete(req.params.id);
    res.status(200).send();
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

export default router;
export { model as UserModel };
