const jwt = require('jsonwebtoken');
require('dotenv').config();

const auth = (req, res, next) => {
  try {
    // Verificar diferentes formatos de token
    let token = req.header('x-auth-token');
    if (!token) {
      const authHeader = req.header('Authorization');
      if (authHeader) {
        token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
      }
    }

    if (!token) {
      return res.status(401).json({ message: 'Acesso negado. Token não fornecido.' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = {
        id: decoded.userId,
        isAdmin: decoded.isAdmin
      };
      next();
    } catch (jwtError) {
      console.error('Erro ao verificar token:', jwtError);
      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Token inválido.' });
      } else if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expirado.' });
      }
      return res.status(401).json({ message: 'Erro na autenticação.' });
    }
  } catch (error) {
    console.error('Erro de autenticação:', error);
    res.status(401).json({ message: 'Erro na autenticação.' });
  }
};

const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Usuário não autenticado.' });
  }

  if (!req.user.isAdmin) {
    return res.status(403).json({ message: 'Acesso negado. Permissão de administrador necessária.' });
  }
  next();
};

// Middleware combinado para rotas que precisam de autenticação e permissão de admin
const authAdmin = [auth, isAdmin];

module.exports = { auth, isAdmin, authAdmin }; 