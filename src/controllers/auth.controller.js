// controllers/auth.controller.js
const Usuario = require('../models/usuario.model');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

exports.register = async (req, res, next) => {
    try {
        const nuevoUsuario = await Usuario.create(req.body);
        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            usuario: nuevoUsuario
        });
    } catch (error) {
        next(error);
    }
};

exports.login = async (req, res, next) => {
    const { email, contrasena } = req.body;
    try {
        const user = await Usuario.findByEmail(email);
        if (user && (await Usuario.comparePassword(contrasena, user.contrasena))) {
            res.json({
                message: 'Login exitoso',
                token: generateToken(user.id),
                usuario: {
                    id: user.id,
                    email: user.email,
                    nombre_completo: user.nombre_completo,
                    rol: user.rol
                }
            });
        } else {
            res.status(401).json({ message: 'Credenciales inválidas' });
        }
    } catch (error) {
        next(error);
    }
};

exports.getProfile = async (req, res, next) => {
    // req.user es añadido por el middleware 'protect'
    res.json(req.user);
};
