import express from 'express';
import { pool } from '../config/db.js';
import { esGerente, esEncargado, esVendedor, esCliente } from '../middlewares/rolesMiddleware.js';
const router = express.Router();

const getUsuarioId = async (usuario) => {
    if (!usuario) return null;
    if (typeof usuario === 'number') return usuario;
    try {
        const result = await pool.query('SELECT id FROM usuarios WHERE username = $1 LIMIT 1;', [usuario]);
        return result.rows[0]?.id ?? null;
    } catch (error) {
        console.error('Error resolviendo usuario_id para auditoria:', error);
        return null;
    }
};

// ==========================================
// 1. TABLA: auditoria (HISTORIAL COMPARTIDO)
// ==========================================
router.get('/auditoria', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT a.*, u.username as usuario, u.rol 
            FROM auditoria a 
            LEFT JOIN usuarios u ON a.usuario_id = u.id 
            ORDER BY a.fecha DESC LIMIT 15;
        `);        
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al consultar auditoria' });
    }
});

// ==========================================
// 2. TABLA: usuarios (GESTIÓN DEL STAFF - CRUD)
// ==========================================

// 🔒 CONSULTAR USUARIOS (Solo Gerente)
router.get('/usuarios', esGerente, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, username, rol FROM usuarios ORDER BY id ASC;');
        res.json(result.rows);
    } catch (error) {
        console.error('Error al consultar usuarios:', error);
        res.status(500).json({ error: 'Error al consultar usuarios' });
    }
});

// 🔒 AGREGAR NUEVO USUARIO (Solo Gerente)
router.post('/usuarios', esGerente, async (req, res) => {
    const { username, rol } = req.body;
    try {
        const result = await pool.query(
            "INSERT INTO usuarios (username, password, rol) VALUES ($1, 'Itsa12345!', $2) RETURNING id, username, rol;",
            [username, rol]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error al crear usuario:', error);
        res.status(500).json({ error: 'Error al crear usuario' });
    }
});

// 🔒 ACTUALIZAR USUARIO EXISTENTE (Solo Gerente)
router.put('/usuarios/:id', esGerente, async (req, res) => {
    const { id } = req.params;
    const { username, rol } = req.body;
    try {
        await pool.query('UPDATE usuarios SET username = $1, rol = $2 WHERE id = $3;', [username, rol, id]);
        res.json({ message: 'Usuario actualizado con éxito' });
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({ error: 'Error al actualizar usuario' });
    }
});

// 🔒 ELIMINAR USUARIO DE LA BASE DE DATOS (Solo Gerente)
router.delete('/usuarios/:id', esGerente, async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM usuarios WHERE id = $1;', [id]);
        res.json({ message: 'Usuario eliminado con éxito' });
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({ error: 'Error al eliminar usuario' });
    }
});

// ==========================================
// 3. TABLA: productos (INVENTARIO COMPLETO - CRUD)
// ==========================================
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM productos ORDER BY id DESC;');
        res.json(result.rows);
    } catch (error) {
        console.error('❌ ERROR REAL EN POSTGRESQL (RDS):', error);
        res.status(500).json({ error: 'Error al traer productos' });
    }
});

// 🛠️ POST MODIFICADO: Ahora recibe dinámicamente imagen_url (Base64), descripción, categoría, color y tags
router.post('/', async (req, res) => {
    const { nombre, descripcion, precio, stock, talla, color, categoria, imagen_url, tags, usuario, rol } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        let productTags = tags;
        if (typeof productTags === 'string') {
            productTags = productTags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
        }
        if (!Array.isArray(productTags) || productTags.length === 0) {
            productTags = ['nueva_temporada'];
        }

        const prod = await client.query(
            `INSERT INTO productos 
            (nombre, descripcion, precio, stock, talla, color, categoria, imagen_url, tags, fecha_creacion) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()) 
            RETURNING *;`,
            [
                nombre,
                descripcion || 'Prenda cargada desde panel de gerencia',
                precio,
                stock,
                talla,
                color || 'Multicolor',
                categoria || 'General',
                imagen_url || 'https://via.placeholder.com/300x200?text=Prenda+SmartBoutique',
                productTags
            ]
        );

        const usuarioId = await getUsuarioId(usuario);
        const auditQuery = usuarioId !== null
            ? 'INSERT INTO auditoria (usuario_id, accion_realizada, detalle_accion, fecha) VALUES ($1, $2, $3, NOW());'
            : 'INSERT INTO auditoria (accion_realizada, detalle_accion, fecha) VALUES ($1, $2, NOW());';
        const auditParams = usuarioId !== null
            ? [usuarioId, 'Recepcion Mercancia', `Ingreso: ${nombre} (${stock} pzas)`]
            : ['Recepcion Mercancia', `Usuario: ${usuario || 'desconocido'} - Ingreso: ${nombre} (${stock} pzas)`];

        await client.query(auditQuery, auditParams);

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            message: 'Producto guardado correctamente',
            producto: prod.rows[0]
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('ERROR POSTGRESQL:', error);
        res.status(500).json({ error: 'Error al guardar producto', details: error.message });
    } finally {
        client.release();
    }
});

// 🛠️ PUT MODIFICADO: Sincroniza las columnas imagen_url (Base64) y tags (arreglos de texto) con el Modal
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, precio, stock, talla, color, categoria, descripcion, imagen_url, tags } = req.body;
    try {
        await pool.query(
            `UPDATE productos 
             SET nombre = $1, precio = $2, stock = $3, talla = $4, color = $5, categoria = $6, descripcion = $7, imagen_url = $8, tags = $9
             WHERE id = $10;`,
            [nombre, precio, stock, talla, color, categoria, descripcion, imagen_url, tags, id]
        );
        res.json({ message: 'Producto actualizado con éxito en PostgreSQL' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar el producto' });
    }
});

// ========================================================
// 4, 5, 6, 7 y 8. RESTO DE TUS ENDPOINTS (VENTAS, CAJA, ETC)
// ========================================================
router.post('/venta', async (req, res) => {
    const { total, items, usuario, rol } = req.body; 
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const venta = await client.query('INSERT INTO ventas (fecha, total) VALUES (NOW(), $1) RETURNING id;', [total]);
        const ventaId = venta.rows[0].id;
        for (let item of items) {
            await client.query('INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio) VALUES ($1, $2, $3, $4);', [ventaId, item.producto_id, item.cantidad, item.precio]);
            await client.query('UPDATE productos SET stock = stock - $1 WHERE id = $2;', [item.cantidad, item.producto_id]);
        }
        const usuarioId = await getUsuarioId(usuario);
        await client.query('INSERT INTO auditoria (usuario_id, accion_realizada, detalle_accion, fecha) VALUES ($1, $2, $3, NOW());', [usuarioId, 'Venta POS', `Ticket #${ventaId} cobrado por $${total}`]);
        await client.query('COMMIT');
        res.status(201).json({ message: 'Venta procesada con éxito', ventaId });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('ERROR VENTA:', error);
        res.status(500).json({ error: 'Error al procesar la venta', details: error.message });
    } finally {
        client.release();
    }
});

router.post('/caja', async (req, res) => {
    const { tipo, monto, usuario, rol } = req.body; 
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('INSERT INTO movimientos_caja (tipo, monto, fecha) VALUES ($1, $2, NOW());', [tipo, monto]);
        const usuarioId = await getUsuarioId(usuario);
        await client.query('INSERT INTO auditoria (usuario_id, accion_realizada, detalle_accion, fecha) VALUES ($1, $2, $3, NOW());', [usuarioId, 'Corte Caja', `${tipo} de caja por $${monto}`]);
        await client.query('COMMIT');
        res.status(201).json({ message: 'Movimiento de caja guardado' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('ERROR CAJA:', error);
        res.status(500).json({ error: 'Error en movimiento de caja', details: error.message });
    } finally {
        client.release();
    }
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