const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const eventController = require('../controllers/eventController');

// Rotas de eventos
router.post('/', auth, eventController.createEvent);
router.get('/', eventController.listEvents);
router.get('/:id', eventController.getEventById);
router.put('/:id', auth, eventController.updateEvent);
router.delete('/:id', auth, eventController.deleteEvent);
router.patch('/:id/cancel', auth, eventController.cancelEvent);
router.patch('/:id/complete', auth, eventController.completeEvent);

module.exports = router; 