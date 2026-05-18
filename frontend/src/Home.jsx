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

        // Si no hay token o rol válido, lo pateamos directo al login por seguridad
        if (!storedRole) {
            navigate('/');
        } else {
            // Homologamos los nombres de los roles que vienen de tu RDS PostgreSQL
            // Ajusta los strings si en tu base de datos se llaman diferente (ej: 'Gerente', 'Cliente')
            setRole(storedRole.toLowerCase().trim());
            setUsername(storedUser || 'Usuario');
        }
        setLoading(false);
    }, [navigate]);

    const handleLogout = () => {
        try {
            // Limpieza completa del LocalStorage para cerrar sesión de raíz
            localStorage.clear();
            navigate('/');
        } catch (error) {
            console.error('Error al cerrar sesión local:', error);
        }
    };

    const styles = {
        mainBg: {
            backgroundColor: '#fff5f8', // Rosa muy tenue corporativo
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

            {/* Renderizado condicional inteligente basado en el Rol de la BD */}
            <Container className="bg-white shadow-lg p-5 border-0" style={{ borderRadius: '15px' }}>
                {role === 'admin' && <AdminDashboard />}
                {role === 'gerente' && <AdminDashboard />}
                
                {role === 'encargado' && <EncargadoDashboard />}
                
                {role === 'vendedor' && <VendedorDashboard />}
                
                {role === 'cliente' && <ClienteDashboard />}
                
                {/* Fallback en caso de que un rol no coincida exactamente */}
                {!['admin', 'gerente', 'encargado', 'vendedor', 'cliente'].includes(role) && (
                    <div className="text-center py-5">
                        <h3>⚠️ Rol no reconocido</h3>
                        <p className="text-muted">Tu usuario está autenticado pero no tiene asignado un rol válido en el sistema distribuido.</p>
                    </div>
                )}
            </Container>
        </div>
    );
};

export default Home;