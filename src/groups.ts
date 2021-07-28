import express from 'express';
import * as dynamoose from 'dynamoose';
import { v4 as uuidv4 } from 'uuid';
import authenticateJWT from './jwt';

const router = express.Router();

const schema = new dynamoose.Schema({
  id: String,
  name: String,
  owner: String,
  reads: {
    type: Array,
    schema: [String],
  },
  members: {
    type: Set,
    schema: [String],
  },
}, {
  timestamps: true,
});

const model = dynamoose.model('Group', schema);

// Get group by id
router.get('/:id', async (req, res) => {
  try {
    const group = await model.get(req.params.id);
    if (group === undefined) {
      throw Error('Group does not exist!');
    }
    res.status(200).json(group);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

// Create group
router.post('/', authenticateJWT, async (req, res) => {
  const { name } = req.body;
  try {
    if (req.user === undefined) {
      throw Error("Must be authenticated.");
    }
    if (name === undefined) {
      throw Error('Please provide a name!');
    }
    const group = await model.create({
      id: uuidv4(), name, owner: req.user.id, members: new Set([req.user.id]), reads: [],
    });
    res.status(200).json(group);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

// Join a group
router.put('/:id', authenticateJWT, async (req, res) => {
  try {
    if (req.user === undefined) {
      throw Error('User must be signed in to join a group.');
    }
    const group = await model.update({ id: req.params.id }, { $ADD: { members: [req.user.id] } }, { condition: new dynamoose.Condition().filter('id').exists() });
    res.status(200).json(group);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

// Get all user's groups
router.get('/', authenticateJWT, async (req, res) => {
  if (req.user === undefined) {
    return res.status(400).send();
  }
  const groups = await model.scan("members").contains(req.user.id).exec();
  res.status(200).json(groups);
});

// Update an existing group
router.put('/:id', async (req, res) => {
  try {
    const group = await model.update({ id: req.params.id }, { ...req.body }, { condition: new dynamoose.Condition().filter('id').exists() });
    res.status(200).json(group);
  } catch (err) {
    res.status(500).json({ err: 'Group does not exist and, therefore, cannot be updated.' });
  }
});

// Delete a group
router.delete('/:id', async (req, res) => {
  try {
    await model.delete(req.params.id);
    res.status(200);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

export default router;
export { model as GroupModel };
