// middleware/auth.middleware.js
const jwt = require('jsonwebtoken');
const Usuario = require('../models/usuario.model');

exports.protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            req.user = await Usuario.findById(decoded.id);
            
            if(!req.user) {
                return res.status(401).json({ message: 'Usuario no encontrado.' });
            }
            
            next();
        } catch (error) {
            console.error(error);
            return res.status(401).json({ message: 'No autorizado, token fallido.' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'No autorizado, no hay token.' });
    }
};

exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.rol)) {
            return res.status(403).json({ message: `El rol '${req.user.rol}' no está autorizado para acceder a este recurso.` });
        }
        next();
    };
};