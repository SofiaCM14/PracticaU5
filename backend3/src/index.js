import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import rutasAutenticacion from './rutas/rutasAutenticacion.js'; // Importas las rutas modulares
import productoRutas from './rutas/productosRutas.js'; // 1. IMPORTAS TU NUEVA RUTA DE PRODUCTOS

dotenv.config();
const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// --- ENLACE DE RUTAS MODULARES ---
app.use('/auth', rutasAutenticacion); // Esto monta el endpoint en /auth/login
app.use('/productos', productoRutas); // 2. MONTAS LA RUTA DE PRODUCTOS EN /productos
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Backend de SmartBoutique corriendo en puerto ${port} 🌸`));