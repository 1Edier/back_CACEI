// controllers/encuestas.controller.js
const Encuesta = require('../models/encuesta.model');

// --- Encuestas ---
exports.createEncuesta = async (req, res, next) => {
    try {
        // Separar los datos de la encuesta de los items y preguntas
        const { nombre, descripcion, fecha_inicio, fecha_fin, items, preguntas } = req.body;
        const encuestaData = { nombre, descripcion, fecha_inicio, fecha_fin };

        // Crear la encuesta principal
        const nuevaEncuesta = await Encuesta.create(encuestaData);

        // Si hay items, agregarlos a la encuesta
        if (items && items.length > 0) {
            const itemPromises = items.map(item => Encuesta.addItem(nuevaEncuesta.id, item));
            await Promise.all(itemPromises);
        }

        // Si hay preguntas, agregarlas a la encuesta
        if (preguntas && preguntas.length > 0) {
            const preguntaPromises = preguntas.map((pregunta, index) => 
                Encuesta.addPregunta(nuevaEncuesta.id, {
                    ...pregunta,
                    orden: index + 1, // Asignar un orden
                    obligatorio: true // Por defecto, obligatoria
                })
            );
            await Promise.all(preguntaPromises);
        }

        // Devolver la encuesta creada con un mensaje de éxito
        res.status(201).json({ message: 'Encuesta creada exitosamente', encuesta: nuevaEncuesta });
    } catch (error) {
        next(error);
    }
};

exports.getAllEncuestas = async (req, res, next) => {
    try {
        const encuestas = await Encuesta.getAll();
        res.json(encuestas);
    } catch (error) {
        next(error);
    }
};

exports.getEncuestaCompleta = async (req, res, next) => {
    try {
        const encuesta = await Encuesta.getFullEncuestaById(req.params.id);
        if (!encuesta) {
            return res.status(404).json({ message: 'Encuesta no encontrada' });
        }
        res.json(encuesta);
    } catch (error) {
        next(error);
    }
};

// --- Items de Encuesta ---
exports.addItemToEncuesta = async (req, res, next) => {
    try {
        const item = await Encuesta.addItem(req.params.id, req.body);
        res.status(201).json(item);
    } catch (error) {
        next(error);
    }
};

// --- Respuestas ---
exports.submitRespuesta = async (req, res, next) => {
    try {
        const { id_encuesta_item, nivel_seleccionado, comentario } = req.body;
        const usuario_id = req.user.id; // Obtenido del token

        const respuesta = await Encuesta.addRespuesta({
            id_encuesta_item,
            usuario_id,
            nivel_seleccionado,
            comentario
        });
        res.status(201).json({ message: 'Respuesta guardada exitosamente', respuesta });
    } catch (error) {
        next(error);
    }
};

exports.getEncuestaResultados = async (req, res, next) => {
    try {
        const resultados = await Encuesta.getResultados(req.params.id);
        res.json(resultados);
    } catch (error) {
        next(error);
    }
};
