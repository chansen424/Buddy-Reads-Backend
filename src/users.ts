import express from 'express';
import * as dynamoose from 'dynamoose';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';

const router = express.Router();

const schema = new dynamoose.Schema({
  id: String,
  username: String,
  password: String
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

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const userResults = await model.scan("username").eq(username).limit(1).exec();
  const user = userResults[0];
  if (user === undefined) {
    res.status(500).json({ err: "User does not exist. Please sign up first." });
  }
  bcrypt.compare(password, user.password, (err, result) => {
    if (result) {
      res.status(200).json({ id: user.id });
    } else {
      res.status(400).json({ err: "Incorrect password!" });
    }
  });
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
    res.status(200);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

export default router;
export {model as UserModel};
