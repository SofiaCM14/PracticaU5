import React from 'react';
import { Row, Col, Card, Button } from 'react-bootstrap';

const AdminDashboard = () => {
    const modules = [
        { icon: '👗', title: 'Inventario Completo', desc: 'Control total de prendas, stock, tallas y alertas de escasez.' },
        { icon: '💰', title: 'Actualizar Precios', desc: 'Modificación global o selectiva de costos y márgenes de ganancia.' },
        { icon: '🏷️', title: 'Gestión de Descuentos', desc: 'Crear, visualizar, modificar y aplicar campañas de ofertas.' },
        { icon: '👥', title: 'Control de Usuarios', desc: 'Altas, bajas y asignación de roles para el personal de la boutique.' },
        { icon: '📈', title: 'Estadísticas e Inteligencia', desc: 'Gráficas de ventas, reportes financieros y prendas más vendidas.' },
        { icon: '🚛', title: 'Recepción de Mercancía', desc: 'Entrada de producto de proveedores y actualización de almacén.' },
        { icon: '🔄', title: 'Devoluciones y Mermas', desc: 'Historial de pérdidas, prendas dañadas y cancelaciones aprobadas.' },
        { icon: '📝', title: 'Historial de Auditoría', desc: 'Registro de movimientos críticos del sistema (quién modificó qué).' },
        { icon: '⚙️', title: 'Configuración de Tienda', desc: 'Ajustes globales del Punto de Venta, sucursales y tickets.' },
    ];

    return (
        <div>
            <Row className="text-center mb-4">
                <Col>
                    <h2 style={{ color: '#ad1457' }} className="fw-bold">Panel de Control: Gerente Administrador 👑</h2>
                    <p className="text-muted">Acceso total a la infraestructura analítica, operativa y financiera de SmartBoutique</p>
                </Col>
            </Row>
            <Row className="g-4">
                {modules.map((mod, index) => (
                    <Col md={4} key={index}>
                        <Card className="h-100 border-0 shadow-sm text-center py-2" style={{ borderRadius: '12px' }}>
                            <Card.Body>
                                <div style={{ fontSize: '2.5rem' }}>{mod.icon}</div>
                                <Card.Title className="fw-bold mt-2">{mod.title}</Card.Title>
                                <Card.Text className="text-muted small">{mod.desc}</Card.Text>
                                <Button size="sm" style={{ backgroundColor: '#ff85a2', border: 'none' }} className="w-100 shadow-sm mt-auto">
                                    Gestionar
                                </Button>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>
        </div>
    );
};

export default AdminDashboard;