import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Table, Badge, Alert, Modal } from 'react-bootstrap';

const VendedorDashboard = () => {
    const [productos, setProductos] = useState([]);
    const [asistencias, setAsistencias] = useState([]);
    const [carrito, setCarrito] = useState([]);
    const [showPOS, setShowPOS] = useState(false);
    const [msg, setMsg] = useState(null);

    const sincronizarVendedor = async () => {
        try {
            const resProd = await fetch('http://34.219.103.28:3000/api/productos');
            if (resProd.ok) setProductos(await resProd.json());
            const resAsis = await fetch('http://34.219.103.28:3000/api/productos/asistencia');
            if (resAsis.ok) setAsistencias(await resAsis.json());
        } catch (e) { console.error(e); }
    };

    useEffect(() => { sincronizarVendedor(); }, []);

    const cobrarTicket = async () => {
        const total = carrito.reduce((sum, item) => sum + item.precio, 0);
        try {
            const res = await fetch('http://34.219.103.28:3000/api/productos/venta', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ total, items: carrito, usuario: 'sherlyn', rol: 'vendedor' })
            });
            if (res.ok) {
                setMsg('🛍️ ¡Venta cobrada! Stock descontado de la base de datos.');
                setCarrito([]);
                setShowPOS(false);
                sincronizarVendedor();
            }
        } catch (e) { console.error(e); }
    };

    const modules = [
        { icon: '🛒', title: 'Nueva Venta (POS)', desc: 'Abrir terminal de cobro con escáner e impresión de ticket.', action: () => setShowPOS(true) },
        { icon: '🏷️', title: 'Ver Promociones', desc: 'Validación de códigos de descuento activos en piso de venta.', action: () => alert('Ninguna oferta local pendiente.') },
        { icon: '📦', title: 'Consultar Stock', desc: 'Buscador rápido de prendas, tallas y existencias para clientes.', action: () => setShowPOS(true) }
    ];

    return (
        <div>
            <Row className="text-center mb-4"><Col><h2 style={{ color: '#e91e63' }} className="fw-bold">Panel de Piso de Venta: Asesor 🛍️</h2></Col></Row>
            
            {msg && <Alert variant="success" dismissible>{msg}</Alert>}
            
            {asistencias.map((as, i) => (
                <Alert variant="danger" key={i} className="d-flex justify-content-between align-items-center shadow-sm">
                    <div>🚨 <b>Llamada de Probador {as.probador}:</b> "{as.detalle}"</div>
                    <Button size="sm" variant="danger" onClick={() => setAsistencias([])}>Atendido</Button>
                </Alert>
            ))}

            <Row className="g-4 mb-4">
                {modules.map((m, i) => (
                    <Col md={4} key={i}>
                        <Card className="h-100 border-0 shadow-sm text-center py-2" style={{ borderRadius: '12px' }}>
                            <Card.Body className="d-flex flex-column">
                                <div style={{ fontSize: '2.5rem' }}>{m.icon}</div>
                                <Card.Title className="fw-bold mt-2">{m.title}</Card.Title>
                                <Card.Text className="text-muted small flex-grow-1">{m.desc}</Card.Text>
                                <Button size="sm" variant="outline-dark" className="w-100 mt-auto fw-bold" onClick={m.action}>Abrir Módulo</Button>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* MODAL: CAJA REGISTRADORA POS INTERACTIVA */}
            <Modal show={showPOS} onHide={() => setShowPOS(false)} size="lg" centered>
                <Modal.Header closeButton><Modal.Title className="fw-bold">🛒 Terminal de Cobro (ventas & detalle_ventas)</Modal.Title></Modal.Header>
                <Modal.Body>
                    <Row>
                        <Col md={7}>
                            <h6 className="fw-bold text-secondary">Inventario Real en Nube (RDS)</h6>
                            <Table responsive size="sm" className="small">
                                <thead><tr><th>Prenda</th><th>Precio</th><th>Stock</th><th>Acción</th></tr></thead>
                                <tbody>
                                    {productos.map((p, i) => (
                                        <tr key={i}><td>{p.nombre} ({p.talla})</td><td>${p.precio}</td><td><b>{p.stock} pz</b></td>
                                            <td><Button size="sm" variant="success" onClick={() => setCarrito([...carrito, { producto_id: p.id, nombre: p.nombre, precio: parseFloat(p.precio), cantidad: 1 }])}>+ Añadir</Button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Col>
                        <Col md={5} className="bg-light p-3 rounded">
                            <h6 className="fw-bold">Artículos del Ticket</h6>
                            {carrito.map((c, i) => <div key={i} className="small border-bottom py-1">1x {c.nombre} - ${c.price || c.precio}</div>)}
                            <h5 className="fw-bold mt-3 text-end">Total: ${carrito.reduce((s, item) => s + item.precio, 0).toFixed(2)}</h5>
                            <Button variant="danger" className="w-100 fw-bold mt-2" onClick={cobrarTicket} disabled={carrito.length === 0}>Cobrar e Imprimir Ticket</Button>
                        </Col>
                    </Row>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default VendedorDashboard;