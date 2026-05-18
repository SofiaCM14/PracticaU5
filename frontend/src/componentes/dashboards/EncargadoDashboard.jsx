import React from 'react';
import { Row, Col, Card, Button } from 'react-bootstrap';

const EncargadoDashboard = () => {
    const modules = [
        { icon: '📦', title: 'Ingresar Almacén', desc: 'Registro de stock físico entrante y actualización rápida.' },
        { icon: '💵', title: 'Apertura y Cierre de Caja', desc: 'Validación de arqueos de caja del personal y cortes diarios.' },
        { icon: '🤝', title: 'Autorizar Devoluciones', desc: 'Validación y aprobación de cambios de prendas o reembolsos.' },
        { icon: '📉', title: 'Aplicar Descuentos', desc: 'Visualización de promociones activas autorizadas por gerencia.' },
        { icon: '🚚', title: 'Traspasos entre Sucursales', desc: 'Envío y recepción de prendas hacia otras sucursales.' },
        { icon: '👥', title: 'Asistencia de Personal', desc: 'Monitoreo de entradas, salidas y turnos de los vendedores de piso.' }
    ];

    return (
        <div>
            <Row className="text-center mb-4">
                <Col>
                    <h2 style={{ color: '#c2185b' }} className="fw-bold">Panel Supervisor: Encargado de Tienda 🔑</h2>
                    <p className="text-muted">Gestión operativa, control de inventario local e incidencias en cajas.</p>
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
                                <Button size="sm" variant="outline-danger" className="w-100 mt-2">
                                    Acceder Módulo
                                </Button>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>
        </div>
    );
};

export default EncargadoDashboard;