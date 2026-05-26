import express from 'express';
import 'dotenv/config'; // 🌟 ¡ESTA ES LA CLAVE! Carga e inicializa el .env antes que todo lo demás
import cors from 'cors';
import rutasAutenticacion from './src/rutas/rutasAutenticacion.js'; 
import productoRutas from './src/rutas/productosRutas.js'; 

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 🚀 CONFIGURACIÓN DE CAPACIDAD EXTENDIDA PARA ENVIAR BASE64
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- ENLACE DE RUTAS MODULARES ---
app.use('/auth', rutasAutenticacion); 
app.use(['/api/productos', '/api/productos/'], productoRutas);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Backend de SmartBoutique corriendo en puerto ${port} 🌸`));