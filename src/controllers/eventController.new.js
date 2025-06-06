const Event = require('../models/Event');

class EventController {
  // Criar evento
  async createEvent(req, res) {
    try {
      const eventData = {
        ...req.body,
        createdBy: req.user.id
      };

      const event = new Event(eventData);
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
  }

  // Listar eventos
  async listEvents(req, res) {
    try {
      const { status, date } = req.query;
      const query = {};

      if (status) {
        query.status = status;
      }

      if (date) {
        query.date = date;
      }

      const events = await Event.find(query)
        .sort({ date: 1, time: 1 })
        .populate('createdBy', 'name email');

      res.json(events);
    } catch (error) {
      console.error('Erro ao listar eventos:', error);
      res.status(500).json({ message: 'Erro ao listar eventos' });
    }
  }

  // Obter evento por ID
  async getEventById(req, res) {
    try {
      const event = await Event.findById(req.params.id)
        .populate('createdBy', 'name email');

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
  }

  // Métodos Administrativos

  // Listar todos os eventos (admin)
  async listAllEvents(req, res) {
    try {
      const { status, date, createdBy } = req.query;
      const query = {};

      if (status) {
        query.status = status;
      }

      if (date) {
        query.date = date;
      }

      if (createdBy) {
        query.createdBy = createdBy;
      }

      const events = await Event.find(query)
        .sort({ date: 1, time: 1 })
        .populate('createdBy', 'name email');

      res.json(events);
    } catch (error) {
      console.error('Erro ao listar eventos:', error);
      res.status(500).json({ message: 'Erro ao listar eventos' });
    }
  }

  // Atualizar evento (admin)
  async updateEvent(req, res) {
    try {
      const event = await Event.findById(req.params.id);

      if (!event) {
        return res.status(404).json({ message: 'Evento não encontrado' });
      }

      // Admin pode atualizar qualquer evento
      const updatedEvent = await Event.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate('createdBy', 'name email');

      res.json(updatedEvent);
    } catch (error) {
      console.error('Erro ao atualizar evento:', error);
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          message: 'Erro de validação',
          details: Object.values(error.errors).map(err => err.message)
        });
      }
      res.status(500).json({ message: 'Erro ao atualizar evento' });
    }
  }

  // Deletar evento (admin)
  async deleteEvent(req, res) {
    try {
      const event = await Event.findById(req.params.id);

      if (!event) {
        return res.status(404).json({ message: 'Evento não encontrado' });
      }

      // Admin pode deletar qualquer evento
      await event.deleteOne();
      res.json({ message: 'Evento deletado com sucesso' });
    } catch (error) {
      console.error('Erro ao deletar evento:', error);
      res.status(500).json({ message: 'Erro ao deletar evento' });
    }
  }

  // Cancelar evento
  async cancelEvent(req, res) {
    try {
      const event = await Event.findById(req.params.id);

      if (!event) {
        return res.status(404).json({ message: 'Evento não encontrado' });
      }

      // Verifica se o usuário é o criador do evento
      if (event.createdBy.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Não autorizado a cancelar este evento' });
      }

      await event.cancel();
      res.json({ message: 'Evento cancelado com sucesso', event });
    } catch (error) {
      console.error('Erro ao cancelar evento:', error);
      res.status(500).json({ message: 'Erro ao cancelar evento' });
    }
  }

  // Marcar evento como concluído
  async completeEvent(req, res) {
    try {
      const event = await Event.findById(req.params.id);

      if (!event) {
        return res.status(404).json({ message: 'Evento não encontrado' });
      }

      // Verifica se o usuário é o criador do evento
      if (event.createdBy.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Não autorizado a marcar este evento como concluído' });
      }

      await event.complete();
      res.json({ message: 'Evento marcado como concluído com sucesso', event });
    } catch (error) {
      console.error('Erro ao marcar evento como concluído:', error);
      res.status(500).json({ message: 'Erro ao marcar evento como concluído' });
    }
  }
}

module.exports = new EventController(); 