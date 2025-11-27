// models/encuestaInvitacion.model.js
const pool = require('../config/db');

const EncuestaInvitacion = {};

// Función para generar un PIN único
function generatePin(length = 6) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

EncuestaInvitacion.create = async ({ id_encuesta, pin = null, lugar = null, tipo_empresa = null, giro = null, egresados_universidad = null, usada_por = null, fecha_uso = null }) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        
        // Si no se proporciona un PIN, generarlo y asegurar que sea único
        if (pin === null) {
            let generatedPin;
            let isUnique = false;
            while (!isUnique) {
                generatedPin = generatePin();
                const [existingPin] = await conn.execute('SELECT id FROM encuesta_invitaciones WHERE pin = ?', [generatedPin]);
                if (existingPin.length === 0) {
                    isUnique = true;
                }
            }
            pin = generatedPin;
        }

        const [result] = await conn.execute(
            'INSERT INTO encuesta_invitaciones (id_encuesta, pin, lugar, tipo_empresa, giro, egresados_universidad, usada_por, fecha_uso) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [id_encuesta, pin, lugar, tipo_empresa, giro, egresados_universidad, usada_por, fecha_uso]
        );
        
        await conn.commit();
        
        return { id: result.insertId, id_encuesta, pin, lugar, tipo_empresa, giro, egresados_universidad, usada_por, fecha_uso };
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
};

EncuestaInvitacion.findById = async (id) => {
    const [rows] = await pool.execute(
        'SELECT ei.*, e.nombre as encuesta_nombre, e.descripcion as encuesta_descripcion FROM encuesta_invitaciones ei JOIN encuestas e ON ei.id_encuesta = e.id WHERE ei.id = ?',
        [id]
    );
    return rows[0];
};

EncuestaInvitacion.findByPin = async (pin) => {
    const [rows] = await pool.execute(
        'SELECT ei.*, e.nombre as encuesta_nombre, e.descripcion as encuesta_descripcion FROM encuesta_invitaciones ei JOIN encuestas e ON ei.id_encuesta = e.id WHERE ei.pin = ?',
        [pin]
    );
    return rows[0];
};

// Nueva función para encontrar invitaciones por id de encuesta (solo las que tienen PIN)
EncuestaInvitacion.findByEncuestaId = async (id_encuesta) => {
    const [rows] = await pool.execute(
        'SELECT id, pin FROM encuesta_invitaciones WHERE id_encuesta = ? AND pin IS NOT NULL',
        [id_encuesta]
    );
    return rows;
};

// Nueva función para guardar los datos del encuestado para una sesión de invitación
EncuestaInvitacion.saveEncuestadoData = async (id_invitacion, { lugar, tipo_empresa, giro, egresados_universidad, usada_por }) => {
    await pool.execute(
        'UPDATE encuesta_invitaciones SET lugar = ?, tipo_empresa = ?, giro = ?, egresados_universidad = ?, usada_por = ?, fecha_uso = CURRENT_TIMESTAMP WHERE id = ?',
        [lugar, tipo_empresa, giro, egresados_universidad, usada_por, id_invitacion]
    );
};

module.exports = EncuestaInvitacion;
