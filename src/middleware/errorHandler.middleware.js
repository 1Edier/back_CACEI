// middleware/errorHandler.middleware.js
const errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    // Si es un error de clave duplicada de MySQL
    if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: 'Conflicto: ya existe un registro con esos datos únicos (ej. usuario o email).' });
    }

    // Error genérico
    res.status(500).json({
        message: 'Ocurrió un error en el servidor.',
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
};

module.exports = errorHandler;