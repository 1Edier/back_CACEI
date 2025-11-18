// routes/encuestas.routes.js
const express = require('express');
const router = express.Router();
const {
    createEncuesta,
    getAllEncuestas,
    getEncuestaCompleta,
    addItemToEncuesta,
    submitRespuesta,
    getEncuestaResultados
} = require('../controllers/encuestas.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Crear y listar encuestas (admin, coordinador)
router.route('/')
    .post(protect, authorize('administrador', 'coordinador'), createEncuesta)
    .get(protect, getAllEncuestas); // Todos los usuarios logueados pueden ver la lista

// Ver una encuesta completa para responderla (todos los usuarios logueados)
router.get('/:id', protect, getEncuestaCompleta);

// Añadir items a una encuesta (admin, coordinador)
router.post('/:id/items', protect, authorize('administrador', 'coordinador'), addItemToEncuesta);

// Enviar una respuesta (cualquier usuario logueado)
router.post('/respuestas', protect, submitRespuesta);

// Ver los resultados de una encuesta (admin, coordinador, auditor)
router.get('/:id/resultados', protect, authorize('administrador', 'coordinador', 'auditor'), getEncuestaResultados);

module.exports = router;