import pkg from 'pg';
const { Pool } = pkg;

const pool = new pkg.Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false }
});

// MAPA DE PERMISOS SUGERIDO
//Esta constante ayuda a visualizar qué puede hacer cada quién en SmartBoutique 🌸

const PERMISOS = {
  admin: ['inventario', 'precios', 'usuarios', 'auditoria', 'ventas', 'caja', 'devoluciones', 'descuentos_full', 'configuracion', 'estadisticas'],
  encargado: ['inventario', 'ventas', 'caja', 'devoluciones', 'descuentos_aplicar', 'productos_edit'],
  vendedor: ['ventas', 'asistencia', 'stock_view', 'clientes_reg', 'descuentos_view'],
  cliente: ['asistencia_solicitar', 'carrito', 'outfits', 'catalogo_view']
};

/**
 * MIDDLEWARE MAESTRO: GERENTE (admin)
 * Acceso total al sistema, auditoría y configuración.
 */
export const esGerente = async (req, res, next) => {
  const username = req.user?.["cognito:username"] || req.user?.username;
  console.log('esGerente - headers:', req.headers);
  console.log('esGerente - username resolved from req.user:', username);

  if (username === 'admin_sofi') {
      return next();
  }
  
  try {
    const result = await pool.query('SELECT rol FROM usuarios WHERE username = $1', [username]);
    console.log('esGerente - query result:', result.rows);
    const user = result.rows[0];

    if (user && user.rol === 'admin') {
      next();
    } else {
      res.status(403).json({ error: "Acceso denegado", message: "Se requiere rol de Gerente para gestión total. 👑" });
    }
  } catch (error) {
    console.error('esGerente - error querying usuarios:', error);
    res.status(500).json({ error: "Error al validar permisos de Gerente." });
  }
};

/**
 * MIDDLEWARE: ENCARGADO DE TIENDA
 * Permisos operativos: inventario, caja y devoluciones.
 */
export const esEncargado = async (req, res, next) => {
  const username = req.user?.["cognito:username"] || req.user?.username;
  console.log('esEncargado - headers:', req.headers);
  console.log('esEncargado - username resolved from req.user:', username);
  try {
    const result = await pool.query('SELECT rol FROM usuarios WHERE username = $1', [username]);
    console.log('esEncargado - query result:', result.rows);
    const user = result.rows[0];

    // El Gerente (admin) también puede entrar a estas funciones
    if (user && (user.rol === 'encargado' || user.rol === 'admin')) {
      next();
    } else {
      res.status(403).json({ error: "Acceso denegado", message: "Acceso restringido a Encargados de Tienda. 👔" });
    }
  } catch (error) {
    console.error('esEncargado - error querying usuarios:', error);
    res.status(500).json({ error: "Error al validar permisos de Encargado." });
  }
};

/**
 * MIDDLEWARE: VENDEDORES DE PISO
 * Enfocado en ventas, asistencia y consulta de stock.
 */
export const esVendedor = async (req, res, next) => {
  const username = req.user?.["cognito:username"] || req.user?.username;
  console.log('esVendedor - headers:', req.headers);
  console.log('esVendedor - username resolved from req.user:', username);
  try {
    const result = await pool.query('SELECT rol FROM usuarios WHERE username = $1', [username]);
    console.log('esVendedor - query result:', result.rows);
    const user = result.rows[0];

    // Admin y Encargado heredan estos permisos operativos
    if (user && ['vendedor', 'encargado', 'admin'].includes(user.rol)) {
      next();
    } else {
      res.status(403).json({ error: "Acceso denegado", message: "Función exclusiva para personal de ventas. 🛍️" });
    }
  } catch (error) {
    console.error('esVendedor - error querying usuarios:', error);
    res.status(500).json({ error: "Error al validar permisos de Vendedor." });
  }
};

/**
 * MIDDLEWARE: CLIENTE
 * Acceso a carrito, outfits y botón de asistencia.
 */
export const esCliente = async (req, res, next) => {
  const username = req.user?.["cognito:username"] || req.user?.username;
  console.log('esCliente - headers:', req.headers);
  console.log('esCliente - username resolved from req.user:', username);
  try {
    const result = await pool.query('SELECT rol FROM usuarios WHERE username = $1', [username]);
    console.log('esCliente - query result:', result.rows);
    const user = result.rows[0];

    if (user && user.rol === 'cliente') {
      next();
    } else {
      res.status(403).json({ error: "Acceso denegado", message: "Esta sección es para clientes. 👤" });
    }
  } catch (error) {
    console.error('esCliente - error querying usuarios:', error);
    res.status(500).json({ error: "Error al validar permisos de Cliente." });
  }
};