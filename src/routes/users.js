const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/emailService');

// Função auxiliar para gerar código
const generateVerificationCode = () => Math.floor(10000 + Math.random() * 90000).toString();

// Função para validar email
const isValidEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  return emailRegex.test(email);
};

// Iniciar registro
router.post('/register/init', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validação básica
    if (!name || !email || !password) {
      return res.status(400).json({ 
        message: 'Por favor, preencha todos os campos',
        details: {
          name: !name ? 'Nome é obrigatório' : null,
          email: !email ? 'Email é obrigatório' : null,
          password: !password ? 'Senha é obrigatória' : null
        }
      });
    }

    // Validação de senha
    if (password.length < 6) {
      return res.status(400).json({
        message: 'A senha deve ter pelo menos 6 caracteres'
      });
    }

    // Validação de email
    if (!isValidEmail(email)) {
      return res.status(400).json({
        message: 'Por favor, forneça um email válido'
      });
    }

    // Verificar se o email já está em uso
    const existingUser = await User.findOne({ 
      $or: [
        { email: email.toLowerCase() },
        { 'tempRegistration.email': email.toLowerCase() }
      ]
    });

    if (existingUser) {
      if (existingUser.isEmailVerified) {
        return res.status(400).json({ message: 'Este email já está registrado' });
      } else if (existingUser.tempRegistration) {
        // Se existe um registro temporário, verifica se expirou
        if (existingUser.tempRegistration.expiresAt > Date.now()) {
          return res.status(400).json({ 
            message: 'Este email já está em processo de registro. Por favor, verifique seu email para o código de verificação ou aguarde o código expirar.'
          });
        }
      }
    }

    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 30 * 60000); // 30 minutos

    try {
      let user;
      if (existingUser) {
        // Se já existe um registro temporário, atualiza
        existingUser.tempRegistration = {
          name,
          email: email.toLowerCase(),
          password,
          verificationCode,
          expiresAt
        };
        user = await existingUser.save();
      } else {
        // Cria novo usuário com registro temporário
        user = new User({
          isEmailVerified: false,
          tempRegistration: {
            name,
            email: email.toLowerCase(),
            password,
            verificationCode,
            expiresAt
          }
        });
        await user.save();
      }

      await sendVerificationEmail(email, verificationCode);
      res.status(200).json({ message: 'Código de verificação enviado para seu email' });
    } catch (saveError) {
      if (saveError.code === 11000) {
        return res.status(400).json({ 
          message: 'Este email já está registrado',
          error: 'DuplicateEmail'
        });
      }
      throw saveError;
    }
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ 
      message: 'Erro no servidor ao processar o registro',
      error: process.env.NODE_ENV === 'development' ? error.message : 'InternalServerError'
    });
  }
});

// Completar registro
router.post('/register/verify', async (req, res) => {
  try {
    const { email, code } = req.body;
    console.log('Tentativa de verificação:', { email, code });

    const user = await User.findOne({ 'tempRegistration.email': email });
    if (!user) {
      console.log('Usuário não encontrado para o email:', email);
      return res.status(400).json({ message: 'Registro não encontrado ou expirado' });
    }

    console.log('Dados do registro temporário:', {
      savedCode: user.tempRegistration.verificationCode,
      receivedCode: code,
      expiresAt: user.tempRegistration.expiresAt,
      now: new Date()
    });

    if (user.tempRegistration.verificationCode !== code) {
      console.log('Código inválido recebido');
      return res.status(400).json({ message: 'Código inválido' });
    }

    if (user.tempRegistration.expiresAt < Date.now()) {
      console.log('Código expirado');
      return res.status(400).json({ message: 'Código expirado' });
    }

    // Atualiza o usuário com os dados verificados
    const tempData = { ...user.tempRegistration.toObject() };
    
    const updatedUser = await User.findOneAndUpdate(
      { 'tempRegistration.email': email },
      {
        $set: {
          name: tempData.name,
          email: tempData.email,
          password: tempData.password,
          isEmailVerified: true
        },
        $unset: { tempRegistration: "" }
      },
      { new: true, runValidators: false }
    );

    if (!updatedUser) {
      console.log('Erro ao atualizar usuário');
      return res.status(400).json({ message: 'Erro ao completar registro' });
    }

    console.log('Registro completado com sucesso para:', email);
    res.status(200).json({ message: 'Registro completado com sucesso' });
  } catch (error) {
    console.error('Erro ao verificar registro:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validação de email
    if (!isValidEmail(email)) {
      return res.status(400).json({
        message: 'Por favor, forneça um email válido'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Credenciais inválidas' });
    }

    if (!user.isEmailVerified) {
      return res.status(400).json({ message: 'Email não verificado' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Credenciais inválidas' });
    }

    const token = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Solicitar redefinição de senha
router.post('/password/forgot', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email, isEmailVerified: true });
    if (!user) {
      // Resposta genérica por segurança
      return res.status(200).json({ 
        message: 'Se um usuário com este email existir, você receberá as instruções de redefinição de senha' 
      });
    }

    const resetCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 30 * 60000); // 30 minutos

    // Remove tempRegistration se existir
    if (user.tempRegistration) {
      user.tempRegistration = null;
    }

    user.passwordReset = {
      code: resetCode,
      expiresAt
    };

    await user.save();
    await sendPasswordResetEmail(email, resetCode);
    
    res.status(200).json({ 
      message: 'Se um usuário com este email existir, você receberá as instruções de redefinição de senha' 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Redefinir senha
router.post('/password/reset', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    const user = await User.findOne({ 
      email, 
      isEmailVerified: true,
      'passwordReset.code': code,
      'passwordReset.expiresAt': { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Código inválido ou expirado' });
    }

    // Atualiza a senha e limpa o código de reset
    user.password = newPassword;
    user.passwordReset = undefined;
    await user.save();

    res.json({ message: 'Senha redefinida com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Obter usuário atual
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

module.exports = router; 