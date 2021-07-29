import express from 'express';
import * as dynamoose from 'dynamoose';
import { v4 as uuidv4 } from 'uuid';
import authenticateJWT from './jwt';
import { ProgressModel } from './progress';

const router = express.Router();

const schema = new dynamoose.Schema({
  id: String,
  owner: String,
  read: String,
  progress: Number,
  content: String,
}, {
  timestamps: true,
});

const model = dynamoose.model('Message', schema);

// Create message
router.post('/', authenticateJWT, async (req, res) => {
  const {
    content, progress, read
  } = req.body;
  try {
    if (content === undefined || progress === undefined || read === undefined) {
      return res.status(400).json({ err: 'Missing content, progress, or read.' });
    }
    const message = await model.create({
      id: uuidv4(), owner: req.user!.id, read, content, progress,
    });
    return res.status(200).json(message);
  } catch (err) {
    return res.status(500).json({ err: err.message });
  }
});

// Get messages by read
router.get('/:id', authenticateJWT, async (req, res) => {
  const { id: readId } = req.params;
  const progress = await ProgressModel.get(`${req.user!.id}-${readId}`);
  const messages = await model.scan("read").eq(readId).and().where("progress").le(progress === undefined ? 0 : progress.progress).exec();
  return res.status(200).json(messages);
});

// Delete a message
router.delete('/:id', authenticateJWT, async (req, res) => {
  try {
    const message = await model.get(req.params.id);
    if (req.user!.id === message.owner) {
      await model.delete(req.params.id);
      return res.status(200).send();
    }
    return res.status(400).send();
  } catch (err) {
    return res.status(500).json({ err: err.message });
  }
});

export default router;
