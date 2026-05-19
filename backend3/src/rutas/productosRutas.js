import express from 'express';
// Asumiendo que tienes tu conexión a la base de datos importada como 'db'
import db from '../config/db.js'; 

const router = express.Router();

// Endpoint real para agregar producto e insertar en auditoría simultáneamente
router.post('/', async (req, res) => {
    const { nombre, precio, stock, talla, usuario, rol } = req.body;
    
    if (!nombre || !precio || !stock) {
        return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    try {
        // 1. Insertar el producto en la tabla 'productos'
        const productQuery = `
            INSERT INTO productos (nombre, precio, stock, talla) 
            VALUES ($1, $2, $3, $4) 
            RETURNING *;
        `;
        const productResult = await db.query(productQuery, [nombre, precio, stock, talla || 'M']);
        const nuevoProducto = productResult.rows[0];

        // 2. Insertar de manera automática el movimiento en la tabla 'auditoria'
        const auditQuery = `
            INSERT INTO auditoria (usuario, rol, accion, detalle, fecha) 
            VALUES ($1, $2, $3, $4, NOW());
        `;
        const detalleAuditoria = `Se ingresó el producto: ${nombre} (${stock} pzas) con precio $${precio}`;
        await db.query(auditQuery, [usuario, rol, 'Recepcion Mercancia', detalleAuditoria]);

        res.status(201).json({
            message: 'Producto e historial registrados con éxito',
            producto: nuevoProducto
        });
    } catch (error) {
        console.error('Error en la base de datos RDS:', error);
        res.status(500).json({ error: 'Error al registrar el producto en la nube' });
    }
});

// Endpoint extra para que tu monitor consulte la tabla auditoria
router.get('/auditoria', async (req, res) => {
    try {
        const query = 'SELECT * FROM auditoria ORDER BY fecha DESC LIMIT 10;';
        const result = await db.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al leer auditoria:', error);
        res.status(500).json({ error: 'Error al consultar el historial' });
    }
});

export default router;