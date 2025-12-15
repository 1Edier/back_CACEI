// controllers/usuarios.controller.js
const Usuario = require('../models/usuario.model');

exports.createUsuario = async (req, res, next) => {
    try {
        const { usuario, contrasena, rol, nombre_completo, email } = req.body;

        // Validar que el email no exista
        const existingUser = await Usuario.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: 'El email ya está registrado' });
        }

        const nuevoUsuario = await Usuario.create({
            usuario,
            contrasena,
            rol: rol || 'administrador', // Por defecto administrador
            nombre_completo,
            email
        });

        res.status(201).json({ message: 'Usuario creado exitosamente', usuario: nuevoUsuario });
    } catch (error) {
        next(error);
    }
};

exports.getAllUsuarios = async (req, res, next) => {
    try {
        const usuarios = await Usuario.getAll();
        res.json(usuarios);
    } catch (error) {
        next(error);
    }
};

exports.getUsuarioById = async (req, res, next) => {
    try {
        const usuario = await Usuario.findById(req.params.id);
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.json(usuario);
    } catch (error) {
        next(error);
    }
};

exports.updateUsuario = async (req, res, next) => {
    try {
        const success = await Usuario.update(req.params.id, req.body);
        if (!success) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.json({ message: 'Usuario actualizado exitosamente' });
    } catch (error) {
        next(error);
    }
};

exports.deleteUsuario = async (req, res, next) => {
    try {
        const success = await Usuario.delete(req.params.id);
         if (!success) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.json({ message: 'Usuario desactivado exitosamente' });
    } catch (error) {
        next(error);
    }
};