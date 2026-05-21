import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Table, Badge, Form, Alert, Modal } from 'react-bootstrap';

const EncargadoDashboard = () => {
    const [activity, setActivity] = useState([]);
    const [productos, setProductos] = useState([]);
    const [monto, setMonto] = useState('');
    const [msg, setMsg] = useState(null);

    // Modales
    const [showCaja, setShowCaja] = useState(false);
    const [showAlmacen, setShowAlmacen] = useState(false);

    const fetchDatosEncargado = async () => {
        try {
            const response = await fetch('http://34.219.103.28:3000/api/productos/auditoria');
            if (response.ok) setActivity(await response.json());

            const resProd = await fetch('http://34.219.103.28:3000/api/productos');
            if (resProd.ok) setProductos(await resProd.json());
        } catch (error) { console.error(error); }
    };

    useEffect(() => { fetchDatosEncargado(); }, []);

    const handleCajaSubmit = async (tipo) => {
        if (!monto) return alert('Digita el monto de caja chica.');
        try {
            const response = await fetch('http://34.219.103.28:3000/api/productos/caja', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tipo, monto: parseFloat(monto), usuario: 'lesly', rol: 'encargado' })
            });
            if (response.ok) {
                setMsg(`¡Corte de ${tipo} por $${monto} guardado!`);
                setMonto('');
                setShowCaja(false);
                fetchDatosEncargado();
            }
        } catch (error) { console.error(error); }
    };

    const modules = [
        { icon: '📦', title: 'Ingresar Almacén', desc: 'Registro de stock físico entrante y actualización rápida.', action: () => setShowAlmacen(true) },
        { icon: '💵', title: 'Apertura y Cierre de Caja', desc: 'Validación de arqueos de caja del personal y cortes diarios.', action: () => setShowCaja(true) },
        { icon: '🤝', title: 'Autorizar Devoluciones', desc: 'Validación y aprobación de cambios de prendas o reembolsos.', action: () => setShowAlmacen(true) },
        { icon: '📉', title: 'Aplicar Descuentos', desc: 'Visualización de promociones activas autorizadas por gerencia.', action: () => setShowAlmacen(true) },
        { icon: '🚚', title: 'Traspasos entre Sucursales', desc: 'Envío y recepción de prendas hacia otras sucursales.', action: () => setShowAlmacen(true) },
        { icon: '👥', title: 'Asistencia de Personal', desc: 'Monitoreo de entradas, salidas y turnos de los vendedores de piso.', action: () => fetchDatosEncargado() }
    ];

    return (
        <div>
            <Row className="text-center mb-4">
                <Col>
                    <h2 style={{ color: '#c2185b' }} className="fw-bold">Panel Supervisor: Encargado de Tienda 🔑</h2>
                    <p className="text-muted">Gestión operativa, control de inventario local e incidencias en cajas.</p>
                </Col>
            </Row>

            {msg && <Alert variant="success" onClose={() => setMsg(null)} dismissible>{msg}</Alert>}

            <Card className="border-0 shadow-sm mb-5" style={{ borderRadius: '12px' }}>
                <Card.Header className="bg-white fw-bold py-3" style={{ color: '#c2185b', borderBottom: '2px solid #fff5f8' }}>
                    👁️ Vista Cruzada de Movimientos (Sincronizado con Base de Datos RDS)
                </Card.Header>
                <Card.Body>
                    <Table responsive hover className="align-middle mb-0 small">
                        <thead><tr><th>Responsable</th><th>Permiso Usado</th><th>Historial de Acción</th></tr></thead>
                        <tbody>
                            {activity.slice(0, 3).map((log, i) => (
                                <tr key={i}>
                                    <td><b>{log.usuario}</b> <Badge bg="warning text-dark">{log.rol}</Badge></td>
                                    <td><Badge bg="outline-secondary" text="dark" className="border">{log.accion}</Badge></td>
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
                                <Button size="sm" variant="outline-danger" className="w-100 mt-auto fw-bold" onClick={mod.action}>
                                    Acceder Módulo
                                </Button>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* MODAL: CAJA CHICA */}
            <Modal show={showCaja} onHide={() => setShowCaja(false)} centered>
                <Modal.Header closeButton><Modal.Title className="fw-bold" style={{color: '#c2185b'}}>💵 Operación Financiera (movimientos_caja)</Modal.Title></Modal.Header>
                <Modal.Body className="text-center">
                    <Form.Control type="number" placeholder="Monto de la Operación $" className="mb-3 text-center fw-bold" value={monto} onChange={e => setMonto(e.target.value)} />
                    <Row>
                        <Col><Button variant="success" className="w-100 fw-bold" onClick={() => handleCajaSubmit('Apertura')}>Abrir Turno</Button></Col>
                        <Col><Button variant="danger" className="w-100 fw-bold" onClick={() => handleCajaSubmit('Cierre')}>Cerrar Turno</Button></Col>
                    </Row>
                </Modal.Body>
            </Modal>

            {/* MODAL: CONSULTAR ALMACÉN / DESCUENTOS / TRASPASOS */}
            <Modal show={showAlmacen} onHide={() => setShowAlmacen(false)} size="lg" centered>
                <Modal.Header closeButton><Modal.Title className="fw-bold">📦 Stock General Local (Tabla: productos)</Modal.Title></Modal.Header>
                <Modal.Body>
                    <Table responsive hover size="sm" className="small text-center">
                        <thead><tr><th>Prenda</th><th>Talla</th><th>Precio</th><th>Disponibilidad</th></tr></thead>
                        <tbody>
                            {productos.map((p, i) => (
                                <tr key={i}><td><b>{p.nombre}</b></td><td><Badge bg="dark">{p.talla}</Badge></td><td className="fw-bold">${p.precio}</td><td><Badge bg={p.stock > 0 ? 'success' : 'danger'}>{p.stock} u.</Badge></td></tr>
                            ))}
                        </tbody>
                    </Table>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default EncargadoDashboard;