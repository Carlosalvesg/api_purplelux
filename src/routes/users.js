const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const userController = require('../controllers/userController');

// Rotas de registro
router.post('/register/init', userController.initRegistration);
router.post('/register/verify', userController.verifyRegistration);

// Rota de login
router.post('/login', userController.login);

// Rotas de reset de senha
router.post('/password/forgot', userController.forgotPassword);
router.post('/password/reset', userController.resetPassword);

module.exports = router; 