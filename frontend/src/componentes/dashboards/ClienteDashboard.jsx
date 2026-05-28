import React, { useState, useEffect } from 'react';
import { Row, Col, Table, Badge, Form, Alert, Button, Card, Modal, InputGroup } from 'react-bootstrap';
import Swal from 'sweetalert2';

const ClienteDashboard = () => {
    const [productos, setProductos] = useState([]);
    const [carritoDeseos, setCarritoDeseos] = useState([]);
    const [asistencias, setAsistencias] = useState([]);
    
    // Control de lienzo central dinámico
    const [vistaActiva, setVistaActiva] = useState('bienvenida');

    // Módulo de Asistencia en Probadores
    const [probadorSeleccionado, setProbadorSeleccionado] = useState('Probador 1');
    const [notaAsistencia, setNotaAsistencia] = useState('');

    // Módulo de Recomendaciones de Outfit AI Mock
    const [imagenPrendaOutfit, setImagenPrendaOutfit] = useState('');
    const [outfitSugerido, setOutfitSugerido] = useState(null);

    const usuarioActivo = localStorage.getItem('username') || 'sofia';
    const usuarioIdReal = localStorage.getItem('userId') ? parseInt(localStorage.getItem('userId')) : 5; // Tu ID Sofía de la captura

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        if (!token) return {};
        return { 'Authorization': `Bearer ${token}` };
    };

    // Sincronizar catálogo global de AWS RDS
    const sincronizarCliente = async () => {
        try {
            const resProd = await fetch('http://34.219.103.28:3000/api/productos');
            if (resProd.ok) setProductos(await resProd.json());

            // Jalar llamadas de probadores para monitorear el estado actual
            const resAsis = await fetch('http://34.219.103.28:3000/api/productos/asistencia');
            if (resAsis.ok) {
                const llamadas = await resAsis.json();
                setAsistencias(llamadas);
            }
        } catch (e) {
            console.error("Error sincronizando espacio del cliente:", e);
        }
    };

    useEffect(() => { sincronizarCliente(); }, []);

    // 🔔 1. ENVIAR LLAMADA DE ASISTENCIA VINCULADA CON VENDEDOR EN TIEMPO REAL
    const handleSolicitarAsistencia = async (e) => {
        e.preventDefault();
        if (!notaAsistencia.trim()) {
            Swal.fire('🛍️ Probadores', 'Por favor escribe qué prenda o talla necesitas que te llevemos.', 'info');
            return;
        }

        // Armamos el JSON para la tabla asistencia_probadores
        const payload = {
            probador_id: probadorSeleccionado,
            nota: notaAsistencia,
            usuario_id: usuarioIdReal
        };

        try {
            const res = await fetch('http://34.219.103.28:3000/api/productos/asistencia', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                Swal.fire({
                    title: '¡Alerta Enviada! 🔔',
                    text: `El asesor de piso ha recibido la notificación de la Cabina ${probadorSeleccionado}. Ya va en camino.`,
                    icon: 'success',
                    confirmButtonColor: '#e91e63'
                });
                setNotaAsistencia('');
                sincronizarCliente();
            }
        } catch (err) {
            Swal.fire('❌ Error', 'No se pudo conectar con el canal de asistencia.', 'error');
        }
    };

    // 🛍️ 2. AÑADIR ARTÍCULO AL CARRITO DE DESEOS LOCAL/PERSISTIDO
    const handleAgregarAlCarrito = (p) => {
        if (p.stock <= 0) {
            Swal.fire('⚠️ Agotado', 'Esta prenda no cuenta con existencias en este momento.', 'warning');
            return;
        }

        const existe = carritoDeseos.find(item => item.id === p.id);
        if (existe) {
            if (existe.cantidad + 1 > p.stock) {
                Swal.fire('⚠️ Límite', `No puedes agregar más piezas. Stock máximo: ${p.stock} pz.`, 'warning');
                return;
            }
            setCarritoDeseos(carritoDeseos.map(item => item.id === p.id ? { ...item, cantidad: item.cantidad + 1 } : item));
        } else {
            setCarritoDeseos([...carritoDeseos, { ...p, cantidad: 1 }]);
        }

        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: `👗 ${p.nombre} añadida a tu bolsa`,
            showConfirmButton: false,
            timer: 1500
        });
    };

    const handleEliminarDelCarrito = (id) => {
        setCarritoDeseos(carritoDeseos.filter(item => item.id !== id));
    };

    // 📷 3. RECOMENDADOR DE OUTFITS CON CARGA BASE64
    const handleUploadPrendaOutfit = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagenPrendaOutfit(String(reader.result));
                // Mock de combinador inteligente de prendas de la base de datos
                if (productos.length > 0) {
                    const randomMatch = productos[Math.floor(Math.random() * productos.length)];
                    setOutfitSugerido(randomMatch);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const calcularTotalBolsa = () => {
        return carritoDeseos.reduce((acc, item) => acc + (item.cantidad * parseFloat(item.precio)), 0).toFixed(2);
    };

    const styles = {
        mainContainer: { borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' },
        headerSection: { background: 'linear-gradient(135deg, #e91e63 0%, #ad1457 100%)', padding: '24px', margin: '0', border: 'none' },
        menuBtn: { fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '6px', borderRadius: '8px', padding: '10px 20px', border: 'none', display: 'block', width: 'auto', backgroundColor: '#fff', color: '#e91e63' },
        contentArea: { backgroundColor: '#ffffff', padding: '30px', minHeight: '60vh', border: 'none' },
        cardBoutique: { border: '1px solid #f8bbd0', borderRadius: '14px', overflow: 'hidden' }
    };

    return (
        <div className="w-100 px-1" style={styles.mainContainer}>
            {/* HEADER INTERACTIVO CLIENTE */}
            <header style={styles.headerSection}>
                <Row className="text-center align-items-center m-0 w-100">
                    <Col className="p-0">
                        <h1 className="fw-bold m-0 text-white" style={{ fontSize: '2.1rem', letterSpacing: '0.5px' }}>
                            ✨ Mi Espacio de Tendencia Premium ✨
                        </h1>
                        <p className="text-white-50 m-0 mt-1 small fs-6">Bienvenida a la experiencia inteligente de compra, {usuarioActivo.toUpperCase()}</p>
                    </Col>
                </Row>
            </header>

            {/* BARRA DE ACCIONES PRINCIPALES */}
            <nav className="d-flex justify-content-center align-items-center gap-3 my-3 p-2 bg-light rounded shadow-sm mx-auto" style={{ maxWidth: '95%' }}>                
                <button 
                    style={{ ...styles.menuBtn, backgroundColor: vistaActiva === 'catalogo' ? '#e91e63' : '#fff', color: vistaActiva === 'catalogo' ? '#fff' : '#e91e63' }} 
                    onClick={() => { setVistaActiva('catalogo'); sincronizarCliente(); }}
                >
                    🛍️ Explorar Catálogo Completo
                </button>
                <button 
                    style={{ ...styles.menuBtn, backgroundColor: vistaActiva === 'probador' ? '#e91e63' : '#fff', color: vistaActiva === 'probador' ? '#fff' : '#e91e63' }} 
                    onClick={() => { setVistaActiva('probador'); sincronizarCliente(); }}
                >
                    🛎️ Llamar a un Asesor de Piso
                </button>
                <button 
                    style={{ ...styles.menuBtn, backgroundColor: vistaActiva === 'outfit' ? '#e91e63' : '#fff', color: vistaActiva === 'outfit' ? '#fff' : '#e91e63' }} 
                    onClick={() => setVistaActiva('outfit')}
                >
                    ✨ Recomendador Inteligente de Outfits
                </button>
            </nav>

            <div style={styles.contentArea}>
                {vistaActiva === 'bienvenida' && (
                    <Row className="align-items-center py-4">
                        <Col md={12} className="text-center">
                            <div style={{ fontSize: '5rem' }}>👗</div>
                            <h3 className="fw-bold mt-2" style={{ color: '#e91e63' }}>¿Lista para armar tu outfit ideal?</h3>
                            <p className="text-muted" style={{ fontSize: '1.1rem' }}>Utiliza las opciones de arriba para pedir tallas al probador o armar tu bolsa de deseos.</p>
                        </Col>
                    </Row>
                )}

                {/* VISTA 1: CATÁLOGO EN 3 COLUMNAS COMPRESAS + BOLSA DE DESEOS EN LADO DERECHO (TAMAÑO MEDIO-GRANDE) */}
                {vistaActiva === 'catalogo' && (
                    <Row className="g-3">
                        {/* COLUMNA IZQUIERDA: EL INVENTARIO DE PRENDAS */}
                        <Col lg={8} className="border-end pe-3" style={{ borderColor: '#f8bbd0' }}>
                            <h4 className="fw-bold mb-4" style={{ color: '#e91e63' }}>👗 Colección en Existencia de la Tienda</h4>
                            <Row className="g-3">
                                {productos.map((p, i) => {
                                    const fallbackImg = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'><rect width='100%' height='100%' fill='%23fce4ec'/><text x='50%' y='50%' font-family='sans-serif' font-size='14' fill='%23e91e63' text-anchor='middle'>SmartBoutique</text></svg>";
                                    let imagenSrc = p.imagen_url && p.imagen_url.trim() !== '' && !p.imagen_url.includes('[object Object]')
                                        ? (p.imagen_url.startsWith('data:image') || p.imagen_url.includes('http') ? p.imagen_url : `data:image/jpeg;base64,${p.imagen_url}`)
                                        : fallbackImg;

                                    return (
                                        <Col md={6} lg={4} key={i} className="d-flex">
                                            <Card style={styles.cardBoutique} className="shadow-sm border-0 w-100 d-flex flex-column rounded-4 bg-white overflow-hidden">
                                                <div className="d-flex justify-content-center align-items-center p-2 bg-light" style={{ height: '170px', overflow: 'hidden' }}>
                                                    <Card.Img variant="top" src={imagenSrc} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} onError={(e) => { e.target.src = fallbackImg; }} />
                                                </div>
                                                <Card.Body className="d-flex flex-column justify-content-between p-2" style={{ fontSize: '0.95rem' }}>
                                                    <div>
                                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                                            <span className="text-muted small fw-bold text-uppercase">{p.categoria || 'Moda'}</span>
                                                            <Badge bg="light" text="dark" className="border small">#{p.id}</Badge>
                                                        </div>
                                                        <Card.Title className="fw-bold text-dark fs-6 mb-1 text-truncate">{p.nombre}</Card.Title>
                                                        <div className="d-flex flex-wrap gap-1 mb-2">
                                                            <Badge bg="dark" style={{ fontSize: '0.75rem' }}>Talla: {p.talla || 'M'}</Badge>
                                                            <Badge bg={p.stock > 0 ? 'success' : 'danger'} style={{ fontSize: '0.75rem' }}>{p.stock > 0 ? `Stock: ${p.stock} pz` : 'Agotado'}</Badge>
                                                        </div>
                                                    </div>
                                                    <div className="mt-auto">
                                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                                            <h5 className="fw-bold text-danger m-0 font-monospace">${parseFloat(p.precio || 0).toFixed(2)}</h5>
                                                        </div>
                                                        {/* CAMBIO DE NEGOCIO: AÑADIR A CARRITO */}
                                                        <Button 
                                                            size="sm" 
                                                            style={{ backgroundColor: '#e91e63', borderColor: '#e91e63' }} 
                                                            className="w-100 fw-bold py-1 text-white shadow-sm mt-1"
                                                            onClick={() => handleAgregarAlCarrito(p)}
                                                        >
                                                            🛍️ Añadir a Bolsa
                                                        </Button>
                                                    </div>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    );
                                })}
                            </Row>
                        </Col>

                        {/* COLUMNA DERECHA: MI CARRITO DE DESEOS MEDIO-GRANDE */}
                        <Col lg={4} className="ps-3">
                            <div className="bg-light p-3 rounded-4 border shadow-sm sticky-top" style={{ top: '20px' }}>
                                <h4 className="fw-bold mb-3" style={{ color: '#e91e63' }}>❤️ Mi Bolsa de Deseos</h4>
                                {carritoDeseos.length === 0 ? (
                                    <div className="text-center py-4 text-muted fs-5">Tu bolsa está vacía. ¡Explora el catálogo y añade tus prendas favoritas! 💕</div>
                                ) : (
                                    <div>
                                        <Table responsive hover size="sm" className="align-middle bg-white rounded shadow-sm overflow-hidden mb-3" style={{ fontSize: '1rem' }}>
                                            <thead>
                                                <tr className="table-secondary"><th>Prenda</th><th>Cant</th><th>Subtotal</th><th></th></tr>
                                            </thead>
                                            <tbody>
                                                {carritoDeseos.map((item, idx) => (
                                                    <tr key={idx}>
                                                        <td className="fw-bold text-truncate" style={{ maxWidth: '120px' }}>{item.nombre}</td>
                                                        <td><Badge bg="dark" className="fs-6">{item.cantidad} pz</Badge></td>
                                                        <td className="fw-bold text-success font-monospace">${(item.cantidad * parseFloat(item.precio)).toFixed(2)}</td>
                                                        <td><Button variant="link" className="text-danger p-0 fs-5" onClick={() => handleEliminarDelCarrito(item.id)}>🗑️</Button></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                        <div className="border-top pt-3 d-flex justify-content-between align-items-center mb-3">
                                            <h5 className="fw-bold m-0 text-secondary">MONTO TOTAL ESTIMADO:</h5>
                                            <h3 className="fw-bold text-danger font-monospace m-0">${calcularTotalBolsa()}</h3>
                                        </div>
                                        <Button className="w-100 fw-bold py-2 text-white shadow" style={{ backgroundColor: '#e91e63', border: 'none', fontSize: '1.1rem' }} onClick={() => Swal.fire('Listo', 'Muestra este resumen al cajero para procesar tu ticket al salir del probador.', 'success')}>
                                            ✓ Confirmar Lista de Compra
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </Col>
                    </Row>
                )}

                {/* VISTA 2: BOTÓN DE ASISTENCIA INTERACTIVA EN PROBADORES (COORDINACIÓN DIRECTA) */}
                {vistaActiva === 'probador' && (
                    <Row className="g-4 justify-content-center">
                        <Col md={5}>
                            <Card className="text-white border-0 shadow-lg overflow-hidden" style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #e91e63 0%, #c2185b 100%)' }}>
                                <Card.Body className="p-4">
                                    <h4 className="fw-bold mb-3">🛎️ Solicitar Asistencia al Probador</h4>
                                    <Form onSubmit={handleSolicitarAsistencia}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="fw-bold text-white-50">Selecciona tu Cabina / Probador:</Form.Label>
                                            <Form.Select value={probadorSeleccionado} onChange={e => setProbadorSeleccionado(e.target.value)} className="form-select-lg fw-bold text-danger">
                                                <option value="Probador 1">Probador 1 👗</option>
                                                <option value="Probador 2">Probador 2 👠</option>
                                                <option value="Probador 3">Probador 3 👜</option>
                                            </Form.Select>
                                        </Form.Group>
                                        <Form.Group className="mb-4">
                                            <Form.Label className="fw-bold text-white-50">¿Qué talla, color o prenda te llevamos?</Form.Label>
                                            <Form.Control as="textarea" rows={3} placeholder="..." value={notaAsistencia} onChange={e => setNotaAsistencia(e.target.value)} className="form-control-lg text-dark" />
                                        </Form.Group>
                                        <Button type="submit" variant="light" className="w-100 btn-lg fw-bold text-danger py-2 shadow">
                                            🔔 Enviar Alerta Urgente a Asesor
                                        </Button>
                                    </Form>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col md={7}>
                            <div className="bg-white p-4 rounded-4 border shadow-sm">
                                <h5 className="fw-bold mb-3" style={{ color: '#e91e63' }}>📋 Mis solicitudes de atención en piso</h5>
                                <Table responsive hover className="text-center align-middle border mt-2 small" style={{ fontSize: '1.05rem' }}>
                                    <thead className="table-light">
                                        <tr><th>Cabina</th><th>Mensaje Enviado</th><th>Estado del Asesor</th></tr>
                                    </thead>
                                    <tbody>
                                        {asistencias.filter(as => as.usuario_id === usuarioIdReal).length === 0 ? (
                                            <tr>
                                                <td colSpan="3" className="text-muted py-3">No has realizado llamadas de asistencia en este turno de probadores.</td>
                                            </tr>
                                        ) : (
                                            asistencias.filter(as => as.usuario_id === usuarioIdReal).map((as, idx) => (
                                                <tr key={idx}>
                                                    <td className="fw-bold text-danger">{as.probador_id}</td>
                                                    {/* 🎯 Mapeo directo del mensaje de la alerta */}
                                                    <td className="text-start text-muted">{as.nota || 'Solicitó un asesor de piso.'}</td>
                                                    <td>
                                                        {as.estado === 'pendiente' && (
                                                            <Badge bg="danger" className="fs-6 px-2 py-1">PENDIENTE 🔔</Badge>
                                                        )}
                                                        {as.estado === 'recibido' && (
                                                            <Badge bg="warning" text="dark" className="fs-6 px-2 py-1">EN CAMINO 🏃‍♂️💨</Badge>
                                                        )}
                                                        {as.estado === 'atendido' && (
                                                            <Badge bg="success" className="fs-6 px-2 py-1">ASISTENCIA FINALIZADA ✓</Badge>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </Table>
                            </div>
                        </Col>
                    </Row>
                )}

                {/* VISTA 3: RECOMENDADOR INTELIGENTE DE OUTFITS DE ACUERDO A UNA IMAGEN */}
                {vistaActiva === 'outfit' && (
                    <div className="mx-auto" style={{ maxWidth: '850px' }}>
                        <h4 className="fw-bold mb-3" style={{ color: '#e91e63' }}>✨ Recomendador de Outfits Premium Inteligente</h4>
                        <p className="text-muted mb-4">¿Tienes una prenda y no sabes con qué combinarla? Sube su fotografía aquí y nuestro algoritmo escaneará las colecciones en existencia de la boutique para armarte el match perfecto.</p>
                        
                        <Card className="border-0 shadow-sm p-4 bg-light mb-4" style={{ borderRadius: '14px' }}>
                            <Form.Group className="mb-3 text-center">
                                <Form.Label className="fw-bold text-secondary fs-5 d-block mb-3">📸 Sube o captura la foto de tu prenda base:</Form.Label>
                                <Form.Control type="file" accept="image/*" onChange={handleUploadPrendaOutfit} className="form-control-lg bg-white shadow-sm" />
                            </Form.Group>
                        </Card>

                        {imagenPrendaOutfit && (
                            <Row className="g-4 align-items-center animate__animated animate__fadeIn">
                                <Col md={5} className="text-center">
                                    <div className="bg-white p-3 rounded-4 border shadow-sm">
                                        <span className="small text-muted fw-bold text-uppercase d-block mb-2">Tu Prenda Base</span>
                                        <img src={imagenPrendaOutfit} alt="Tu prenda" style={{ maxHeight: '220px', maxWidth: '100%', borderRadius: '10px', objectFit: 'contain' }} />
                                    </div>
                                </Col>
                                <Col md={2} className="text-center">
                                    <div className="fs-1 text-danger animate__animated animate__pulse animate__infinite">➕</div>
                                    <span className="small text-muted fw-bold text-uppercase">MATCH IDEAL</span>
                                </Col>
                                <Col md={5} className="text-center">
                                    {outfitSugerido ? (
                                        <div className="bg-white p-3 rounded-4 border shadow-sm" style={{ borderLeft: '5px solid #e91e63' }}>
                                            <span className="small text-danger fw-bold text-uppercase d-block mb-2">👑 Sugerencia SmartBoutique</span>
                                            <div className="d-flex justify-content-center align-items-center mb-2" style={{ height: '140px' }}>
                                                <img 
                                                    src={outfitSugerido.imagen_url && !outfitSugerido.imagen_url.includes('[object Object]') ? (outfitSugerido.imagen_url.startsWith('data:image') ? outfitSugerido.imagen_url : `data:image/jpeg;base64,${outfitSugerido.imagen_url}`) : "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect width='100%' height='100%' fill='%23fce4ec'/></svg>"} 
                                                    alt="Match" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} 
                                                />
                                            </div>
                                            <h5 className="fw-bold text-dark m-0 text-truncate">{outfitSugerido.nombre}</h5>
                                            <Badge bg="dark" className="my-1">Talla Recomendada: {outfitSugerido.talla || 'M'}</Badge>
                                            <h5 className="fw-black text-danger font-monospace mt-1">${parseFloat(outfitSugerido.precio).toFixed(2)}</h5>
                                            <Button size="sm" style={{ backgroundColor: '#e91e63', borderColor: '#e91e63' }} className="fw-bold w-100 mt-2" onClick={() => handleAgregarAlCarrito(outfitSugerido)}>
                                                🛍️ Añadir Match a Bolsa
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="text-muted">Procesando tendencias...</div>
                                    )}
                                </Col>
                            </Row>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClienteDashboard;