import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Alert, Card, InputGroup } from 'react-bootstrap';
import { Amplify } from 'aws-amplify';
import { signIn, getCurrentUser } from 'aws-amplify/auth';
import { useNavigate } from 'react-router-dom';

Amplify.configure({
    Auth: {
        Cognito: {
            userPoolId: 'us-west-2_s4SbDY3Cn',
            userPoolClientId: '4gf18u8svhs3a0042fcdb06q48',
            loginWith: { email: true }
        }
    }
});

const Login = () => {
    const [user, setUser] = useState('');
    const [pass, setPass] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const styles = {
        mainBg: { backgroundColor: '#fff5f8', minHeight: '100vh', display: 'flex', alignItems: 'center' },
        cardHeader: { backgroundColor: '#fce4ec', color: '#c2185b', fontWeight: 'bold', textAlign: 'center', fontSize: '1.5rem', borderBottom: 'none' },
        pinkButton: { backgroundColor: '#ff85a2', border: 'none', fontWeight: 'bold' }
    };

    // Verificar si ya hay sesión activa al cargar
    useEffect(() => {
        const checkUser = async () => {
            try {
                await getCurrentUser();
                navigate('/home');
            } catch (err) { /* No hay usuario, se queda en login */ }
        };
        checkUser();
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user || !pass) {
            setError('Por favor, llena todos los campos.');
            return;
        }
        setError('');
        setLoading(true);

        try {
            const { isSignedIn } = await signIn({ username: user, password: pass });
            if (isSignedIn) {
                navigate('/home');
            }
        } catch (err) {
            if (err.name === 'NotAuthorizedException') setError('Usuario o contraseña incorrectos.');
            else if (err.name === 'UserNotFoundException') setError('El usuario no existe.');
            else setError('Error: ' + err.message);
        } finally {
            setLoading(false);
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

                                    <Button style={styles.pinkButton} type="submit" className="w-100 py-2 shadow-sm" disabled={loading}>
                                        {loading ? 'Entrando...' : 'Entrar'}
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