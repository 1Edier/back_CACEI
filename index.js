// index.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const errorHandler = require('./src/middleware/errorHandler.middleware');

// Cargar variables de entorno
dotenv.config({ path: './.env' });

// Importar rutas
const authRoutes = require('./src/routes/auth.routes');
const usuariosRoutes = require('./src/routes/usuarios.routes');
const resultadosRoutes = require('./src/routes/resultadosAprendizaje.routes');
const encuestasRoutes = require('./src/routes/encuestas.routes');

const app = express();

// Middlewares
app.use(cors()); // Habilita CORS para todas las rutas
app.use(express.json()); // Para parsear application/json
app.use(express.urlencoded({ extended: true })); // Para parsear application/x-www-form-urlencoded

// Rutas de la API
app.get('/', (req, res) => {
    res.send('API de Rúbricas y Encuestas funcionando!');
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/usuarios', usuariosRoutes);
app.use('/api/v1/resultados-aprendizaje', resultadosRoutes);
app.use('/api/v1/encuestas', encuestasRoutes);


// Middleware de manejo de errores (debe ser el último)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});
