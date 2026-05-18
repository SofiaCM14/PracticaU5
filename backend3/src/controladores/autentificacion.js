import AWS from 'aws-sdk';
import crypto from 'crypto';
import { pool } from '../config/db.js'; // Tu conexión limpia a RDS

const cognitoClientId = process.env.COGNITO_CLIENT_ID;
const cognitoClientSecret = process.env.COGNITO_CLIENT_SECRET;
const cognito = new AWS.CognitoIdentityServiceProvider();

function buildSecretHash(username) {
  if (!cognitoClientSecret || !cognitoClientId) return undefined;
  return crypto.createHmac('sha256', cognitoClientSecret)
    .update(`${username}${cognitoClientId}`).digest('base64');
}

export const loginUsuario = async (req, res) => {
  if (!cognitoClientId) return res.status(500).json({ error: 'Falta Client ID' });
  const { username, password } = req.body;
  const secretHash = buildSecretHash(username);
  
  try {
    // 1. Validamos con AWS Cognito
    const response = await cognito.initiateAuth({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: cognitoClientId,
      AuthParameters: { 
        USERNAME: username, 
        PASSWORD: password, 
        ...(secretHash ? { SECRET_HASH: secretHash } : {}) 
      }
    }).promise();
    
    // 2. Buscamos el rol en PostgreSQL (Tu tabla de usuarios)
    const dbResult = await pool.query('SELECT rol FROM usuarios WHERE username = $1', [username]);
    const userRow = dbResult.rows[0];
    const userRole = userRow ? userRow.rol : 'cliente'; // Por defecto asigna cliente si no hay rol

    // 3. Devolvemos la respuesta limpia
    res.json({
      sessionData: response.AuthenticationResult,
      username: username,
      role: userRole
    });

  } catch (error) {
    res.status(401).json({ error: error.code, message: error.message });
  }
};