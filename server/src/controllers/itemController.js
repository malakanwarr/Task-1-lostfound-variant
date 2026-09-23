import Joi from 'joi';
import { Item } from '../models/Item.js';

// TODO: write a validation schema for create/update per README.md section 2.

const createSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().optional(),
  category: Joi.string().valid('electronics', 'clothing', 'documents', 'accessories', 'other').optional(),
  status: Joi.string().valid('lost', 'found', 'claimed').optional(),
  location: Joi.string().optional(),
  reportedBy: Joi.string().hex().length(24).optional() // Validates a 24-character MongoDB ID
});

// Blueprint for updating an existing item (everything is optional)
const updateSchema = Joi.object({
  title: Joi.string(),
  description: Joi.string(),
  category: Joi.string().valid('electronics', 'clothing', 'documents', 'accessories', 'other'),
  status: Joi.string().valid('lost', 'found', 'claimed'),
  location: Joi.string(),
  reportedBy: Joi.string().hex().length(24)
});

// GET /api/items
// TODO: implement per README.md section 3.
export async function getAllItems(req, res, next) {
  try {
    // Stretch Goal 1: Filtering. We extract status and category from the URL query.
    const { status, category } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;

    // Stretch Goal 2: Populate. It fetches the actual User data instead of just the ID.
    const items = await Item.find(filter)
      .populate('reportedBy', 'name email')
      .sort({ createdAt: -1 }); // Sorts by newest first
      
    res.json({ items });
  } catch (err) { 
    next(err); 
  }
}

// GET /api/items/:id
// TODO: implement per README.md section 3.
export async function getItem(req, res, next) {
  try {
    const item = await Item.findById(req.params.id).populate('reportedBy', 'name email');
    if (!item) return res.status(404).json({ message: 'Item not found' });
    
    res.json({ item });
  } catch (err) { 
    next(err); 
  }
}

// POST /api/items
// TODO: implement per README.md section 3.
export async function createItem(req, res, next) {
  try {
    // The security guard: checking req.body against the rules
    const { value, error } = createSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    // The database transaction
    const item = await Item.create(value);
    res.status(201).json({ item });
  } catch (err) {
    // If the database rejects it (e.g., the unique title/location compound index is violated)
    if (err.code === 11000) {
      return res.status(409).json({ message: 'An item with this title and location already exists.' });
    }
    next(err);
  }
}

// PATCH /api/items/:id
// TODO: implement per README.md section 3.
export async function updateItem(req, res, next) {
  try {
    const { value, error } = updateSchema.validate(req.body, { stripUnknown: true });
    if (error) return res.status(400).json({ message: error.message });

    // { new: true } tells Mongoose to return the updated document, not the old one
    const item = await Item.findByIdAndUpdate(req.params.id, { $set: value }, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ message: 'Item not found' });
    
    res.json({ item });
  } catch (err) { 
    next(err); 
  }
}
// DELETE /api/items/:id
// TODO: implement per README.md section 3.
export async function deleteItem(req, res, next) {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    
    res.json({ ok: true });
  } catch (err) { 
    next(err); 
  }
}