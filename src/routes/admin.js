const express = require('express');
const router = express.Router();
const { authAdmin } = require('../middleware/auth');
const userController = require('../controllers/userController');
const eventController = require('../controllers/eventController');

// Rotas administrativas de usuários
router.get('/users', authAdmin, userController.listAllUsers);
router.put('/users/:id', authAdmin, userController.updateUser);
router.delete('/users/:id', authAdmin, userController.deleteUser);

// Rotas administrativas de eventos
router.get('/events', authAdmin, eventController.listAllEvents);
router.put('/events/:id', authAdmin, eventController.updateEvent);
router.delete('/events/:id', authAdmin, eventController.deleteEvent);

module.exports = router; 