// backend3/src/rutas/autenticacionRutas.js
import express from 'express';
import { loginUsuario } from '../controladores/autentificacion.js';

const router = express.Router();

router.post('/login', loginUsuario);

export default router;