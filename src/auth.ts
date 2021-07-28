import express from 'express';
import * as dynamoose from 'dynamoose';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
});

router.post('/signup', async (req, res) => {

});

export default router;
