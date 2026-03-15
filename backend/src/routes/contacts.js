const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const contactsController = require('../controllers/contactsController');

router.use(auth);

router.get('/', contactsController.getContacts);
router.post('/', contactsController.createContact);
router.get('/:id', contactsController.getContactById);
router.put('/:id', contactsController.updateContact);
router.delete('/:id', contactsController.deleteContact);

module.exports = router;
