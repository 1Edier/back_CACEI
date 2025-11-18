// src/routes/resultadosAprendizaje.routes.js
const express = require('express');
const router = express.Router();
const { 
    createResultado, 
    getAllResultados, 
    getResultadoById, 
    updateResultado, 
    deleteResultado,
    getResultadoHistory
} = require('../controllers/resultadosAprendizaje.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// --- RUTAS PÚBLICAS Y DE LECTURA ---

// Ruta general para obtener todos los resultados.
router.get('/', getAllResultados);

// --- RUTAS PROTEGIDAS Y ESPECÍFICAS ---
// ¡ORDEN CRÍTICO! La ruta más específica DEBE ir ANTES de la ruta genérica con el mismo parámetro.
// Esta ruta busca la palabra literal "historial".
router.get('/:id/historial', protect, authorize('administrador', 'auditor'), getResultadoHistory);

// Esta ruta genérica captura cualquier cosa después de la barra como un "id".
// Si estuviera antes, capturaría "/:id/historial" pensando que el id es "historial".
router.get('/:id', getResultadoById);


// --- RUTAS DE ESCRITURA (PROTEGIDAS) ---

// Crear un nuevo resultado (requiere ser admin o coordinador)
router.post('/', protect, authorize('administrador', 'coordinador'), createResultado);

// Actualizar un resultado existente (requiere ser admin o coordinador)
router.put('/:id', protect, authorize('administrador', 'coordinador'), updateResultado);

// Eliminar un resultado (requiere ser admin)
router.delete('/:id', protect, authorize('administrador'), deleteResultado);

module.exports = router;