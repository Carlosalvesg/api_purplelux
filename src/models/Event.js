const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  date: {
    type: String,
    required: true
  },
  artist: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Índices para melhorar a performance das consultas
eventSchema.index({ date: 1 });
eventSchema.index({ artist: 1 });
eventSchema.index({ status: 1 });

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

module.exports = mongoose.model('Event', eventSchema); 