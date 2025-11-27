// models/resultadoAprendizaje.model.js
const pool = require('../config/db');

const ResultadoAprendizaje = {};



ResultadoAprendizaje.create = async ({ codigo, descripcion, estructura }, usuarioAuditoria) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        await conn.execute('SET @usuario_id = ?, @usuario_nombre = ?', [usuarioAuditoria.id, usuarioAuditoria.nombre]);
        
        const [result] = await conn.execute(
            'INSERT INTO resultados_aprendizaje (codigo, descripcion, estructura) VALUES (?, ?, ?)',
            [codigo, descripcion, JSON.stringify(estructura)] // <-- ¡ESTA LÍNEA ES LA CLAVE!
        );
        
        await conn.execute('SET @usuario_id = NULL, @usuario_nombre = NULL');
        await conn.commit();
        
        return { id: result.insertId, codigo, descripcion, estructura };
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
};

ResultadoAprendizaje.getAll = async () => {
    const [rows] = await pool.execute('SELECT * FROM resultados_aprendizaje');
    
    // MySQL ya parsea automáticamente los campos JSON
    // Solo necesitamos verificar si ya es un objeto
    return rows.map(row => ({
        ...row,
        estructura: typeof row.estructura === 'string' 
            ? JSON.parse(row.estructura) 
            : row.estructura
    }));
};
ResultadoAprendizaje.findById = async (id) => {
    const [rows] = await pool.execute('SELECT * FROM resultados_aprendizaje WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    
    const row = rows[0];
    return {
        ...row,
        estructura: typeof row.estructura === 'string' 
            ? JSON.parse(row.estructura) 
            : row.estructura
    };
};

ResultadoAprendizaje.update = async (id, { codigo, descripcion, estructura }, usuarioAuditoria) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        await conn.execute('SET @usuario_id = ?, @usuario_nombre = ?', [usuarioAuditoria.id, usuarioAuditoria.nombre]);
        
       const [result] = await conn.execute(
            'UPDATE resultados_aprendizaje SET codigo = ?, descripcion = ?, estructura = ? WHERE id = ?',
            // La variable `estructura` debe ser un objeto JS, aquí se convierte a string
            [codigo, descripcion, JSON.stringify(estructura), id] // <-- ¡CLAVE!
        );
        
        await conn.execute('SET @usuario_id = NULL, @usuario_nombre = NULL');
        await conn.commit();
        
        return result.affectedRows > 0;
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
};

ResultadoAprendizaje.delete = async (id, usuarioAuditoria) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        await conn.execute('SET @usuario_id = ?, @usuario_nombre = ?', [usuarioAuditoria.id, usuarioAuditoria.nombre]);
        
        // Primero, eliminar los registros dependientes
        // 1. Eliminar de resultados_aprendizaje_historial
        await conn.execute('DELETE FROM resultados_aprendizaje_historial WHERE id_resultado_aprendizaje = ?', [id]);

        // 2. Eliminar de encuesta_preguntas
        await conn.execute('DELETE FROM encuesta_preguntas WHERE id_resultado_aprendizaje = ?', [id]);

        // Luego, eliminar el resultado de aprendizaje principal
        const [result] = await conn.execute('DELETE FROM resultados_aprendizaje WHERE id = ?', [id]);
        
        await conn.execute('SET @usuario_id = NULL, @usuario_nombre = NULL');
        await conn.commit();
        
        return result.affectedRows > 0;
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
};

// Función para ver el historial de un resultado de aprendizaje
ResultadoAprendizaje.getHistoryById = async (id) => {
    const [rows] = await pool.execute(
        'SELECT * FROM resultados_aprendizaje_historial WHERE id_resultado_aprendizaje = ? ORDER BY version DESC',
        [id]
    );
    
    return rows.map(row => ({
        ...row,
        estructura: typeof row.estructura === 'string' 
            ? JSON.parse(row.estructura) 
            : row.estructura
    }));
};


module.exports = ResultadoAprendizaje;
