const express = require('express');
const router = express.Router();
const { auth, authAdmin } = require('../middleware/auth');
const eventController = require('../controllers/eventController');

// Rotas de eventos
router.post('/', authAdmin, eventController.createEvent);
router.get('/', eventController.listEvents);
router.get('/:id', eventController.getEventById);
router.put('/:id', authAdmin, eventController.updateEvent);
router.delete('/:id', authAdmin, eventController.deleteEvent);
router.patch('/:id/cancel', auth, eventController.cancelEvent);
router.patch('/:id/complete', auth, eventController.completeEvent);

module.exports = router; 