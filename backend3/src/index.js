import express from 'express';
import dotenv from 'dotenv';
import pkg from 'pg';
import AWS from 'aws-sdk';
import crypto from 'crypto';
import cors from 'cors'; // Cambiado de require a import para consistencia
import { createRemoteJWKSet, jwtVerify } from 'jose';

const { Pool } = pkg;
dotenv.config();

const app = express();

// --- CONFIGURACIÓN DE CORS ---
app.use(cors({
  origin: '*', // Permite peticiones desde cualquier origen (Frontend en puerto 80)
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Configuración de Cognito y DB (Se mantiene igual)
const cognitoRegion = process.env.COGNITO_REGION || process.env.AWS_REGION;
const cognitoUserPoolId = process.env.COGNITO_USER_POOL_ID;
const cognitoClientId = process.env.COGNITO_CLIENT_ID;
const cognitoClientSecret = process.env.COGNITO_CLIENT_SECRET;

if (cognitoRegion) {
  AWS.config.update({ region: cognitoRegion });
}

const cognito = new AWS.CognitoIdentityServiceProvider();

const cognitoIssuer = cognitoRegion && cognitoUserPoolId
  ? `https://cognito-idp.${cognitoRegion}.amazonaws.com/${cognitoUserPoolId}`
  : null;

const jwks = cognitoIssuer
  ? createRemoteJWKSet(new URL(`${cognitoIssuer}/.well-known/jwks.json`))
  : null;

// Funciones auxiliares y Middlewares (Se mantienen igual)
function buildSecretHash(username) {
  if (!cognitoClientSecret || !cognitoClientId) return undefined;
  return crypto.createHmac('sha256', cognitoClientSecret)
    .update(`${username}${cognitoClientId}`).digest('base64');
}

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false }
});

async function verifyCognitoToken(req, res, next) {
  if (!cognitoIssuer || !jwks) {
    return res.status(500).json({ error: 'Cognito no configurado' });
  }
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Falta token' });
  const token = authHeader.slice(7).trim();
  try {
    const { payload } = await jwtVerify(token, jwks, { issuer: cognitoIssuer });
    req.user = payload;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token invalido' });
  }
}

// Rutas (Mantenemos tus endpoints)
app.get('/public', (req, res) => res.json({ message: 'Endpoint publico activo' }));

app.get('/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM productos'); 
    res.json(result.rows);
  } catch (err) {
    console.error("Error en BD:", err);
    res.status(500).json({ error: 'Error al conectar con la base de datos' });
  }
});

app.post('/auth/login', async (req, res) => {
  if (!cognitoClientId) return res.status(500).json({ error: 'Falta Client ID' });
  const { username, password } = req.body;
  const secretHash = buildSecretHash(username);
  try {
    const response = await cognito.initiateAuth({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: cognitoClientId,
      AuthParameters: { USERNAME: username, PASSWORD: password, ...(secretHash ? { SECRET_HASH: secretHash } : {}) }
    }).promise();
    res.json(response.AuthenticationResult);
  } catch (error) {
    res.status(401).json({ error: error.code, message: error.message });
  }
});

// Inicio del servidor
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Backend corriendo en puerto ${port}`));