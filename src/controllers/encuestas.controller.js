// controllers/encuestas.controller.js
const pool = require('../config/db'); // Importar el pool de conexiones
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

// Nueva función para enviar una encuesta externa completa
exports.submitFullEncuestaExterna = async (req, res, next) => {
    const conn = await pool.getConnection(); // Obtener una conexión para la transacción
    try {
        await conn.beginTransaction(); // Iniciar la transacción

        const {
            id_encuesta_base,
            nombre_encuestado,
            lugar,
            tipo_empresa,
            giro,
            egresados_universidad,
            respuestas // Array de respuestas
        } = req.body;

        // 1. Crear una nueva invitación con los datos del encuestado (una sola vez)
        const nuevaInvitacion = await EncuestaInvitacion.create({
            id_encuesta: id_encuesta_base,
            pin: null, // No se genera un nuevo PIN aquí, es una "sesión" de respuesta
            lugar,
            tipo_empresa,
            giro,
            egresados_universidad,
            usada_por: nombre_encuestado,
            fecha_uso: new Date(), // Marcar como usada
        });

        // 2. Guardar todas las respuestas asociadas a esta única invitación
        const respuestaPromises = respuestas.map(resp =>
            Encuesta.addRespuesta({
                id_encuesta_pregunta: parseInt(resp.id_encuesta_pregunta),
                id_invitacion: nuevaInvitacion.id,
                nombre_nivel_seleccionado: resp.nombre_nivel_seleccionado,
                comentario: resp.comentario || '',
            })
        );
        await Promise.all(respuestaPromises);

        await conn.commit(); // Confirmar la transacción

        res.status(201).json({ message: 'Encuesta externa guardada exitosamente' });
    } catch (error) {
        await conn.rollback(); // Revertir la transacción en caso de error
        next(error);
    } finally {
        conn.release(); // Liberar la conexión
    }
};

// Nueva función para crear una invitación de encuesta externa (base, con PIN)
exports.createEncuestaInvitacion = async (req, res, next) => {
    try {
        const { id } = req.params; // id de la encuesta

        const encuesta = await Encuesta.findById(id);
        if (!encuesta) {
            return res.status(404).json({ message: 'Encuesta no encontrada.' });
        }
        if (!encuesta.para_externos) {
            return res.status(400).json({ message: 'Esta encuesta no está configurada para invitaciones externas.' });
        }

        const invitacion = await EncuestaInvitacion.create({ // Solo se pasa id_encuesta y se genera PIN
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
        const invitacionBase = await EncuestaInvitacion.findByPin(pin);

        if (!invitacionBase) {
            return res.status(404).json({ message: 'PIN de invitación no válido o no encontrado.' });
        }

        // Obtener la encuesta completa para el id_encuesta de la invitación base
        const encuestaCompleta = await Encuesta.getFullEncuestaById(invitacionBase.id_encuesta);
        if (!encuestaCompleta) {
            return res.status(404).json({ message: 'Encuesta asociada a la invitación no encontrada.' });
        }

        // Devolver la encuesta completa y el id_encuesta de la invitación base
        // NOTA: NO se crea una nueva entrada en la BD en este punto.
        // La "sesión" de invitación se crea al momento de enviar el formulario.
        res.json({ encuesta: encuestaCompleta, id_encuesta_base: invitacionBase.id_encuesta, pin: invitacionBase.pin });
    } catch (error) {
        next(error);
    }
};


exports.getEncuestaResultados = async (req, res, next) => {
    try {
        const idEncuesta = req.params.id;
        const resultados = await Encuesta.getResultados(idEncuesta);
        const invitaciones = await EncuestaInvitacion.findByEncuestaId(idEncuesta); // Obtener invitaciones base

        res.json({ resultados, invitaciones }); // Devolver resultados e invitaciones
    } catch (error) {
        next(error);
    }
};

// --- Niveles de Desempeño (rutas y funciones eliminadas) ---
// Ya no se necesitan rutas o controladores para niveles_desempeno
