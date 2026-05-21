import express from 'express';
import { pool } from '../config/db.js';

const router = express.Router();

// ==========================================
// 1. TABLA: auditoria (HISTORIAL COMPARTIDO)
// ==========================================
router.get('/auditoria', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM auditoria ORDER BY fecha DESC LIMIT 15;');
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al consultar auditoria' });
    }
});

// ==========================================
// 2. TABLA: usuarios (GESTIÓN DEL STAFF - CRUD)
// ==========================================
router.get('/usuarios', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, username, rol FROM usuarios ORDER BY id ASC;');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al consultar usuarios' });
    }
});

// ➕ AGREGAR NUEVO USUARIO
router.post('/usuarios', async (req, res) => {
    const { username, rol } = req.body;
    try {
        const result = await pool.query(
            "INSERT INTO usuarios (username, password, rol) VALUES ($1, 'Itsa12345!', $2) RETURNING id, username, rol;",
            [username, rol]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Error al crear usuario' });
    }
});

// ✏️ ACTUALIZAR USUARIO EXISTING
router.put('/usuarios/:id', async (req, res) => {
    const { id } = req.params;
    const { username, rol } = req.body;
    try {
        await pool.query('UPDATE usuarios SET username = $1, rol = $2 WHERE id = $3;', [username, rol, id]);
        res.json({ message: 'Usuario actualizado con éxito' });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar usuario' });
    }
});

// 🗑️ ELIMINAR USUARIO DE LA BASE DE DATOS
router.delete('/usuarios/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM usuarios WHERE id = $1;', [id]);
        res.json({ message: 'Usuario eliminado con éxito' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar usuario' });
    }
});

// ==========================================
// 3. TABLA: productos (INVENTARIO COMPLETO)
// ==========================================
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM productos ORDER BY id DESC;');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al traer productos' });
    }
});

// Guardar producto adaptado a tus 11 columnas reales de PostgreSQL
router.post('/', async (req, res) => {
    const { nombre, precio, stock, talla, usuario, rol } = req.body;
    try {
        const prod = await pool.query(
            `INSERT INTO productos 
            (nombre, descripcion, precio, stock, talla, color, categoria, imagen_url, tags, fecha_creacion) 
            VALUES ($1, 'Prenda cargada desde panel de gerencia', $2, $3, $4, 'Multicolor', 'General', 'https://placeholder.com/ropa.jpg', ARRAY['nueva_temporada'], NOW()) 
            RETURNING *;`,
            [nombre, precio, stock, talla]
        );
        
        await pool.query(
            'INSERT INTO auditoria (usuario, rol, accion, detalle, fecha) VALUES ($1, $2, $3, $4, NOW());',
            [usuario, rol, 'Recepcion Mercancia', `Ingreso: ${nombre} (${stock} pzas)`]
        );
        
        res.status(201).json(prod.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al guardar producto' });
    }
});

// ========================================================
// 4, 5, 6, 7 y 8. RESTO DE TUS ENDPOINTS (VENTAS, CAJA, ETC)
// ========================================================
router.post('/venta', async (req, res) => {
    const { total, items, usuario, rol } = req.body; 
    try {
        await pool.query('BEGIN');
        const venta = await pool.query('INSERT INTO ventas (fecha, total) VALUES (NOW(), $1) RETURNING id;', [total]);
        const ventaId = venta.rows[0].id;
        for (let item of items) {
            await pool.query('INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio) VALUES ($1, $2, $3, $4);', [ventaId, item.producto_id, item.cantidad, item.precio]);
            await pool.query('UPDATE productos SET stock = stock - $1 WHERE id = $2;', [item.cantidad, item.producto_id]);
        }
        await pool.query('INSERT INTO auditoria (usuario, rol, accion, detalle, fecha) VALUES ($1, $2, $3, $4, NOW());', [usuario, rol, 'Venta POS', `Ticket #${ventaId} cobrado por $${total}`]);
        await pool.query('COMMIT');
        res.status(201).json({ message: 'Venta procesada con éxito', ventaId });
    } catch (error) {
        await pool.query('ROLLBACK');
        res.status(500).json({ error: 'Error al procesar la venta' });
    }
});

router.post('/caja', async (req, res) => {
    const { tipo, monto, usuario, rol } = req.body; 
    try {
        await pool.query('INSERT INTO movimientos_caja (tipo, monto, fecha) VALUES ($1, $2, NOW());', [tipo, monto]);
        await pool.query('INSERT INTO auditoria (usuario, rol, accion, detalle, fecha) VALUES ($1, $2, $3, $4, NOW());', [usuario, rol, `Corte Caja`, `${tipo} de caja por $${monto}`]);
        res.status(201).json({ message: 'Movimiento de caja guardado' });
    } catch (error) { res.status(500).json({ error: 'Error en movimiento de caja' }); }
});

router.post('/asistencia', async (req, res) => {
    const { probador, detalle } = req.body;
    try {
        await pool.query("INSERT INTO asistencia_probadores (probador, detalle, estado, fecha) VALUES ($1, $2, 'Pendiente', NOW());", [probador, detalle]);
        res.status(201).json({ message: 'Asistencia solicitada' });
    } catch (error) { res.status(500).json({ error: 'Error al solicitar asistencia' }); }
});

router.get('/asistencia', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM asistencia_probadores WHERE estado = 'Pendiente' ORDER BY fecha DESC;");
        res.json(result.rows);
    } catch (error) { res.status(500).json({ error: 'Error al leer probadores' }); }
});

router.post('/wishlist', async (req, res) => {
    const { usuario_id, producto_id } = req.body;
    try {
        await pool.query('INSERT INTO carrito_deseos (usuario_id, producto_id) VALUES ($1, $2);', [usuario_id, producto_id]);
        res.status(201).json({ message: 'Prenda añadida a tus deseos ❤️' });
    } catch (error) { res.status(500).json({ error: 'Error al guardar en tu lista de deseos' }); }
});

export default router;