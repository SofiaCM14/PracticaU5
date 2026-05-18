import React from 'react';
import { Row, Col, Card, Button, Badge } from 'react-bootstrap';

const VendedorDashboard = () => {
    return (
        <div>
            <Row className="text-center mb-4">
                <Col>
                    <h2 style={{ color: '#e91e63' }} className="fw-bold">Punto de Venta y Piso 🛍️</h2>
                    <p className="text-muted">Módulo de ventas rápidas, atención y consultas prioritarias.</p>
                </Col>
            </Row>

            {/* Alerta de asistencia del probador - Botón de pánico del cliente */}
            <Card className="border-0 shadow-sm mb-4" style={{ backgroundColor: '#fff0f3', borderRadius: '12px' }}>
                <Card.Body className="d-flex align-items-center justify-content-between px-4">
                    <div>
                        <Badge bg="danger" className="p-2 mb-1 animate-pulse">¡ATENCIÓN SOLICITADA!</Badge>
                        <h5 className="fw-bold mb-0">Probador 3 requiere asistencia de talla</h5>
                        <p className="text-muted small mb-0">El cliente solicita: Vestido Rosa Pastel en Talla M.</p>
                    </div>
                    <Button variant="danger" className="fw-bold shadow-sm" style={{ borderRadius: '20px' }}>
                        Atender Probador 🏃‍♂️
                    </Button>
                </Card.Body>
            </Card>

            <Row className="g-4">
                <Col md={6}>
                    <Card className="h-100 border-0 shadow-sm text-center py-4" style={{ borderRadius: '12px', borderLeft: '5px solid #28a745' }}>
                        <Card.Body>
                            <div style={{ fontSize: '3rem' }}>🛒</div>
                            <Card.Title className="fw-bold mt-2">Nueva Venta (POS)</Card.Title>
                            <Card.Text className="text-muted">Escanear código de barras, registrar prendas y procesar cobros.</Card.Text>
                            <Button variant="success" className="w-100 fw-bold py-2 mt-2">Abrir Caja / Vender</Button>
                        </Card.Body>
                    </Card>
                </Col>
                
                <Col md={6}>
                    <Card className="h-100 border-0 shadow-sm text-center py-4" style={{ borderRadius: '12px' }}>
                        <Card.Body>
                            <div style={{ fontSize: '3rem' }}>🔍</div>
                            <Card.Title className="fw-bold mt-2">Consulta de Disponibilidad</Card.Title>
                            <Card.Text className="text-muted">Buscar de inmediato si hay stock de una prenda en bodega u otra sucursal.</Card.Text>
                            <Button style={{ backgroundColor: '#ff85a2', border: 'none' }} className="w-100 fw-bold py-2 mt-2">Buscar Prenda</Button>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={4}>
                    <Card className="border-0 shadow-sm text-center" style={{ borderRadius: '12px' }}>
                        <Card.Body>
                            <div style={{ fontSize: '2rem' }}>📌</div>
                            <Card.Title className="fw-bold mt-2">Apartado de Prendas</Card.Title>
                            <Button size="sm" variant="outline-secondary" className="w-100 mt-2">Registrar Apartado</Button>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="border-0 shadow-sm text-center" style={{ borderRadius: '12px' }}>
                        <Card.Body>
                            <div style={{ fontSize: '2rem' }}>🏷️</div>
                            <Card.Title className="fw-bold mt-2">Ver Descuentos</Card.Title>
                            <Button size="sm" variant="outline-secondary" className="w-100 mt-2">Consultar Catálogo</Button>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="border-0 shadow-sm text-center" style={{ borderRadius: '12px' }}>
                        <Card.Body>
                            <div style={{ fontSize: '2rem' }}>👤</div>
                            <Card.Title className="fw-bold mt-2">Registro de Clientes</Card.Title>
                            <Button size="sm" variant="outline-secondary" className="w-100 mt-2">Dar de Alta</Button>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default VendedorDashboard;