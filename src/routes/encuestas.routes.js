// routes/encuestas.routes.js
const express = require('express');
const router = express.Router();
const {
    createEncuesta,
    getAllEncuestas,
    getEncuestaCompleta,
    submitRespuesta,
    submitRespuestaExterna, // Nueva función para respuestas externas
    getEncuestaResultados,
    createEncuestaInvitacion, // Nueva función para crear invitaciones
    validateEncuestaInvitacionByPin // Nueva función para validar invitaciones
} = require('../controllers/encuestas.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Crear y listar encuestas (admin, coordinador)
router.route('/')
    .post(protect, authorize('administrador', 'coordinador'), createEncuesta)
    .get(protect, getAllEncuestas); // Todos los usuarios logueados pueden ver la lista

// Enviar una respuesta (cualquier usuario logueado)
router.post('/respuestas', protect, submitRespuesta);

// Enviar una respuesta de una encuesta externa (sin autenticación)
router.post('/respuestas/externas', submitRespuestaExterna);

// Crear una invitación para encuesta externa (admin, coordinador)
router.post('/:id/invitaciones', protect, authorize('administrador', 'coordinador'), createEncuestaInvitacion);

// Validar un PIN de invitación para encuesta externa (sin autenticación)
router.get('/invitaciones/:pin', validateEncuestaInvitacionByPin);

// Ver los resultados de una encuesta (admin, coordinador, auditor)
router.get('/:id/resultados', protect, authorize('administrador', 'coordinador', 'auditor'), getEncuestaResultados);

// Ver una encuesta completa para responderla (todos los usuarios logueados)
// Esta ruta debe ir al final para no colisionar con /niveles-desempeno y /:id/resultados
router.get('/:id', protect, getEncuestaCompleta);

module.exports = router;
