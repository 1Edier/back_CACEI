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
Encuesta.create = async ({ nombre, descripcion, fecha_inicio, fecha_fin }) => {
    const [result] = await pool.execute(
        'INSERT INTO encuestas (nombre, descripcion, fecha_inicio, fecha_fin) VALUES (?, ?, ?, ?)',
        [nombre, descripcion, fecha_inicio, fecha_fin]
    );
    return { id: result.insertId, nombre, descripcion };
};

Encuesta.getAll = async () => {
    const [rows] = await pool.execute('SELECT * FROM encuestas ORDER BY created_at DESC');
    return rows;
};

Encuesta.findById = async (id) => {
    const [rows] = await pool.execute('SELECT * FROM encuestas WHERE id = ?', [id]);
    return rows[0];
};

// --- CRUD de Items de Encuesta ---
Encuesta.addItem = async (id_encuesta, { id_resultado_aprendizaje, criterio_path, indicador_path, orden }) => {
    const [result] = await pool.execute(
        'INSERT INTO encuesta_items (id_encuesta, id_resultado_aprendizaje, criterio_path, indicador_path, orden) VALUES (?, ?, ?, ?, ?)',
        [id_encuesta, id_resultado_aprendizaje, criterio_path, indicador_path, orden]
    );
    return { id: result.insertId };
};

Encuesta.addPregunta = async (id_encuesta, { id_resultado_aprendizaje, criterio_path, indicador_path, texto, orden, obligatorio }) => {
    const [result] = await pool.execute(
        'INSERT INTO encuesta_preguntas (id_encuesta, id_resultado_aprendizaje, criterio_path, indicador_path, texto, orden, obligatorio) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id_encuesta, id_resultado_aprendizaje, criterio_path, indicador_path, texto, orden, obligatorio]
    );
    return { id: result.insertId };
};

// --- Lógica de Respuestas ---
Encuesta.addRespuesta = async ({ id_encuesta_item, usuario_id, nivel_seleccionado, comentario }) => {
    const [result] = await pool.execute(
        'INSERT INTO encuesta_respuestas (id_encuesta_item, usuario_id, nivel_seleccionado, comentario) VALUES (?, ?, ?, ?)',
        [id_encuesta_item, usuario_id, nivel_seleccionado, comentario]
    );
    return { id: result.insertId };
};

// --- Obtener datos complejos ---
Encuesta.getFullEncuestaById = async (id) => {
    const [encuestaRows] = await pool.execute('SELECT * FROM encuestas WHERE id = ?', [id]);
    if (encuestaRows.length === 0) return null;

    const encuesta = encuestaRows[0];
    
    const [preguntasRows] = await pool.execute('SELECT * FROM encuesta_preguntas WHERE id_encuesta = ? ORDER BY orden', [id]);

    const [itemsRows] = await pool.execute(`
        SELECT 
            ei.id,
            ei.orden,
            ei.obligatorio,
            ra.codigo,
            ra.estructura,
            ei.criterio_path,
            ei.indicador_path
        FROM encuesta_items ei
        JOIN resultados_aprendizaje ra ON ei.id_resultado_aprendizaje = ra.id
        WHERE ei.id_encuesta = ?
        ORDER BY ei.orden
    `, [id]);

    // Extraemos la información relevante usando la función auxiliar resolveJsonPath
    const items = itemsRows.map(item => {
        const estructura = item.estructura; // Ya es un objeto
        const criterio = resolveJsonPath(estructura, item.criterio_path);
        const indicador = resolveJsonPath(estructura, item.indicador_path);
        
        return {
            id: item.id,
            orden: item.orden,
            obligatorio: item.obligatorio,
            resultado_codigo: item.codigo,
            criterio_nombre: criterio.nombre,
            indicador_nombre: indicador.nombre,
            descriptores: indicador.descriptores,
            niveles: estructura.niveles
        };
    });

    return { ...encuesta, items, preguntas: preguntasRows };
};

Encuesta.getResultados = async (id_encuesta) => {
    const [rows] = await pool.execute(`
        SELECT 
            er.id,
            er.nivel_seleccionado,
            er.comentario,
            er.fecha_respuesta,
            ei.id as id_encuesta_item,
            u.usuario,
            u.nombre_completo
        FROM encuesta_respuestas er
        JOIN encuesta_items ei ON er.id_encuesta_item = ei.id
        LEFT JOIN usuarios u ON er.usuario_id = u.id
        WHERE ei.id_encuesta = ?
    `, [id_encuesta]);
    return rows;
}


module.exports = Encuesta;
