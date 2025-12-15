// routes/usuarios.routes.js
const express = require('express');
const router = express.Router();
const { createUsuario, getAllUsuarios, getUsuarioById, updateUsuario, deleteUsuario } = require('../controllers/usuarios.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Todas las rutas de usuarios requieren autenticación y rol de administrador
router.use(protect, authorize('administrador'));

router.route('/')
    .get(getAllUsuarios)
    .post(createUsuario);

router.route('/:id')
    .get(getUsuarioById)
    .put(updateUsuario)
    .delete(deleteUsuario);

module.exports = router;