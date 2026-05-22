import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Button, Navbar, Spinner } from 'react-bootstrap';

// Importamos los tableros específicos creados de forma modular
import AdminDashboard from './componentes/dashboards/AdminDashboard';
import EncargadoDashboard from './componentes/dashboards/EncargadoDashboard';
import VendedorDashboard from './componentes/dashboards/VendedorDashboard';
import ClienteDashboard from './componentes/dashboards/ClienteDashboard';

const Home = () => {
    const navigate = useNavigate();
    const [role, setRole] = useState(null);
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Obtenemos las variables de sesión del LocalStorage
        const storedRole = localStorage.getItem('userRole');
        const storedUser = localStorage.getItem('username');

        if (!storedRole) {
            navigate('/');
        } else {
            setRole(storedRole.toLowerCase().trim());
            setUsername(storedUser || 'Usuario');
        }
        setLoading(false);
    }, [navigate]);

    const handleLogout = () => {
        try {
            localStorage.clear();
            navigate('/');
        } catch (error) {
            console.error('Error al cerrar sesión local:', error);
        }
    };

    const styles = {
        mainBg: {
            backgroundColor: '#fff5f8', // Rosa muy tenue corporativo de fondo general
            minHeight: '100vh',
            paddingBottom: '50px'
        },
        navbar: {
            backgroundColor: '#ff85a2', // Rosa fuerte del branding
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh', backgroundColor: '#fff5f8' }}>
                <Spinner animation="border" variant="danger" />
            </div>
        );
    }

    return (
        <div style={styles.mainBg}>
            {/* Navbar compartido por toda la infraestructura */}
            <Navbar style={styles.navbar} className="px-4 mb-4" variant="dark">
                <Navbar.Brand className="fw-bold" style={{ fontSize: '1.6rem' }}>
                    ✨ SmartBoutique
                </Navbar.Brand>
                <Navbar.Collapse className="justify-content-end">
                    <Navbar.Text className="text-white me-3 fw-semibold">
                        Hola, <span className="text-decoration-underline">{username}</span> 🌸
                    </Navbar.Text>
                    <Button 
                        variant="light" 
                        className="fw-bold text-danger btn-sm" 
                        onClick={handleLogout}
                        style={{ borderRadius: '20px', padding: '5px 15px' }}
                    >
                        Cerrar Sesión
                    </Button>
                </Navbar.Collapse>
            </Navbar>

            {/* 🛠️ CONTENEDOR PADRE MODIFICADO CON PASO DE PROPS DE SESIÓN EN TIEMPO REAL 🛠️ */}
            <Container fluid className="px-4">
                {role === 'admin' && <AdminDashboard usuarioActivo={username} rolActivo={role} />}
                
                {role === 'encargado' && <EncargadoDashboard />}
                
                {role === 'vendedor' && <VendedorDashboard />}
                
                {role === 'cliente' && <ClienteDashboard />}
                
                {/* Fallback de seguridad por si acaso */}
                {!['admin', 'encargado', 'vendedor', 'cliente'].includes(role) && (
                    <div className="text-center py-5 bg-white rounded shadow-sm">
                        <h3>⚠️ Acceso Restringido</h3>
                        <p className="text-muted">Tu rol (<code>{role}</code>) no cuenta con una interfaz modular asignada.</p>
                    </div>
                )}
            </Container>
        </div>
    );
};

export default Home;