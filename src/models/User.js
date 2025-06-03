const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: function() {
      return this.isEmailVerified;
    },
    trim: true
  },
  email: {
    type: String,
    required: function() {
      return this.isEmailVerified;
    },
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: function() {
      return this.isEmailVerified;
    },
    minlength: 6
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  tempRegistration: {
    type: {
      name: { 
        type: String, 
        required: true,
        trim: true 
      },
      email: { 
        type: String, 
        required: true,
        lowercase: true, 
        trim: true 
      },
      password: { 
        type: String, 
        required: true,
        minlength: 6 
      },
      verificationCode: {
        type: String,
        required: true
      },
      expiresAt: {
        type: Date,
        required: true
      }
    },
    required: false,
    _id: false
  },
  passwordReset: {
    code: String,
    expiresAt: Date
  }
}, {
  timestamps: true
});

// Middleware para hash de senha
userSchema.pre('save', async function(next) {
  try {
    // Se nenhuma senha foi modificada, pula o middleware
    const isPasswordModified = this.isModified('password');
    const isTempPasswordModified = this.isModified('tempRegistration.password');

    if (!isPasswordModified && !isTempPasswordModified) {
      return next();
    }

    const salt = await bcrypt.genSalt(10);
    
    // Hash da senha principal se modificada
    if (isPasswordModified && this.password) {
      this.password = await bcrypt.hash(this.password, salt);
    }
    
    // Hash da senha temporária se modificada
    if (isTempPasswordModified && this.tempRegistration?.password) {
      this.tempRegistration.password = await bcrypt.hash(this.tempRegistration.password, salt);
    }
    
    next();
  } catch (error) {
    console.error('Erro no middleware de hash:', error);
    next(error);
  }
});

// Método para comparar senha
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    if (!this.password || !candidatePassword) {
      return false;
    }

    return bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    console.error('Erro ao comparar senha:', error);
    return false;
  }
};

module.exports = mongoose.model('User', userSchema); 