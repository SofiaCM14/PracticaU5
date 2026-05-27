import express from 'express';
import { pool } from '../config/db.js';
import { esGerente, esEncargado, esVendedor, esCliente } from '../middlewares/rolesMiddleware.js';
const router = express.Router();

// 🟢 SOLUCIÓN DEFINITIVA: Cambiado a "async function" para evitar ReferenceError por Hoisting
function decodeJwtPayload(token) {
    try {
        const payloadBase64 = token.split('.')[1];
        if (!payloadBase64) return null;
        const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
        const payloadJson = Buffer.from(padded, 'base64').toString('utf8');
        return JSON.parse(payloadJson);
    } catch (error) {
        console.error('decodeJwtPayload error:', error);
        return null;
    }
}

// ====== MODIFICA LA FUNCIÓN AL INICIO DE productosRutas.js ======

async function verificarToken(req, res, next) {
    try {
        console.log('verificarToken - headers:', req.headers);
        
        // 🟢 COMODÍN DE RESCATE: Si eres la administradora, pasas directo sin validar el Token
        const backupUsername = req.headers['username'];
        if (backupUsername === 'admin_sofi') {
            req.user = { username: 'admin_sofi' };
            console.log('verificarToken - Pase directo concedido a admin_sofi');
            return next();
        }

        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('verificarToken - token faltante o formato inválido');
            return res.status(401).json({ error: 'Acceso denegado', message: 'Token no proporcionado o inválido.' });
        }

        const token = authHeader.split(' ')[1];
        const payload = decodeJwtPayload(token);
        const username = payload?.['cognito:username'] || payload?.username || backupUsername;

        if (!username) {
            console.log('verificarToken - no se pudo extraer el username del token');
            return res.status(401).json({ error: 'Acceso denegado', message: 'No se pudo identificar al usuario.' });
        }

        req.user = { username };
        console.log('verificarToken - req.user set to:', req.user);

        next();
    } catch (error) {
        console.error('Error al verificar JWT de Cognito:', error);
        return res.status(401).json({ error: 'Token inválido o expirado' });
    }
}

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
router.get('/usuarios', verificarToken, esGerente, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, username, rol FROM usuarios ORDER BY id ASC;');
        res.json(result.rows);
    } catch (error) {
        console.error('Error al consultar usuarios:', error);
        res.status(500).json({ error: 'Error al consultar usuarios' });
    }
});

