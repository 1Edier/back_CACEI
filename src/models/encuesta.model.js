// models/encuesta.model.js
const pool = require('../config/db');

const Encuesta = {};

// Función auxiliar para resolver JSONPath simple (ej. $.criterios[0].indicadores[1])
const resolveJsonPath = (obj, path) => {
    if (!obj || !path) return undefined;
    const parts = path.split('.').slice(1); // Eliminar el '$' inicial
    let current = obj;

    for (const part of parts) {
        const arrayMatch = part.match(/(\w+)\[(\d+)\]/);
        if (arrayMatch) {
            const [, key, index] = arrayMatch;
            if (current[key] && Array.isArray(current[key]) && current[key][parseInt(index)] !== undefined) {
                current = current[key][parseInt(index)];
            } else {
                return undefined;
            }
        } else {
            if (current[part] !== undefined) {
                current = current[part];
            } else {
                return undefined;
            }
        }
    }
    return current;
};

// --- CRUD de Encuestas ---
Encuesta.create = async ({ nombre, descripcion, fecha_inicio, fecha_fin, para_externos = false }) => {
    const [result] = await pool.execute(
        'INSERT INTO encuestas (nombre, descripcion, fecha_inicio, fecha_fin, para_externos) VALUES (?, ?, ?, ?, ?)',
        [nombre, descripcion, fecha_inicio, fecha_fin, para_externos ? 1 : 0]
    );
    return { id: result.insertId, nombre, descripcion, para_externos };
};

Encuesta.getAll = async () => {
    const [rows] = await pool.execute('SELECT * FROM encuestas ORDER BY created_at DESC');
    return rows;
};

Encuesta.findById = async (id) => {
    const [rows] = await pool.execute('SELECT * FROM encuestas WHERE id = ?', [id]);
    return rows[0];
};

Encuesta.addPregunta = async (id_encuesta, { id_resultado_aprendizaje, criterio_path, indicador_path, texto, orden, obligatorio }) => {
    const [result] = await pool.execute(
        'INSERT INTO encuesta_preguntas (id_encuesta, id_resultado_aprendizaje, criterio_path, indicador_path, texto, orden, obligatorio) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id_encuesta, id_resultado_aprendizaje, criterio_path, indicador_path, texto, orden, obligatorio]
    );
    return { id: result.insertId };
};

// --- Lógica de Respuestas ---
Encuesta.addRespuesta = async ({ id_encuesta_pregunta, usuario_id = null, id_invitacion = null, nombre_nivel_seleccionado, comentario }) => {
    if (!usuario_id && !id_invitacion) {
        throw new Error('Debe proporcionar un usuario_id o un id_invitacion para la respuesta.');
    }
    const [result] = await pool.execute(
        'INSERT INTO encuesta_respuestas (id_encuesta_pregunta, usuario_id, id_invitacion, nombre_nivel_seleccionado, comentario) VALUES (?, ?, ?, ?, ?)',
        [id_encuesta_pregunta, usuario_id, id_invitacion, nombre_nivel_seleccionado, comentario]
    );
    return { id: result.insertId };
};

// --- Obtener datos complejos ---
Encuesta.getFullEncuestaById = async (id) => {
    const [encuestaRows] = await pool.execute('SELECT * FROM encuestas WHERE id = ?', [id]);
    if (encuestaRows.length === 0) return null;

    const encuesta = encuestaRows[0];
    
    const [preguntasRows] = await pool.execute(`
        SELECT 
            ep.*,
            ra.codigo as resultado_codigo,
            ra.estructura
        FROM encuesta_preguntas ep
        JOIN resultados_aprendizaje ra ON ep.id_resultado_aprendizaje = ra.id
        WHERE ep.id_encuesta = ?
        ORDER BY ep.orden
    `, [id]);

    const preguntasProcesadas = preguntasRows.map(pregunta => {
        const estructura = pregunta.estructura;
        const criterio = resolveJsonPath(estructura, pregunta.criterio_path);
        const indicador = resolveJsonPath(estructura, pregunta.indicador_path);

        return {
            ...pregunta,
            resultado_codigo: pregunta.resultado_codigo,
            criterio_nombre: criterio ? criterio.nombre : null,
            indicador_nombre: indicador ? indicador.nombre : null,
            descriptores: indicador ? indicador.descriptores : null,
            niveles_desempeno: estructura ? estructura.niveles : null, // Extraer los niveles de desempeño de la estructura
        };
    });

    return { ...encuesta, preguntas: preguntasProcesadas };
};

Encuesta.getResultados = async (id_encuesta) => {
    const [rows] = await pool.execute(`
        SELECT
            er.id,
            er.comentario,
            er.fecha_respuesta,
            ep.id as id_encuesta_pregunta,
            ep.texto as pregunta_texto,
            ep.criterio_path,
            ep.indicador_path,
            ra.codigo as resultado_codigo,
            er.nombre_nivel_seleccionado, -- Obtener directamente el nombre del nivel seleccionado
            u.usuario,
            u.nombre_completo,
            ei.lugar,
            ei.tipo_empresa,
            ei.giro,
            ei.egresados_universidad,
            ei.pin as invitacion_pin,
            ei.usada_por
        FROM encuesta_respuestas er
        JOIN encuesta_preguntas ep ON er.id_encuesta_pregunta = ep.id
        LEFT JOIN resultados_aprendizaje ra ON ep.id_resultado_aprendizaje = ra.id
        LEFT JOIN usuarios u ON er.usuario_id = u.id
        LEFT JOIN encuesta_invitaciones ei ON er.id_invitacion = ei.id -- Unir con la tabla de invitaciones
        WHERE ep.id_encuesta = ?
    `, [id_encuesta]);

    return rows;
}


module.exports = Encuesta;
