import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Table, Badge } from 'react-bootstrap';

const EncargadoDashboard = () => {
    const [sharedActivity, setSharedActivity] = useState([]);

    // EL ENCARGADO CONECTADO A LA MISMA TABLA AUDITORIA
    // Aquí ve exactamente lo que hizo el Gerente en tiempo real
    useEffect(() => {
        const fetchSharedLogs = async () => {
            try {
                // Consume exactamente la misma API que el administrador
                // fetch('/api/auditoria')
                const dataSimulada = [
                    { id: 102, usuario: 'sofia_testo', rol: 'gerente', accion: 'Recepcion Mercancia', detalle: '50 unidades - Blusa Satín Rosa', fecha: '2026-05-19 10:15' },
                    { id: 101, usuario: 'lesly', rol: 'encargado', accion: 'Actualizacion Producto', detalle: 'Modificación de Stock - Blazer Beige', fecha: '2026-05-19 09:30' }
                ];
                setSharedActivity(dataSimulada);
            } catch (error) {
                console.error("Error sincronizando logs para encargado:", error);
            }
        };
        fetchSharedLogs();
    }, []);

    const modules = [
        { icon: '📦', title: 'Ingresar Almacén / Productos', desc: 'Sincronizado con inventario general. Alta operativa de stock.', table: 'productos', mode: 'Lectura/Escritura Operativa' },
        { icon: '🚛', title: 'Recibir Mercancía', desc: 'Consulta y validación de lotes enviados por proveedores o gerencia.', table: 'productos', mode: 'Sincronizado con Gerente' },
        { icon: '🤝', title: 'Autorizar Devoluciones', desc: 'Aprobación local en cajas sincronizada con el histórico de ventas.', table: 'ventas', mode: 'Escritura de Incidencias' },
        { icon: '📉', title: 'Aplicar Descuentos', desc: 'Visualización y activación de promociones vigentes dadas de alta por el Gerente.', table: 'productos', mode: 'Sólo Aplicación (Lectura)' },
        { icon: '💵', title: 'Apertura y Cierre de Caja', desc: 'Validación de arqueos de caja del personal y cortes diarios.', table: 'movimientos_caja', mode: 'Control Local' },
        { icon: '🚚', title: 'Traspasos entre Sucursales', desc: 'Envío y recepción de prendas hacia otras ubicaciones físicas.', table: 'productos', mode: 'Tránsito de stock' },
        { icon: '👥', title: 'Asistencia de Personal', desc: 'Monitoreo de entradas, salidas y turnos de los vendedores de piso.', table: 'usuarios', mode: 'Módulo Local' }
    ];

    return (
        <div>
            <Row className="text-center mb-4">
                <Col>
                    <h2 style={{ color: '#c2185b' }} className="fw-bold">Encargada de Tienda 🔑</h2>
                    <p className="text-muted">Gestión operativa sincronizada con Gerencia General y control de inventario local.</p>
                </Col>
            </Row>

            {/* VISTA COMPARTIDA DE AUDITORÍA: El encargado audita lo que hizo el Gerente */}
            <Card className="border-0 shadow-sm mb-5" style={{ borderRadius: '12px' }}>
                <Card.Header className="bg-white fw-bold py-3" style={{ color: '#c2185b', borderBottom: '2px solid #fff5f8' }}>
                    👁️ Vista Cruzada de Movimientos (Sincronizado con Base de Datos RDS)
                </Card.Header>
                <Card.Body>
                    <p className="small text-muted mb-3">Aquí puedes verificar las acciones de recepción y cambios que el Gerente o tú han realizado sobre las tablas comunes:</p>
                    <Table responsive hover className="align-middle mb-0">
                        <thead className="table-light">
                            <tr>
                                <th>Fecha/Hora</th>
                                <th>Responsable</th>
                                <th>Permiso Usado</th>
                                <th>Historial de Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sharedActivity.map((log) => (
                                <tr key={log.id}>
                                    <td className="small text-muted">{log.fecha}</td>
                                    <td>
                                        <span className="fw-semibold">{log.usuario}</span>{' '}
                                        <Badge bg={log.rol === 'gerente' ? 'danger' : 'warning'} size="sm">{log.rol}</Badge>
                                    </td>
                                    <td><span className="badge bg-outline-secondary text-dark border">{log.accion}</span></td>
                                    <td className="small text-muted">{log.detalle}</td>
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
                                    <div className="text-start mb-2 small text-muted">
                                        🛠️ Tabla: <code className="text-dark fw-bold">{mod.table}</code>
                                        <br />
                                        🔑 Nivel: <span className="text-danger fw-semibold">{mod.mode}</span>
                                    </div>
                                    <Button size="sm" variant="outline-danger" className="w-100">
                                        Acceder y Consultar
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

export default EncargadoDashboard;