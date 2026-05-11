import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Navbar } from 'react-bootstrap';
import { signOut } from 'aws-amplify/auth';

const Home = () => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await signOut();
            navigate('/login');
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    };

    // Estilos personalizados rápidos
    const styles = {
        mainBg: {
            backgroundColor: '#fff5f8', // Rosa muy tenue de fondo
            minHeight: '100vh',
            paddingBottom: '50px'
        },
        navbar: {
            backgroundColor: '#ff85a2', // Rosa fuerte para la barra
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        },
        pinkButton: {
            backgroundColor: '#ff85a2',
            border: 'none',
            padding: '10px 20px'
        },
        cardHeader: {
            backgroundColor: '#fce4ec', // Rosa pastel
            color: '#c2185b', // Texto vino/rosa oscuro
            fontWeight: 'bold',
            fontSize: '1.5rem',
            textAlign: 'center'
        }
    };

    return (
        <div style={styles.mainBg}>
            {/* Barra de Navegación Estilizada */}
            <Navbar style={styles.navbar} className="px-4 mb-5" variant="dark">
                <Navbar.Brand className="fw-bold" style={{fontSize: '1.8rem'}}>
                    ✨ SmartBoutique
                </Navbar.Brand>
                <Button 
                    variant="light" 
                    className="ms-auto fw-bold text-danger" 
                    onClick={handleLogout}
                    style={{borderRadius: '20px'}}
                >
                    Cerrar Sesión
                </Button>
            </Navbar>

            <Container>
                <Row className="justify-content-center">
                    <Col md={10}>
                        <Card className="shadow-lg border-0" style={{borderRadius: '15px overflow-hidden'}}>
                            {/* Card Header con el Nombre del Proyecto */}
                            <Card.Header style={styles.cardHeader} className="py-4">
                                Bienvenida a SmartBoutique 🌸
                            </Card.Header>
                            
                            <Card.Body className="p-5">
                                <Row className="text-center mb-5">
                                    <Col>
                                        <h2 style={{color: '#ad1457'}}>Panel de Administración</h2>
                                        <p className="text-muted">Gestiona tu inventario y ventas con estilo</p>
                                    </Col>
                                </Row>

                                <Row className="g-4">
                                    {/* Inventario */}
                                    <Col md={4}>
                                        <Card className="h-100 border-0 shadow-sm text-center card-hover">
                                            <Card.Body>
                                                <div style={{fontSize: '3rem'}}>👗</div>
                                                <Card.Title className="fw-bold mt-3">Inventario</Card.Title>
                                                <Card.Text className="text-muted">Control de prendas, tallas y stock disponible.</Card.Text>
                                                <Button style={styles.pinkButton} className="w-100 mt-2 shadow-sm">
                                                    Ver Catálogo
                                                </Button>
                                            </Card.Body>
                                        </Card>
                                    </Col>

                                    {/* Ventas */}
                                    <Col md={4}>
                                        <Card className="h-100 border-0 shadow-sm text-center">
                                            <Card.Body>
                                                <div style={{fontSize: '3rem'}}>🛍️</div>
                                                <Card.Title className="fw-bold mt-3">Punto de Venta</Card.Title>
                                                <Card.Text className="text-muted">Realiza ventas rápidas y genera tickets.</Card.Text>
                                                <Button variant="success" className="w-100 mt-2 shadow-sm" style={{padding: '10px'}}>
                                                    Nueva Venta
                                                </Button>
                                            </Card.Body>
                                        </Card>
                                    </Col>

                                    {/* Reportes */}
                                    <Col md={4}>
                                        <Card className="h-100 border-0 shadow-sm text-center">
                                            <Card.Body>
                                                <div style={{fontSize: '3rem'}}>📊</div>
                                                <Card.Title className="fw-bold mt-3">Análisis</Card.Title>
                                                <Card.Text className="text-muted">Estadísticas de tus prendas más vendidas.</Card.Text>
                                                <Button variant="info" className="w-100 mt-2 text-white shadow-sm" style={{padding: '10px'}}>
                                                    Ver Reportes
                                                </Button>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default Home;