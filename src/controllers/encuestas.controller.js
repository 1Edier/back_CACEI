// controllers/encuestas.controller.js
const Encuesta = require('../models/encuesta.model');
const EncuestaInvitacion = require('../models/encuestaInvitacion.model'); // Importar el nuevo modelo

// --- Encuestas ---
exports.createEncuesta = async (req, res, next) => {
    try {
        const { nombre, descripcion, fecha_inicio, fecha_fin, preguntas, para_externos } = req.body;
        const encuestaData = { nombre, descripcion, fecha_inicio, fecha_fin, para_externos };

        const nuevaEncuesta = await Encuesta.create(encuestaData);

        if (preguntas && preguntas.length > 0) {
            const preguntaPromises = preguntas.map((pregunta, index) =>
                Encuesta.addPregunta(nuevaEncuesta.id, {
                    id_resultado_aprendizaje: pregunta.id_resultado_aprendizaje,
                    criterio_path: pregunta.criterio_path,
                    indicador_path: pregunta.indicador_path,
                    texto: pregunta.texto,
                    orden: index + 1,
                    obligatorio: pregunta.obligatorio !== undefined ? pregunta.obligatorio : true,
                })
            );
            await Promise.all(preguntaPromises);
        }

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

// --- Respuestas ---
exports.submitRespuesta = async (req, res, next) => {
    try {
        const { id_encuesta_pregunta, nombre_nivel_seleccionado, comentario } = req.body;
        const usuario_id = req.user.id; // Obtenido del token

        const respuesta = await Encuesta.addRespuesta({
            id_encuesta_pregunta,
            usuario_id,
            nombre_nivel_seleccionado,
            comentario
        });
        res.status(201).json({ message: 'Respuesta guardada exitosamente', respuesta });
    } catch (error) {
        next(error);
    }
};

// Nueva función para enviar respuestas de encuestas externas
exports.submitRespuestaExterna = async (req, res, next) => {
    try {
        const { id_encuesta_pregunta, nombre_nivel_seleccionado, comentario, id_invitacion, nombre_encuestado, lugar, tipo_empresa, giro, egresados_universidad } = req.body;

        if (!id_invitacion) {
            return res.status(400).json({ message: 'Se requiere un ID de invitación para respuestas externas.' });
        }

        const invitacionExistente = await EncuestaInvitacion.findById(id_invitacion); // Ahora usamos findById
        if (!invitacionExistente) {
            return res.status(404).json({ message: 'Invitación no encontrada.' });
        }

        // Si es la primera respuesta de esta invitación, actualizamos los datos externos
        if (!invitacionExistente.fecha_uso) { // Asumiendo que 'fecha_uso' es NULL si no ha sido usada
            await EncuestaInvitacion.updateExternalData(invitacionExistente.id, {
                lugar,
                tipo_empresa,
                giro,
                egresados_universidad,
                usada_por: nombre_encuestado // El nombre del encuestado que acaba de llenar el formulario
            });
        }
        
        const respuesta = await Encuesta.addRespuesta({
            id_encuesta_pregunta,
            id_invitacion: invitacionExistente.id, // Usar el ID de la invitación encontrada
            nombre_nivel_seleccionado,
            comentario
        });

        res.status(201).json({ message: 'Respuesta externa guardada exitosamente', respuesta });
    } catch (error) {
        next(error);
    }
};

// Nueva función para crear una invitación de encuesta externa
exports.createEncuestaInvitacion = async (req, res, next) => {
    try {
        const { id } = req.params; // id de la encuesta
        // Los datos externos (lugar, tipo_empresa, giro, egresados_universidad) ya NO se reciben aquí.

        const encuesta = await Encuesta.findById(id);
        if (!encuesta) {
            return res.status(404).json({ message: 'Encuesta no encontrada.' });
        }
        if (!encuesta.para_externos) {
            return res.status(400).json({ message: 'Esta encuesta no está configurada para invitaciones externas.' });
        }

        const invitacion = await EncuestaInvitacion.create({ // Solo se pasa id_encuesta
            id_encuesta: id,
        });

        res.status(201).json({ message: 'Invitación creada exitosamente', invitacion });
    } catch (error) {
        next(error);
    }
};

// Nueva función para validar un PIN de invitación
exports.validateEncuestaInvitacionByPin = async (req, res, next) => {
    try {
        const { pin } = req.params;
        const invitacion = await EncuestaInvitacion.findByPin(pin);

        if (!invitacion) {
            return res.status(404).json({ message: 'PIN de invitación no válido o no encontrado.' });
        }
        
        // Obtener la encuesta completa para el PIN (incluyendo preguntas y niveles)
        const encuestaCompleta = await Encuesta.getFullEncuestaById(invitacion.id_encuesta);
        if (!encuestaCompleta) {
            return res.status(404).json({ message: 'Encuesta asociada a la invitación no encontrada.' });
        }

        res.json({ invitacion, encuesta: encuestaCompleta });
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

// --- Niveles de Desempeño (rutas y funciones eliminadas) ---
// Ya no se necesitan rutas o controladores para niveles_desempeno
