import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Table, Badge } from 'react-bootstrap';

const AdminDashboard = () => {
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);

    // Carga los registros de la tabla 'auditoria' compartida en tiempo real
    useEffect(() => {
        const fetchAuditoria = async () => {
            try {
                // Aquí irá tu endpoint real: fetch('/api/auditoria')
                // Simulamos la lectura directa de la base de datos RDS:
                const dataSimulada = [
                    { id: 102, usuario: 'sofia_testo', rol: 'gerente', accion: 'Recepcion Mercancia', detalle: '50 unidades - Blusa Satín Rosa', fecha: '2026-05-19 10:15' },
                    { id: 101, usuario: 'lesly', rol: 'encargado', accion: 'Actualizacion Producto', detalle: 'Modificación de Stock - Blazer Beige', fecha: '2026-05-19 09:30' }
                ];
                setRecentActivity(dataSimulada);
            } catch (error) {
                console.error("Error leyendo tabla auditoria:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAuditoria();
    }, []);

    const modules = [
        { icon: '👗', title: 'Inventario Completo', desc: 'Control total de prendas, stock, tallas y alertas de escasez.', table: 'productos', action: 'write' },
        { icon: '💰', title: 'Actualizar Precios', desc: 'Modificación global o selectiva de costos y márgenes de ganancia.', table: 'productos', action: 'write' },
        { icon: '🏷️', title: 'Gestión de Descuentos', desc: 'Crear, visualizar, modificar y aplicar campañas de ofertas.', table: 'productos', action: 'write' },
        { icon: '👥', title: 'Control de Usuarios', desc: 'Altas, bajas y asignación de roles para el personal de la boutique.', table: 'usuarios', action: 'write' },
        { icon: '📈', title: 'Estadísticas e Inteligencia', desc: 'Gráficas de ventas, reportes financieros y prendas más vendidas.', table: 'ventas', action: 'read' },
        { icon: '🚛', title: 'Recepción de Mercancía', desc: 'Entrada de producto de proveedores y actualización de almacén.', table: 'productos', action: 'write' },
        { icon: '🔄', title: 'Devoluciones y Mermas', desc: 'Historial de pérdidas, prendas dañadas y cancelaciones aprobadas.', table: 'ventas', action: 'write' },
        { icon: '📝', title: 'Historial de Auditoría', desc: 'Registro de movimientos críticos del sistema (quién modificó qué).', table: 'auditoria', action: 'read' },
        { icon: '⚙️', title: 'Configuración de Tienda', desc: 'Ajustes globales del Punto de Venta, sucursales y tickets.', table: 'config', action: 'write' }
    ];

    return (
        <div>
            <Row className="text-center mb-4">
                <Col>
                    <h2 style={{ color: '#ad1457' }} className="fw-bold">Panel de Control: Gerente Administrador 👑</h2>
                    <p className="text-muted">Acceso total a la infraestructura analítica, operativa y financiera de SmartBoutique</p>
                </Col>
            </Row>

            {/* MONITOR EN TIEMPO REAL DE LA TABLA AUDITORIA */}
            <Card className="border-0 shadow-sm mb-5" style={{ borderRadius: '12px' }}>
                <Card.Header className="bg-white fw-bold py-3" style={{ color: '#ad1457', borderBottom: '2px solid #fff5f8' }}>
                    📡 Actividad Reciente del Sistema (Tabla: auditoria)
                </Card.Header>
                <Card.Body>
                    <Table responsive hover className="align-middle mb-0">
                        <thead className="table-light">
                            <tr>
                                <th>Fecha/Hora</th>
                                <th>Usuario</th>
                                <th>Rol</th>
                                <th>Acción Realizada</th>
                                <th>Detalle del Movimiento</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentActivity.map((log) => (
                                <tr key={log.id}>
                                    <td className="small text-muted">{log.fecha}</td>
                                    <td className="fw-bold">{log.usuario}</td>
                                    <td>
                                        <Badge bg={log.rol === 'gerente' ? 'danger' : 'warning'}>{log.rol}</Badge>
                                    </td>
                                    <td><span className="badge bg-light text-dark">{log.accion}</span></td>
                                    <td className="small">{log.body || log.detalle}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

            <Row className="g-4">
                {modules.map((mod, index) => (
                    <Col md={4} key={index}>
                        <Card className="h-100 border-0 shadow-sm text-center py-2" style={{ borderRadius: '12px' }}>
                            <Card.Body className="d-flex flex-column">
                                <div style={{ fontSize: '2.5rem' }}>{mod.icon}</div>
                                <Card.Title className="fw-bold mt-2">{mod.title}</Card.Title>
                                <Card.Text className="text-muted small flex-grow-1">{mod.desc}</Card.Text>
                                <div className="mt-3">
                                    <span className="d-block text-start mb-2 badge bg-light text-dark small">🎯 Afecta tabla: <b>{mod.table}</b></span>
                                    <Button size="sm" style={{ backgroundColor: '#ff85a2', border: 'none' }} className="w-100 shadow-sm">
                                        Modificar / Gestionar
                                    </Button>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>
        </div>
    );
};

export default AdminDashboard;