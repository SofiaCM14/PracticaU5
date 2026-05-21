import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Form, Alert, Table, Badge, Modal } from 'react-bootstrap';

const ClienteDashboard = () => {
    const [productos, setProductos] = useState([]);
    const [probador, setProbador] = useState('1');
    const [detalle, setDetalle] = useState('Necesito una talla M del pantalón negro');
    const [statusMsg, setStatusMsg] = useState(null);
    const [showCatalogo, setShowCatalogo] = useState(false);

    useEffect(() => {
        fetch('http://34.219.103.28:3000/api/productos')
            .then(res => res.json())
            .then(data => setProductos(data))
            .catch(e => console.error(e));
    }, []);

    const mandarAlerta = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('http://34.219.103.28:3000/api/productos/asistencia', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ probador, detalle })
            });
            if (res.ok) setStatusMsg('🛎️ ¡Llamada enviada al staff! Tu asesor va en camino.');
        } catch (e) { console.error(e); }
    };

    const guardarDeseo = async (pid, nombre) => {
        try {
            const res = await fetch('http://34.219.103.28:3000/api/productos/wishlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usuario_id: 4, producto_id: pid })
            });
            if (res.ok) setStatusMsg(`❤️ ¡"${nombre}" guardada en tu tabla carrito_deseos!`);
        } catch (e) { console.error(e); }
    };

    const modules = [
        { icon: '✨', title: 'Ver Catálogo Completo', desc: 'Explora toda la colección de temporada disponible en tienda física.', action: () => setShowCatalogo(true) },
        { icon: '🛎️', title: 'Llamar a un Asesor', desc: '¿Necesitas otra talla o color? Presiona para pedir ayuda al probador.', action: () => alert('Usa el formulario del panel izquierdo.') },
        { icon: '❤️', title: 'Mi Carrito de Deseos', desc: 'Tus prendas guardadas y listas para la decisión final de compra.', action: () => setShowCatalogo(true) }
    ];

    return (
        <div>
            <Row className="text-center mb-4"><Col><h2 style={{ color: '#ad1457' }} className="fw-bold">✨ Mi Espacio de Tendencia Premium ✨</h2></Col></Row>
            
            {statusMsg && <Alert variant="success" onClose={() => setStatusMsg(null)} dismissible>{statusMsg}</Alert>}
            
            <Row>
                {/* FORMULARIO ASISTENCIA PROBADORES */}
                <Col md={5} className="mb-4">
                    <Card className="p-4 border-0 shadow-sm text-white h-100" style={{ backgroundColor: '#ff5c8a', borderRadius: '15px' }}>
                        <h4 className="fw-bold">🛎️ Botón de Asistencia</h4>
                        <Form onSubmit={mandarAlerta} className="mt-3 text-dark">
                            <Form.Group className="mb-2"><Form.Label className="text-white small fw-bold">Probador Actual</Form.Label>
                                <Form.Select value={probador} onChange={e => setProbador(e.target.value)}><option value="1">Probador 1</option><option value="2">Probador 2</option></Form.Select>
                            </Form.Group>
                            <Form.Group className="mb-3"><Form.Label className="text-white small fw-bold">¿Qué te llevamos?</Form.Label>
                                <Form.Control type="text" value={detalle} onChange={e => setDetalle(e.target.value)} />
                            </Form.Group>
                            <Button type="submit" variant="light" className="w-100 fw-bold text-danger">Solicitar Prenda</Button>
                        </Form>
                    </Card>
                </Col>

                {/* TARJETAS ESTÉTICAS ORIGINALES */}
                <Col md={7}>
                    <Row className="g-3">
                        {modules.map((m, i) => (
                            <Col md={12} key={i}>
                                <Card className="border-0 shadow-sm p-2" style={{ borderRadius: '12px' }}>
                                    <Card.Body className="d-flex align-items-center">
                                        <div style={{ fontSize: '2rem' }} className="me-3">{m.icon}</div>
                                        <div className="text-start flex-grow-1">
                                            <h6 className="fw-bold mb-0">{m.title}</h6>
                                            <p className="text-muted small mb-0">{m.desc}</p>
                                        </div>
                                        <Button size="sm" style={{ backgroundColor: '#ff85a2', border: 'none' }} className="fw-bold" onClick={m.action}>Abrir</Button>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </Col>
            </Row>

            {/* MODAL: EXTRACCIÓN Y AGREGACIÓN DE DESEOS */}
            <Modal show={showCatalogo} onHide={() => setShowCatalogo(false)} size="lg" centered>
                <Modal.Header closeButton><Modal.Title className="fw-bold">👗 Catálogo Interactivo en Vivo</Modal.Title></Modal.Header>
                <Modal.Body>
                    <Table responsive hover size="sm" className="small text-center">
                        <thead><tr><th>Prenda</th><th>Talla</th><th>Precio</th><th>Colección</th></tr></thead>
                        <tbody>
                            {productos.map((p, i) => (
                                <tr key={i}><td><b>{p.nombre}</b></td><td><Badge bg="dark">{p.talla}</Badge></td><td className="text-danger fw-bold">${p.precio}</td>
                                    <td><Button size="sm" variant="danger" style={{borderRadius: '20px', fontSize: '0.75rem'}} onClick={() => guardarDeseo(p.id, p.nombre)}>❤️ Añadir a Deseos</Button></td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default ClienteDashboard;