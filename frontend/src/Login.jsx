import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Alert, Card, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [user, setUser] = useState('');
    const [pass, setPass] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState('');
    const [entrnado, setEntrando] = useState(false);
    const navigate = useNavigate();

    const styles = {
        mainBg: { backgroundColor: '#fff5f8', minHeight: '100vh', display: 'flex', alignItems: 'center' },
        cardHeader: { backgroundColor: '#fce4ec', color: '#c2185b', fontWeight: 'bold', textAlign: 'center', fontSize: '1.5rem', borderBottom: 'none' },
        pinkButton: { backgroundColor: '#ff85a2', border: 'none', fontWeight: 'bold' }
    };

    // Verificar si ya hay una sesión y un rol guardados localmente
    useEffect(() => {
        const userRole = localStorage.getItem('userRole');
        if (userRole) {
            navigate('/home');
        }
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user || !pass) {
            setError('Por favor, llena todos los campos.');
            return;
        }
        setError('');
        setEntrando(true);

        try {
            // 🚀 MODIFICACIÓN: Petición a tu API REST en la instancia EC2
            // Cambia 'localhost:3000' por tu IP pública de EC2 si ya está desplegado
            const response = await fetch('http://34.219.103.28:3000/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username: user, password: pass })
            });

            const data = await response.json();
            console.log("👉 ESTO RESPONDIÓ EL BACKEND DE AWS:", data);

            if (!response.ok) {
                // Mapeo manual de errores típicos de Cognito que regresa tu backend
                if (data.error === 'NotAuthorizedException') throw new Error('Usuario o contraseña incorrectos.');
                if (data.error === 'UserNotFoundException') throw new Error('El usuario no existe.');
                throw new Error(data.message || 'Error al conectar con el servidor.');
            }

            // 💾 GUARDAR LA DATA QUE ENVIÓ TU NUEVO CONTROLADOR MODULAR
            localStorage.setItem('token', data.sessionData.IdToken); 
            localStorage.setItem('username', data.username);
            localStorage.setItem('userRole', data.role); // <-- Aquí se guarda 'admin', 'vendedor', 'cliente', etc.

            // 🧭 Redirección exitosa
            navigate('/home');

        } catch (err) {
            setError(err.message);
        } finally {
            setEntrando(false);
        }
    };

    return (
        <div style={styles.mainBg}>
            <Container>
                <Row className="justify-content-center">
                    <Col md={5} lg={4}>
                        <Card className="shadow-lg border-0" style={{ borderRadius: '15px' }}>
                            <Card.Header style={styles.cardHeader} className="py-4">
                                ✨ SmartBoutique
                            </Card.Header>
                            <Card.Body className="p-4">
                                <h4 className="text-center mb-4" style={{ color: '#ad1457' }}>Bienvenida</h4>
                                {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}
                                <Form onSubmit={handleSubmit}>
                                    <Form.Group className="mb-3">
                                        <Form.Label className="fw-bold" style={{ color: '#c2185b' }}>Usuario</Form.Label>
                                        <Form.Control 
                                            type="text" 
                                            value={user}
                                            onChange={(e) => setUser(e.target.value)}
                                            style={{ borderRadius: '10px' }}
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-4">
                                        <Form.Label className="fw-bold" style={{ color: '#c2185b' }}>Contraseña</Form.Label>
                                        <InputGroup>
                                            <Form.Control 
                                                type={showPass ? "text" : "password"} 
                                                value={pass}
                                                onChange={(e) => setPass(e.target.value)}
                                                style={{ borderRadius: '10px 0 0 10px', borderRight: 'none' }}
                                            />
                                            <Button 
                                                variant="outline-secondary" 
                                                onClick={() => setShowPass(!showPass)}
                                                style={{ borderRadius: '0 10px 10px 0', backgroundColor: 'white', borderLeft: 'none', borderColor: '#ced4da' }}
                                            >
                                                {showPass ? '👁️' : '🙈'}
                                            </Button>
                                        </InputGroup>
                                    </Form.Group>

                                    <Button style={styles.pinkButton} type="submit" className="w-100 py-2 shadow-sm" disabled={entrnado}>
                                        {entrnado ? 'Entrando...' : 'Entrar'}
                                    </Button>
                                </Form>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default Login;