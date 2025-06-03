const express = require('express');
const router = express.Router();
const { auth, authAdmin } = require('../middleware/auth');
const Event = require('../models/Event');

// Obter todos os eventos (público)
router.get('/', async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 });
    res.json(events);
  } catch (error) {
    console.error('Erro ao buscar eventos:', error);
    res.status(500).json({ message: 'Erro ao buscar eventos' });
  }
});

// Obter um evento específico
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Evento não encontrado' });
    }
    res.json(event);
  } catch (error) {
    console.error('Erro ao buscar evento:', error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'ID de evento inválido' });
    }
    res.status(500).json({ message: 'Erro ao buscar evento' });
  }
});

// Criar evento (admin)
router.post('/', authAdmin, async (req, res) => {
  try {
    const { date, artist, time, image, description } = req.body;

    // Validação básica
    if (!date || !artist || !time) {
      return res.status(400).json({ 
        message: 'Por favor, preencha todos os campos obrigatórios',
        details: {
          date: !date ? 'Data é obrigatória' : null,
          artist: !artist ? 'Artista é obrigatório' : null,
          time: !time ? 'Horário é obrigatório' : null
        }
      });
    }

    const event = new Event({
      date,
      artist,
      time,
      image,
      description,
      createdBy: req.user.id
    });

    await event.save();
    res.status(201).json(event);
  } catch (error) {
    console.error('Erro ao criar evento:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Erro de validação',
        details: Object.values(error.errors).map(err => err.message)
      });
    }
    res.status(500).json({ message: 'Erro ao criar evento' });
  }
});

// Atualizar evento (admin)
router.put('/:id', authAdmin, async (req, res) => {
  try {
    const { date, artist, time, image, description } = req.body;

    // Validação básica
    if (!date || !artist || !time) {
      return res.status(400).json({ 
        message: 'Por favor, preencha todos os campos obrigatórios',
        details: {
          date: !date ? 'Data é obrigatória' : null,
          artist: !artist ? 'Artista é obrigatório' : null,
          time: !time ? 'Horário é obrigatório' : null
        }
      });
    }

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      {
        date,
        artist,
        time,
        image,
        description
      },
      { new: true, runValidators: true }
    );

    if (!event) {
      return res.status(404).json({ message: 'Evento não encontrado' });
    }

    res.json(event);
  } catch (error) {
    console.error('Erro ao atualizar evento:', error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'ID de evento inválido' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Erro de validação',
        details: Object.values(error.errors).map(err => err.message)
      });
    }
    res.status(500).json({ message: 'Erro ao atualizar evento' });
  }
});

// Deletar evento (admin)
router.delete('/:id', authAdmin, async (req, res) => {
  try {
    const result = await Event.findByIdAndDelete(req.params.id);
    
    if (!result) {
      return res.status(404).json({ message: 'Evento não encontrado' });
    }

    res.json({ message: 'Evento removido com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar evento:', error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'ID de evento inválido' });
    }
    res.status(500).json({ message: 'Erro ao deletar evento' });
  }
});

module.exports = router; 