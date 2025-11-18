// controllers/resultadosAprendizaje.controller.js
const ResultadoAprendizaje = require('../models/resultadoAprendizaje.model');

exports.createResultado = async (req, res, next) => {
    try {
        const usuarioAuditoria = { id: req.user.id, nombre: req.user.usuario };
        const resultado = await ResultadoAprendizaje.create(req.body, usuarioAuditoria);
        res.status(201).json(resultado);
    } catch (error) {
        next(error);
    }
};

exports.getAllResultados = async (req, res, next) => {
    try {
        const resultados = await ResultadoAprendizaje.getAll();
        res.json(resultados);
    } catch (error) {
        next(error);
    }
};

exports.getResultadoById = async (req, res, next) => {
    try {
        const resultado = await ResultadoAprendizaje.findById(req.params.id);
        if (!resultado) {
            return res.status(404).json({ message: 'Resultado de aprendizaje no encontrado' });
        }
        res.json(resultado);
    } catch (error) {
        next(error);
    }
};

exports.updateResultado = async (req, res, next) => {
    try {
        const usuarioAuditoria = { id: req.user.id, nombre: req.user.usuario };
        const success = await ResultadoAprendizaje.update(req.params.id, req.body, usuarioAuditoria);
        if (!success) {
            return res.status(404).json({ message: 'Resultado de aprendizaje no encontrado' });
        }
        res.json({ message: 'Resultado de aprendizaje actualizado exitosamente' });
    } catch (error) {
        next(error);
    }
};

exports.deleteResultado = async (req, res, next) => {
    try {
        const usuarioAuditoria = { id: req.user.id, nombre: req.user.usuario };
        const success = await ResultadoAprendizaje.delete(req.params.id, usuarioAuditoria);
        if (!success) {
            return res.status(404).json({ message: 'Resultado de aprendizaje no encontrado' });
        }
        res.json({ message: 'Resultado de aprendizaje eliminado exitosamente' });
    } catch (error) {
        next(error);
    }
};

exports.getResultadoHistory = async (req, res, next) => {
    try {
        const history = await ResultadoAprendizaje.getHistoryById(req.params.id);
        if (history.length === 0) {
            return res.status(404).json({ message: 'No se encontró historial para este resultado de aprendizaje.' });
        }
        res.json(history);
    } catch (error) {
        next(error);
    }
};