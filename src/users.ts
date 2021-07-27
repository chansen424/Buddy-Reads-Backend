import express from 'express';
import * as dynamoose from 'dynamoose';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

const schema = new dynamoose.Schema({
    id: String,
    username: String
}, {
    timestamps: true
});

const model = dynamoose.model("User", schema);

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
            throw Error("User does not exist!");
        }
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ err: err.message });
    }
});

// Create user
router.post('/', async (req, res) => {
    const { username } = req.body;
    try {
        if (username === undefined) {
            throw Error("Please provide a username!");
        }
        const user = await model.create({ id: uuidv4(), username });
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ err: err.message });
    }
    
});

// Update an existing user
router.put('/:id', async (req, res) => {
    try {
        const user = await model.update({ id: req.params.id }, { ...req.body }, {"condition": new dynamoose.Condition().exists()});
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ err: "User does not exist and, therefore, cannot be updated." })
    }
});

export default router;