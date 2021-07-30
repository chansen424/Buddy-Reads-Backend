import express from 'express';
import * as dynamoose from 'dynamoose';
import { v4 as uuidv4 } from 'uuid';
import authenticateJWT from './jwt';

const router = express.Router();

const schema = new dynamoose.Schema({
    id: String,
    owner: String,
    read: String,
    progress: Number
});
  
const model = dynamoose.model('Progress', schema);

router.get('/:id', authenticateJWT, async (req, res) => {
  const {id} = req.params;
  const progress = await model.get(`${req.user!.id}-${id}`);
  if (progress === undefined) {
    return res.status(500).send();
  }
  res.status(200).json(progress);
});

// Update progress
router.post('/', authenticateJWT, async (req, res) => {
    const { progress: newProgress, read } = req.body;
    try {
      if (newProgress === undefined) {
        throw Error("progress undefined");
      }
      let progress = await model.update({ id: `${req.user!.id}-${read}` }, { progress: newProgress, read });
      if (progress === undefined) {
        progress = await model.create({id: `${req.user!.id}-${read}`, progress: newProgress, read});
      }
      res.status(200).json(progress);
    } catch (err) {
      res.status(500).json({ err: 'Progress does not exist and, therefore, cannot be updated.' });
    }
  });

export default router;
export {model as ProgressModel}