import express from 'express';
import * as dynamoose from 'dynamoose';
import { v4 as uuidv4 } from 'uuid';
import authenticateJWT from './jwt';
import { GroupModel } from './groups';

const router = express.Router();

const schema = new dynamoose.Schema({
  id: String,
  group: {
    type: String,
    index: {
      name: "group-index",
      global: true
    }
  },
  name: String,
}, {
  timestamps: true,
});

const model = dynamoose.model('Read', schema);

// Create read
router.post('/', authenticateJWT, async (req, res) => {
  const { name, group } = req.body;
  const groupDocument = await GroupModel.get(group);
  try {
    if (name === undefined) {
      throw Error('Please provide a name!');
    }
    if (groupDocument.owner !== req.user!.id) {
      return res.status(400).send();
    }
    const read = await model.create({
      id: uuidv4(), name, group,
    });
    return res.status(200).json(read);
  } catch (err) {
    return res.status(500).json({ err: err.message });
  }
});

// Get reads by group
router.get('/group/:id', async (req, res) => {
  const { id: groupId } = req.params;
  const reads = await model.query("group").eq(groupId).exec();
  return res.status(200).json(reads);
});

// Get reads by id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const read = await model.get(id);
  return res.status(200).json(read);
});

// Delete a read
router.delete('/:id', authenticateJWT, async (req, res) => {
  try {
    const read = await model.get(req.params.id);
    const group = await GroupModel.get(read.group);
    if (req.user!.id === group.owner) {
      await model.delete(req.params.id);
      return res.status(200).send();
    }
    return res.status(400).send();
  } catch (err) {
    return res.status(500).json({ err: err.message });
  }
});

export default router;
