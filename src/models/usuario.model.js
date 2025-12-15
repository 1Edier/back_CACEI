// models/usuario.model.js
const pool = require('../config/db');
const bcrypt = require('bcryptjs');

const Usuario = {};

Usuario.create = async ({ usuario, contrasena, rol, nombre_completo, email }) => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(contrasena, salt);
    
    const [result] = await pool.execute(
        'INSERT INTO usuarios (usuario, contrasena, rol, nombre_completo, email) VALUES (?, ?, ?, ?, ?)',
        [usuario, hashedPassword, rol, nombre_completo, email]
    );
    return { id: result.insertId, usuario, rol, nombre_completo, email };
};

Usuario.findByEmail = async (email) => {
    const [rows] = await pool.execute('SELECT * FROM usuarios WHERE email = ? AND activo = TRUE', [email]);
    return rows[0];
};

Usuario.findById = async (id) => {
    const [rows] = await pool.execute('SELECT id, usuario, rol, nombre_completo, email, activo FROM usuarios WHERE id = ?', [id]);
    return rows[0];
};

Usuario.getAll = async () => {
    const [rows] = await pool.execute('SELECT id, usuario, rol, nombre_completo, email, activo, ultimo_acceso FROM usuarios');
    return rows;
};

Usuario.update = async (id, { nombre_completo, email, rol, activo }) => {
    const [result] = await pool.execute(
        'UPDATE usuarios SET nombre_completo = ?, email = ?, rol = ?, activo = ? WHERE id = ?',
        [nombre_completo, email, rol, activo, id]
    );
    return result.affectedRows > 0;
};

Usuario.delete = async (id) => {
    // Usamos un borrado lógico (desactivar) en lugar de un borrado físico
    const [result] = await pool.execute('UPDATE usuarios SET activo = FALSE WHERE id = ?', [id]);
    return result.affectedRows > 0;
};

Usuario.comparePassword = async (candidatePassword, hashedPassword) => {
    return await bcrypt.compare(candidatePassword, hashedPassword);
};

module.exports = Usuario;
