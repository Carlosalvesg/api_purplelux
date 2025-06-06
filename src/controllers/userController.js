const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/emailService');

// Função auxiliar para gerar código
const generateVerificationCode = () => Math.floor(10000 + Math.random() * 90000).toString();

// Função para validar email
const isValidEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  return emailRegex.test(email);
};

class UserController {
  // Iniciar registro
  async initRegistration(req, res) {
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
          existingUser.tempRegistration = {
            name,
            email: email.toLowerCase(),
            password,
            verificationCode,
            expiresAt
          };
          user = await existingUser.save();
        } else {
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
  }

  // Verificar registro
  async verifyRegistration(req, res) {
    try {
      const { email, code } = req.body;

      const user = await User.findOne({ 'tempRegistration.email': email });
      if (!user) {
        return res.status(400).json({ message: 'Registro não encontrado ou expirado' });
      }

      if (user.tempRegistration.verificationCode !== code) {
        return res.status(400).json({ message: 'Código inválido' });
      }

      if (user.tempRegistration.expiresAt < Date.now()) {
        return res.status(400).json({ message: 'Código expirado' });
      }

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
        return res.status(400).json({ message: 'Erro ao completar registro' });
      }

      res.status(200).json({ message: 'Registro completado com sucesso' });
    } catch (error) {
      console.error('Erro ao verificar registro:', error);
      res.status(500).json({ message: 'Erro no servidor' });
    }
  }

  // Login
  async login(req, res) {
    try {
      const { email, password } = req.body;

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
        { 
          userId: user._id,
          isAdmin: user.isAdmin 
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
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
  }

  // Solicitar reset de senha
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      if (!isValidEmail(email)) {
        return res.status(400).json({
          message: 'Por favor, forneça um email válido'
        });
      }

      const user = await User.findOne({ email, isEmailVerified: true });
      if (!user) {
        // Por segurança, retornamos sucesso mesmo se o email não existir
        return res.status(200).json({ 
          message: 'Se um usuário com este email existir, você receberá as instruções de redefinição de senha' 
        });
      }

      const resetCode = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 30 * 60000); // 30 minutos

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
      console.error('Erro ao solicitar reset de senha:', error);
      res.status(500).json({ message: 'Erro no servidor' });
    }
  }

  // Resetar senha
  async resetPassword(req, res) {
    try {
      const { email, code, newPassword } = req.body;

      if (!isValidEmail(email)) {
        return res.status(400).json({
          message: 'Por favor, forneça um email válido'
        });
      }

      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({
          message: 'A nova senha deve ter pelo menos 6 caracteres'
        });
      }

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
      console.error('Erro ao resetar senha:', error);
      res.status(500).json({ message: 'Erro no servidor' });
    }
  }

  // Métodos Administrativos

  // Listar todos os usuários
  async listAllUsers(req, res) {
    try {
      const users = await User.find()
        .select('-password -passwordReset')
        .sort({ createdAt: -1 });
      
      res.json(users);
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      res.status(500).json({ message: 'Erro ao listar usuários' });
    }
  }

  // Atualizar usuário (admin)
  async updateUser(req, res) {
    try {
      const { name, email, isAdmin, isEmailVerified } = req.body;
      const userId = req.params.id;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }

      // Atualiza apenas os campos permitidos
      if (name) user.name = name;
      if (email) user.email = email;
      if (typeof isAdmin === 'boolean') user.isAdmin = isAdmin;
      if (typeof isEmailVerified === 'boolean') user.isEmailVerified = isEmailVerified;

      await user.save();

      // Retorna o usuário atualizado sem a senha
      const updatedUser = await User.findById(userId).select('-password -passwordReset');
      res.json(updatedUser);
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          message: 'Erro de validação',
          details: Object.values(error.errors).map(err => err.message)
        });
      }
      res.status(500).json({ message: 'Erro ao atualizar usuário' });
    }
  }

  // Deletar usuário (admin)
  async deleteUser(req, res) {
    try {
      const userId = req.params.id;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }

      // Impede que um admin delete a si mesmo
      if (user._id.toString() === req.user.id) {
        return res.status(400).json({ message: 'Não é possível deletar seu próprio usuário' });
      }

      await user.deleteOne();
      res.json({ message: 'Usuário deletado com sucesso' });
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      res.status(500).json({ message: 'Erro ao deletar usuário' });
    }
  }
}

module.exports = new UserController(); 