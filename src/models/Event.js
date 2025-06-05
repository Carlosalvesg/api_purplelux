const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  date: {
    type: String,
    required: [true, 'A data do evento é obrigatória'],
    validate: {
      validator: function(v) {
        // Validação básica de formato de data (YYYY-MM-DD)
        return /^\d{4}-\d{2}-\d{2}$/.test(v);
      },
      message: props => `${props.value} não é uma data válida no formato YYYY-MM-DD`
    }
  },
  artist: {
    type: String,
    required: [true, 'O nome do artista é obrigatório'],
    trim: true,
    minlength: [2, 'O nome do artista deve ter pelo menos 2 caracteres']
  },
  time: {
    type: String,
    required: [true, 'O horário do evento é obrigatório'],
    validate: {
      validator: function(v) {
        // Validação básica de formato de horário (HH:mm)
        return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: props => `${props.value} não é um horário válido no formato HH:mm`
    }
  },
  image: {
    type: String,
    required: [true, 'A imagem do evento é obrigatória'],
    validate: {
      validator: function(v) {
        // Validação básica de URL
        return /^https?:\/\/.+/.test(v);
      },
      message: props => `${props.value} não é uma URL válida`
    }
  },
  description: {
    type: String,
    required: [true, 'A descrição do evento é obrigatória'],
    trim: true,
    minlength: [10, 'A descrição deve ter pelo menos 10 caracteres']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'cancelled', 'completed'],
    default: 'scheduled'
  }
}, {
  timestamps: true
});

// Índices para melhorar a performance das consultas
eventSchema.index({ date: 1 });
eventSchema.index({ artist: 1 });
eventSchema.index({ status: 1 });

// Método para verificar se o evento está no passado
eventSchema.methods.isPast = function() {
  const eventDate = new Date(this.date);
  return eventDate < new Date();
};

// Método para verificar se o evento está no futuro
eventSchema.methods.isFuture = function() {
  const eventDate = new Date(this.date);
  return eventDate > new Date();
};

// Método para cancelar o evento
eventSchema.methods.cancel = async function() {
  this.status = 'cancelled';
  return this.save();
};

// Método para marcar o evento como concluído
eventSchema.methods.complete = async function() {
  this.status = 'completed';
  return this.save();
};

// Middleware para validação antes de salvar
eventSchema.pre('save', function(next) {
  // Converte a data para o formato correto se necessário
  if (this.isModified('date')) {
    const date = new Date(this.date);
    if (isNaN(date.getTime())) {
      next(new Error('Data inválida'));
    }
  }
  next();
});

module.exports = mongoose.model('Event', eventSchema); 