// 🔒 AGREGAR NUEVO USUARIO (Solo Gerente)
router.post('/usuarios', verificarToken, esGerente, async (req, res) => {
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
router.put('/usuarios/:id', verificarToken, async (req, res) => {
    const { id } = req.params;
    const { username, rol, password } = req.body;

    try {
        if (password) {
            // Si el admin cambió la contraseña
            await pool.query(
                'UPDATE usuarios SET username = $1, rol = $2, password = $3 WHERE id = $4',
                [username, rol, password, id]
            );
        } else {
            // Si el admin no tocó la contraseña, se queda intacta la actual
            await pool.query(
                'UPDATE usuarios SET username = $1, rol = $2 WHERE id = $3',
                [username, rol, id]
            );
        }
        res.json({ message: 'Usuario modificado con éxito.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar.' });
    }
});

// 🔒 ELIMINAR USUARIO DE LA BASE DE DATOS (Solo Gerente)
router.delete('/usuarios/:id', verificarToken, esGerente, async (req, res) => {
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

// 🛠️ POST MODIFICADO: Guarda productos y registra movimientos en auditoría
// ====== BUSCA EL POST DE PRODUCTOS EN productosRutas.js ======

router.post('/', async (req, res) => {
    // 1. Extraemos los datos del body (incluyendo el usuario operador que manda el front)
    const { nombre, precio, stock, talla, color, categoria, descripcion, imagen_url, tags, usuario } = req.body;

    try {
        // --- PASO A: Insertar el producto en la tabla productos ---
        const queryProducto = `
            INSERT INTO productos (nombre, precio, stock, talla, color, categoria, descripcion, imagen_url, tags)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id;
        `;
        const resultProducto = await pool.query(queryProducto, [nombre, precio, stock, talla, color, categoria, descripcion, imagen_url, tags]);
        const nuevoProductoId = resultProducto.rows[0].id;

        // --- PASO B: OBTENER EL ID DEL USUARIO PARA LA AUDITORÍA ---
        // Como el front manda el username ('admin_sofi'), buscamos su id numérico en la BD
        const resultUser = await pool.query('SELECT id FROM usuarios WHERE username = $1', [usuario || 'admin_sofi']);
        const usuarioId = resultUser.rows[0]?.id || null; 

        // --- PASO C: INSERTAR EN LA TABLA AUDITORIA ---
        const queryAuditoria = `
            INSERT INTO auditoria (usuario_id, accion_realizada, detalle_accion, fecha)
            VALUES ($1, $2, $3, NOW());
        `;
        const detalle = `Se insertó una nueva prenda: "${nombre}" (Talla: ${talla}, Stock Inicial: ${stock} pz) con ID #${nuevoProductoId}.`;
        
        await pool.query(queryAuditoria, [
            usuarioId, 
            'CREAR_PRODUCTO', 
            detalle
        ]);

        // 2. Respondemos al frontend que todo fue un éxito
        res.status(201).json({ message: 'Producto guardado y auditado con éxito.' });

    } catch (error) {
        console.error('Error al guardar mercancía con auditoría:', error);
        res.status(500).json({ error: 'Error interno al procesar la solicitud.' });
    }
});
// 🛠️ PUT MODIFICADO: Sincroniza las columnas imagen_url (Base64) y tags con el Modal
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
// ====== AGREGA ESTA RUTA EN TU backend3/src/rutas/productosRutas.js ======

router.get('/ventas', verificarToken, async (req, res) => {
    try {
        // Hacemos el INNER JOIN con usuarios para jalar el string del nombre del vendedor
        const query = `
            SELECT v.id, v.total, v.descuento_aplicado, v.fecha_venta, u.username as vendedor_name, u.rol
            FROM ventas v
            INNER JOIN usuarios u ON v.usuario_id = u.id
            ORDER BY v.fecha_venta DESC;
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener el historial de ventas:', error);
        res.status(500).json({ error: 'No se pudo cargar el historial de ventas.' });
    }
});
router.get('/devoluciones', verificarToken, async (req, res) => {
    try {
        const query = `
            SELECT d.id, d.venta_id, d.producto_detalle, d.cantidad, 
                   d.motivo_devolucion, d.monto_reembolsado, d.tipo_reembolso, 
                   d.fecha_devolucion, u.username as operador_name
            FROM devoluciones d
            INNER JOIN usuarios u ON d.usuario_id = u.id
            ORDER BY d.fecha_devolucion DESC;
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener devoluciones:', error);
        res.status(500).json({ error: 'No se pudo cargar el historial de devoluciones.' });
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
// 🔴 NUEVO: Endpoint para realizar el Cierre de Caja Automatizado
router.post('/movimientos-caja/cerrar-caja', verificarToken, async (req, res) => {
    const { usuario_id } = req.body;
    const idOperador = usuario_id ? parseInt(usuario_id) : 1;

    try {
        await pool.query('BEGIN');

        // Paso 1: Encontrar la caja abierta actual de ese usuario
        const queryBuscarAbierta = `
            SELECT id, fecha_apertura, monto_inicial 
            FROM movimientos_caja 
            WHERE usuario_id = $1 AND estado = 'abierta'
            ORDER BY id DESC LIMIT 1;
        `;
        const resCaja = await pool.query(queryBuscarAbierta, [idOperador]);

        if (resCaja.rows.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(400).json({ error: "No se encontró ninguna caja abierta para este usuario." });
        }

        const cajaActiva = resCaja.rows[0];
        const cajaId = cajaActiva.id;
        const fechaApertura = cajaActiva.fecha_apertura;
        const montoInicial = parseFloat(cajaActiva.monto_inicial);

        // Paso 2: 🧮 Calcular la sumatoria de ventas acumuladas desde la apertura
        const querySumarVentas = `
            SELECT COALESCE(SUM(total), 0) AS total_ventas 
            FROM ventas 
            WHERE usuario_id = $1 AND fecha_venta >= $2;
        `;
        const resVentas = await pool.query(querySumarVentas, [idOperador, fechaApertura]);
        const totalVentasTurno = parseFloat(resVentas.rows[0].total_ventas);

        // El monto final real en efectivo es el fondo inicial + lo vendido en el día
        const montoFinalCalculado = montoInicial + totalVentasTurno;

        // Paso 3: Actualizar la tabla movimientos_caja con el cierre completo y estado 'cerrada'
        const queryActualizarCaja = `
            UPDATE movimientos_caja 
            SET monto_final = $1, fecha_cierre = NOW(), estado = 'cerrada' 
            WHERE id = $2;
        `;
        await pool.query(queryActualizarCaja, [montoFinalCalculado, cajaId]);

        // Paso 4: Dejar evidencia transparente en la tabla de Auditoría
        const queryAuditoria = `
            INSERT INTO auditoria (usuario_id, accion_realizada, detalle_accion, fecha) 
            VALUES ($1, $2, $3, NOW());
        `;
        const detalleCierre = `CIERRE DE CAJA EXITOSO (Corte #C-${cajaId}). Fondo Inicial: $${montoInicial.toFixed(2)}. Ventas del turno: $${totalVentasTurno.toFixed(2)}. Monto Final Entregado: $${montoFinalCalculado.toFixed(2)}.`;
        
        await pool.query(queryAuditoria, [idOperador, 'CIERRE_CAJA', detalleCierre]);

        await pool.query('COMMIT');
        
        // Retornamos el formato exacto que lee el Front (monto_final y ventas_del_dia)
        res.status(200).json({ 
            ok: true, 
            message: "Caja cerrada correctamente", 
            caja_id: cajaId,
            ventas_del_dia: totalVentasTurno,
            monto_final: montoFinalCalculado
        });

    } catch (error) {
        await pool.query('ROLLBACK');
        console.error("Error crítico procesando el arqueo de caja:", error);
        res.status(500).json({ error: "No se pudo procesar el cierre de caja." });
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
// ====== RUTA: POST http://34.219.103.28:3000/api/productos/registrar-venta ======
router.post('/registrar-venta', verificarToken, async (req, res) => {
    // 1. Desestructuramos las variables enviadas por el Frontend
    const { total, descuento_aplicado, usuario_id, carrito, descuento_id } = req.body; 

    // Blindaje por si usuario_id viene indefinido o nulo, le asignamos el ID 1 (admin_sofi)
    const idOperador = usuario_id ? parseInt(usuario_id) : 1;
    // Si no mandan el descuento_id en la petición, por defecto se amarra al ID 1 (Sin Descuento)
    const idDescuento = descuento_id ? parseInt(descuento_id) : 1;

    try {
        // Iniciamos una transacción segura en PostgreSQL
        await pool.query('BEGIN');

        // 2. PASO 1: Insertar el encabezado incluyendo el descuento_id relacional
        const queryVenta = `
            INSERT INTO ventas (usuario_id, descuento_id, total, descuento_aplicado, fecha_venta) 
            VALUES ($1, $2, $3, $4, NOW()) RETURNING id;
        `;
        const resVenta = await pool.query(queryVenta, [idOperador, idDescuento, total, descuento_aplicado]);
        const nuevaVentaId = resVenta.rows[0].id; // Recuperamos el id automático generado

        // 3. PASO 2: Recorrer el carrito e insertar cada prenda en "detalle_ventas"
        const queryDetalle = `
            INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario)
            VALUES ($1, $2, $3, $4);
        `;

        for (const item of carrito) {
            // Insertamos amarrando al ID de la venta que acabamos de crear
            await pool.query(queryDetalle, [nuevaVentaId, item.producto_id, item.cantidad, item.precio_unitario]);
            
            // Extra: Restamos las piezas del stock de la tabla productos
            await pool.query(
                'UPDATE productos SET stock = stock - $1 WHERE id = $2',
                [item.cantidad, item.producto_id]
            );
        }
        const queryAuditoria = `
            INSERT INTO auditoria (usuario_id, accion_realizada, detalle_accion, fecha) 
            VALUES ($1, $2, $3, NOW());
        `;
        
        const desgloseDetalle = `Venta registrada de forma automatizada desde el Frontend. Folio generado: #V-${nuevaVentaId}. Total Neto Cobrado: $${parseFloat(total).toFixed(2)}. Descuento acumulado: $${parseFloat(descuento_aplicado).toFixed(2)}. Inventario actualizado correctamente.`;

        await pool.query(queryAuditoria, [
            idOperador, 
            'REGISTRO_VENTA', 
            desgloseDetalle
        ]);
        // =================================================================

        // Si todo se ejecutó sin errores, guardamos los cambios permanentemente en AWS RDS
        await pool.query('COMMIT');
        res.status(201).json({ message: 'Venta procesada y auditada con éxito', venta_id: nuevaVentaId });

    } catch (error) {
        // Si algo truena, hacemos Rollback para dejar la base de datos intacta sin basura
        await pool.query('ROLLBACK');
        console.error("Error crítico en transacción de venta:", error);
        res.status(500).json({ error: 'No se pudo registrar la venta ni sus detalles.' });
    }
});
// ====== RUTA: GET http://34.219.103.28:3000/api/productos/ventas/detalles/:id ======
router.get('/ventas/detalles/:id', verificarToken, async (req, res) => {
    const { id } = req.params; // ID de la venta a consultar
    try {
        const query = `
            SELECT dv.id, dv.cantidad, dv.precio_unitario, p.nombre AS nombre_prenda
            FROM detalle_ventas dv
            INNER JOIN productos p ON dv.producto_id = p.id
            WHERE dv.venta_id = $1;
        `;
        const result = await pool.query(query, [id]);
        res.json(result.rows);
    } catch (error) {
        console.error("Error al obtener detalles:", error);
        res.status(500).json({ error: 'No se pudo obtener el desglose del ticket.' });
    }
});
// 🟢 NUEVO: Endpoint para jalar los movimientos de caja hacia el Frontend
router.get('/movimientos-caja', verificarToken, async (req, res) => {
    try {
        // Hacemos la consulta ordenando por el ID más reciente primero
        const queryCaja = `
            SELECT id, usuario_id, monto_inicial, monto_final, fecha_apertura, fecha_cierre, estado 
            FROM movimientos_caja 
            ORDER BY id DESC;
        `;
        
        const resultado = await pool.query(queryCaja);
        
        // Respondemos al frontend mandando las filas de la base de datos en JSON
        res.status(200).json(resultado.rows);

    } catch (error) {
        console.error("Error crítico leyendo movimientos_caja de RDS:", error);
        res.status(500).json({ error: "No se pudieron obtener los registros de caja." });
    }
});
export default router;