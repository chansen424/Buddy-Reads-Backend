import express from 'express';
import * as dynamoose from 'dynamoose';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

const schema = new dynamoose.Schema({
    id: String,
    name: String,
    members: {
        "type": Set,
        "schema": [String]
    }
}, {
    timestamps: true
});

const model = dynamoose.model("Group", schema);

// Get group by id
router.get('/:id', async (req, res) => {
    try {
        const group = await model.get(req.params.id);
        if (group === undefined) {
            throw Error("Group does not exist!");
        }
        res.status(200).json(group);
    } catch (err) {
        res.status(500).json({ err: err.message });
    }
});

// Create group
router.post('/', async (req, res) => {
    const { uid, name } = req.body;
    try {
        if (name === undefined) {
            throw Error("Please provide a name!");
        }
        const group = await model.create({ id: uuidv4(), name, members: new Set(uid) });
        res.status(200).json(group);
    } catch (err) {
        res.status(500).json({ err: err.message });
    }
    
});

// Join a group
router.put('/:id', async (req, res) => {
    try {
        if (req.body.uid === undefined) {
            throw Error("No uid present in req.body, so user cannot be added to group.")
        }
        const group = await model.update({ id: req.params.id }, { "$ADD": {"members": [req.body.uid]} }, {"condition": new dynamoose.Condition().filter("id").exists()});
        res.status(200).json(group);
    } catch (err) {
        res.status(500).json({ err: err.message })
    }
});

// Update an existing group
router.put('/:id', async (req, res) => {
    try {
        const group = await model.update({ id: req.params.id }, { ...req.body }, {"condition": new dynamoose.Condition().filter("id").exists()});
        res.status(200).json(group);
    } catch (err) {
        res.status(500).json({ err: "Group does not exist and, therefore, cannot be updated." })
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