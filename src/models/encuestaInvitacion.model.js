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

EncuestaInvitacion.create = async ({ id_encuesta }) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        
        let pin;
        let isUnique = false;
        while (!isUnique) {
            pin = generatePin();
            const [existingPin] = await conn.execute('SELECT id FROM encuesta_invitaciones WHERE pin = ?', [pin]);
            if (existingPin.length === 0) {
                isUnique = true;
            }
        }

        const [result] = await conn.execute(
            'INSERT INTO encuesta_invitaciones (id_encuesta, pin, lugar, tipo_empresa, giro, egresados_universidad) VALUES (?, ?, NULL, NULL, NULL, NULL)',
            [id_encuesta, pin]
        );
        
        await conn.commit();
        
        return { id: result.insertId, id_encuesta, pin };
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

EncuestaInvitacion.markAsUsed = async (id_invitacion, usada_por) => {
    await pool.execute(
        'UPDATE encuesta_invitaciones SET usada_por = ?, fecha_uso = CURRENT_TIMESTAMP WHERE id = ?',
        [usada_por, id_invitacion]
    );
};

EncuestaInvitacion.updateExternalData = async (id_invitacion, { lugar, tipo_empresa, giro, egresados_universidad, usada_por }) => {
    await pool.execute(
        'UPDATE encuesta_invitaciones SET lugar = ?, tipo_empresa = ?, giro = ?, egresados_universidad = ?, usada_por = ?, fecha_uso = CURRENT_TIMESTAMP WHERE id = ? AND usada_por IS NULL',
        [lugar, tipo_empresa, giro, egresados_universidad, usada_por, id_invitacion]
    );
};

module.exports = EncuestaInvitacion;
