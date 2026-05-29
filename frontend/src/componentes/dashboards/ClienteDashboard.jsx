import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Table, Badge, Form, Alert, Button, Card, Modal, InputGroup } from 'react-bootstrap';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';

const ClienteDashboard = () => {
    const [productos, setProductos] = useState([]);
    const [carritoDeseos, setCarritoDeseos] = useState([]);
    const [asistencias, setAsistencias] = useState([]);
    const [carritoVisible, setCarritoVisible] = useState(false);
    
    // Control de lienzo central dinámico
    const [vistaActiva, setVistaActiva] = useState('bienvenida');

    // Módulo de Asistencia en Probadores
    const [probadorSeleccionado, setProbadorSeleccionado] = useState('Probador 1');
    const [notaAsistencia, setNotaAsistencia] = useState('');

    // Módulo de Recomendaciones de Outfit AI Mock
    const [imagenPrendaOutfit, setImagenPrendaOutfit] = useState('');
    const [outfitSugerido, setOutfitSugerido] = useState(null);

    // 🔄 NUEVOS ESTADOS DE PAGINACIÓN Y BÚSQUEDA (CLIENTES)
    const [paginaActual, setPaginaActual] = useState(1);
    const [terminoBusqueda, setTerminoBusqueda] = useState('');
    const [totalPaginas, setTotalPaginas] = useState(1);
    const [cargandoMas, setCargandoMas] = useState(false);
    const [limitePorPagina] = useState(12); // Consistente con el Backend

    const usuarioActivo = localStorage.getItem('username') || 'sofia';
    const usuarioIdReal = localStorage.getItem('userId') ? parseInt(localStorage.getItem('userId')) : 5; 
    const navigate = useNavigate();

    const handleLogout = () => {
        try {
            localStorage.clear();
            navigate('/');
        } catch (error) {
            console.error('Error al cerrar sesión local:', error);
        }
    };

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        if (!token) return {};
        return { 'Authorization': `Bearer ${token}` };
    };

    // 🟢 FUNCIÓN CORE DE REFRESCO ADAPTADA CON SCROLLING Y BÚSQUEDA MULTI-CRIFADO
    const sincronizarCliente = useCallback(async (reiniciarProductos = false, paginaDestino = 1) => {
        try {
            setCargandoMas(true);
            const queryPage = reiniciarProductos ? 1 : paginaDestino;
            
            // 📡 Consulta al Servidor AWS RDS con parámetros dinámicos
            const resProd = await fetch(`http://34.219.103.28:3000/api/productos?page=${queryPage}&limit=${limitePorPagina}&search=${encodeURIComponent(terminoBusqueda)}`);
            
            if (resProd.ok) {
                const dataJSON = await resProd.json();
                
                if (reiniciarProductos || queryPage === 1) {
                    setProductos(dataJSON.records || []);
                    setPaginaActual(1);
                } else {
                    // Carga secuencial: Une las tendencias anteriores con las nuevas
                    setProductos(prev => [...prev, ...(dataJSON.records || [])]);
                    setPaginaActual(queryPage);
                }
                setTotalPaginas(dataJSON.meta.totalPages);
            }
            setCargandoMas(false);

            // Jalar llamadas de probadores de forma paralela
            const resAsis = await fetch('http://34.219.103.28:3000/api/productos/asistencia');
            if (resAsis.ok) {
                setAsistencias(await resAsis.json());
            }
        } catch (e) {
            console.error("Error sincronizando espacio del cliente:", e);
            setCargandoMas(false);
        }
    }, [terminoBusqueda, limitePorPagina]);

    // Disparador reactivo para búsquedas en tiempo real
    useEffect(() => {
        if (vistaActiva === 'catalogo') {
            sincronizarCliente(true, 1);
        }
    }, [terminoBusqueda, vistaActiva]);

    // Manejador del botón inferior "Cargar más prendas"
    const handleCargarMasProductos = () => {
        const siguientePagina = paginaActual + 1;
        if (siguientePagina <= totalPaginas) {
            sincronizarCliente(false, siguientePagina);
        }
    };

    // 🔔 ENVIAR LLAMADA DE ASISTENCIA EN PROBADORES
    const handleSolicitarAsistencia = async (e) => {
        e.preventDefault();
        if (!notaAsistencia.trim()) {
            Swal.fire('🛍️ Probadores', 'Por favor escribe qué prenda o talla necesitas que te llevemos.', 'info');
            return;
        }

        const payload = {
            probador_id: probadorSeleccionado,
            nota: notaAsistencia,
            estado: 'pendiente',
        };

        try {
            const res = await fetch('http://34.219.103.28:3000/api/productos/asistencia', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const nuevaAlertaLocal = {
                    id: Date.now(), 
                    probador_id: probadorSeleccionado,
                    nota: notaAsistencia,
                    estado: 'pendiente',
                    fecha_solicitud: new Date().toISOString(),
                    usuario_id: usuarioIdReal
                };

                setAsistencias([nuevaAlertaLocal, ...asistencias]);
                Swal.fire({
                    title: '¡Alerta Enviada! 🔔',
                    text: `El asesor de piso ha recibido la notificación de la Cabina ${probadorSeleccionado}. Ya va en camino.`,
                    icon: 'success',
                    confirmButtonColor: '#e91e63'
                });
                setNotaAsistencia('');
                sincronizarCliente(true, 1);
            }
        } catch (err) {
            Swal.fire('❌ Error', 'No se pudo conectar con el canal de asistencia.', 'error');
        }
    };

    // 🛍️ AÑADIR ARTÍCULO AL CARRITO
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

    // 📷 RECOMENDADOR DE OUTFITS MOCK
    const handleUploadPrendaOutfit = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagenPrendaOutfit(String(reader.result));
                const productosArreglo = Array.isArray(productos) ? productos : [];
                if (productosArreglo.length > 0) {
                    const randomMatch = productosArreglo[Math.floor(Math.random() * productosArreglo.length)];
                    setOutfitSugerido(randomMatch);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const calcularTotalBolsa = () => {
        return carritoDeseos.reduce((acc, item) => acc + (item.cantidad * parseFloat(item.precio)), 0).toFixed(2);
    };

    const toggleCarrito = () => setCarritoVisible(prev => !prev);
    const cerrarCarrito = () => setCarritoVisible(false);

    const styles = {
        drawer: {
            position: 'fixed', top: 0, right: 0, height: '100vh', width: 'min(420px, 95vw)',
            backgroundColor: '#ffffff', zIndex: 1040, boxShadow: '-12px 0 35px rgba(0,0,0,0.18)',
            transition: 'transform 0.25s ease', overflowY: 'auto',
            transform: carritoVisible ? 'translateX(0)' : 'translateX(100%)'
        },
        drawerOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.38)', zIndex: 1035 },
        mainContainer: { borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' },
        headerSection: { background: 'linear-gradient(135deg, #c2185b 0%, #ad1457 100%)', padding: '24px', margin: '0', border: 'none' },
        footer: { background: 'linear-gradient(135deg, #c2185b 0%, #ad1457 100%)', color: '#ffffff', padding: '18px 24px', marginTop: '20px', textAlign: 'center' },
        menuBtn: { fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '6px', borderRadius: '8px', padding: '10px 20px', border: 'none', display: 'block', width: 'auto', backgroundColor: '#fff', color: '#e91e63' },
        contentArea: { backgroundColor: '#ffffff', padding: '30px', minHeight: '60vh', border: 'none' },
        cardBoutique: { border: '1px solid #f8bbd0', borderRadius: '14px', overflow: 'hidden' }
    };

    return (
        <div className="dashboard-responsive w-100 px-1" style={styles.mainContainer}>
            {/* HEADER INTERACTIVO CLIENTE */}
            <header style={styles.headerSection}>
                <Row className="align-items-center m-0 w-100 flex-column flex-md-row">
                    <Col className="p-0 text-center text-md-start">
                        <h1 className="fw-bold m-0 text-white" style={{ fontSize: '2.1rem', letterSpacing: '0.5px' }}>
                            ✨ Mi Espacio de Tendencia Premium ✨
                        </h1>
                        <p className="text-white-50 m-0 mt-1 small fs-6">Bienvenida a la experiencia inteligente de compra, {usuarioActivo.toUpperCase()}</p>
                    </Col>
                    <Col className="p-0 text-center text-md-end mt-3 mt-md-0" style={{ minWidth: '160px' }}>
                        <Button variant="light" onClick={handleLogout} style={{ borderRadius: '20px', padding: '8px 20px', paddingTop: '6px', fontSize: '1.05rem', fontWeight: 'bold', color: '#ad1457' }}>
                            Cerrar Sesión
                        </Button>
                    </Col>
                </Row>
            </header>

            {/* BARRA DE ACCIONES PRINCIPALES */}
            <nav className="dashboard-menu" style={{ maxWidth: '100%', margin: 0 }}>
                <button type="button" className={`dashboard-menu-button flex-shrink-0 ${vistaActiva === 'catalogo' ? 'active' : ''}`} onClick={() => { setProductos([]); setVistaActiva('catalogo'); sincronizarCliente(true, 1); }}>
                    🛍️ Explorar Catálogo Completo
                </button>
                <button type="button" className={`dashboard-menu-button flex-shrink-0 ${vistaActiva === 'probador' ? 'active' : ''}`} onClick={() => { setVistaActiva('probador'); }}>
                    🛎️ Llamar a un Asesor de Piso
                </button>
                <button type="button" className={`dashboard-menu-button flex-shrink-0 ${vistaActiva === 'outfit' ? 'active' : ''}`} onClick={() => setVistaActiva('outfit')}>
                    ✨ Recomendador Inteligente de Outfits
                </button>
                <button type="button" className={`dashboard-menu-button flex-shrink-0 ${carritoVisible ? 'active' : ''}`} onClick={toggleCarrito}>
                    🛍️ Bolsa ({carritoDeseos.length})
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

                {/* VISTA 1: CATÁLOGO CON BÚSQUEDA Y SCROLLING INCORPORADO */}
                {vistaActiva === 'catalogo' && (
                    <Row className="g-3">
                        <Col xs={12}>
                            
                            {/* 🔍 BLOQUE DE ENCABEZADO Y INPUT DE BÚSQUEDA DE ALTA DEFIDELIDAD */}
                            <Row className="align-items-center mb-4">
                                <Col xs={12} lg={6}>
                                    <h4 className="fw-bold m-0" style={{ color: '#e91e63' }}>
                                        👗 Colección en Existencia de la Tienda ({productos.length} prendas visibles)
                                    </h4>
                                </Col>
                                <Col xs={12} lg={6} className="mt-3 mt-lg-0">
                                    <InputGroup className="shadow-sm">
                                        <InputGroup.Text className="bg-white border-end-0 text-muted fs-5">🔍</InputGroup.Text>
                                        <Form.Control
                                            type="text"
                                            placeholder="Buscar por prenda, categoría o tag (ej: lino, casual)..."
                                            className="border-start-0 py-2 fs-5"
                                            value={terminoBusqueda}
                                            onChange={e => setTerminoBusqueda(e.target.value)}
                                        />
                                        {terminoBusqueda && (
                                            <Button variant="outline-secondary" className="bg-white border-start-0 text-muted" onClick={() => setTerminoBusqueda('')}>✕</Button>
                                        )}
                                    </InputGroup>
                                </Col>
                            </Row>

                            <Row className="g-3">
                                {Array.isArray(productos) && productos.map((p, i) => {
                                    const fallbackImg = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'><rect width='100%' height='100%' fill='%23fce4ec'/><text x='50%' y='50%' font-family='sans-serif' font-size='14' fill='%23e91e63' text-anchor='middle'>SmartBoutique</text></svg>";
                                    const tagsArray = p.tags && Array.isArray(p.tags) ? p.tags : [];
                                    let imagenSrc = p.imagen_url && p.imagen_url.trim() !== '' && !p.imagen_url.includes('[object Object]')
                                        ? (p.imagen_url.startsWith('data:image') || p.imagen_url.includes('http') ? p.imagen_url : `data:image/jpeg;base64,${p.imagen_url}`)
                                        : fallbackImg;

                                    return (
                                        <Col xs={12} sm={6} md={4} lg={3} xl={2} key={i} className="d-flex">
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
                                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                                            <div className="d-flex flex-wrap gap-1" style={{ maxWidth: '50%' }}>
                                                                {tagsArray.slice(0, 1).map((t, idx) => (
                                                                    <Badge key={idx} bg="light" text="secondary" className="border p-1" style={{ fontSize: '0.7rem' }}>#{t}</Badge>
                                                                ))}
                                                            </div>
                                                            <h5 className="fw-bold text-danger m-0 font-monospace">${parseFloat(p.precio || 0).toFixed(2)}</h5>
                                                        </div>
                                                        <Button 
                                                            size="sm" 
                                                            style={{ backgroundColor: '#e91e63', borderColor: '#e91e63', borderRadius: '8px' }} 
                                                            className="w-100 fw-bold py-2 text-white shadow-sm"
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

                            {/* 👇 BOTÓN DE INFRAESTRUCTURA DE SCROLLING INTERACTIVO */}
                            {paginaActual < totalPaginas && (
                                <div className="text-center mt-5">
                                    <Button 
                                        size="lg" 
                                        variant="outline-secondary" 
                                        className="px-5 py-3 fw-bold shadow-sm" 
                                        style={{ borderRadius: '30px', color: '#e91e63', borderColor: '#e91e63' }}
                                        onClick={handleCargarMasProductos}
                                        disabled={cargandoMas}
                                    >
                                        {cargandoMas ? '⏳ Escaneando almacén...' : '👇 Cargar más prendas'}
                                    </Button>
                                </div>
                            )}
                        </Col>
                    </Row>
                )}

                {/* VISTA 2: ASISTENCIA EN PROBADORES */}
                {vistaActiva === 'probador' && (
                    <Row className="g-4 justify-content-center">
                        <Col md={5}>
                            <Card className="text-white border-0 shadow-lg overflow-hidden" style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #e91e63 0%, #c2185b 100%)' }}>
                                <Card.Body className="p-4">
                                    <h4 className="fw-bold mb-3">🛎️ Solicitar Asistencia al Probador</h4>
                                    <Form onSubmit={handleSolicitarAsistencia}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="fw-bold text-white-50">Cabina / Probador:</Form.Label>
                                            <Form.Select value={probadorSeleccionado} onChange={e => setProbadorSeleccionado(e.target.value)} className="form-select-lg fw-bold text-danger">
                                                <option value="Probador 1">Probador 1 👗</option>
                                                <option value="Probador 2">Probador 2 👠</option>
                                                <option value="Probador 3">Probador 3 👜</option>
                                            </Form.Select>
                                        </Form.Group>
                                        <Form.Group className="mb-4">
                                            <Form.Label className="fw-bold text-white-50">¿Qué prenda o talla necesitas?</Form.Label>
                                            <Form.Control as="textarea" rows={3} placeholder="..." value={notaAsistencia} onChange={e => setNotaAsistencia(e.target.value)} className="form-control-lg text-dark" />
                                        </Form.Group>
                                        <Button type="submit" variant="light" className="w-100 btn-lg fw-bold text-danger py-2 shadow">
                                            🔔 Enviar Alerta Urgente
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
                                        {asistencias.length === 0 ? (
                                            <tr><td colSpan="3" className="text-muted py-3">No has realizado llamadas de asistencia en este turno.</td></tr>
                                        ) : (
                                            asistencias.map((as, idx) => (
                                                <tr key={idx}>
                                                    <td className="fw-bold text-danger">{as.probador_id}</td>
                                                    <td className="text-start text-muted">{as.nota || 'Solicitó un asesor de piso.'}</td>
                                                    <td>
                                                        {as.estado === 'pendiente' && <Badge bg="danger" className="fs-6 px-2 py-1">PENDIENTE 🔔</Badge>}
                                                        {as.estado === 'recibido' && <Badge bg="warning" text="dark" className="fs-6 px-2 py-1">EN CAMINO 🏃‍♂️💨</Badge>}
                                                        {as.estado === 'atendido' && <Badge bg="success" className="fs-6 px-2 py-1">FINALIZADA ✓</Badge>}
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

                {/* VISTA 3: RECOMENDADOR INTELIGENTE DE OUTFITS */}
                {vistaActiva === 'outfit' && (
                    <div className="mx-auto" style={{ maxWidth: '850px' }}>
                        <h4 className="fw-bold mb-3" style={{ color: '#e91e63' }}>✨ Recomendador de Outfits Premium Inteligente</h4>
                        <p className="text-muted mb-4">Sube su fotografía aquí y nuestro algoritmo escaneará las colecciones en existencia de la boutique para armarte el match perfecto.</p>
                        
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

            {/* BAG / DRAWER FIN DE COMPRA */}
            {carritoVisible && <div style={styles.drawerOverlay} onClick={cerrarCarrito} />}
            <div style={styles.drawer} className="d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start p-3 border-bottom">
                    <div>
                        <h5 className="fw-bold mb-1">🛍️ Bolsa de Deseos</h5>
                        <small className="text-muted">Revisa tus prendas guardadas.</small>
                    </div>
                    <Button variant="link" className="text-danger fw-bold p-0 fs-3" onClick={cerrarCarrito}>×</Button>
                </div>
                <div className="flex-grow-1 p-3">
                    {carritoDeseos.length === 0 ? (
                        <div className="text-center text-muted py-5">
                            <div className="fs-4">✨</div>
                            <p className="mb-2">Tu bolsa está vacía.</p>
                        </div>
                    ) : (
                        <>
                            <Table responsive hover size="sm" className="align-middle bg-white rounded shadow-sm overflow-hidden mb-3" style={{ fontSize: '0.95rem' }}>
                                <thead>
                                    <tr className="table-secondary"><th>Prenda</th><th>Cant</th><th>Subtotal</th><th></th></tr>
                                </thead>
                                <tbody>
                                    {carritoDeseos.map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="fw-bold text-truncate" style={{ maxWidth: '130px' }}>{item.nombre}</td>
                                            <td><Badge bg="dark" className="fs-6">{item.cantidad} pz</Badge></td>
                                            <td className="fw-bold text-success font-monospace">${(item.cantidad * parseFloat(item.precio)).toFixed(2)}</td>
                                            <td><Button variant="link" className="text-danger p-0 fs-5" onClick={() => handleEliminarDelCarrito(item.id)}>🗑️</Button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                            <div className="border-top pt-3 mb-3 d-flex justify-content-between align-items-center">
                                <span className="fw-bold text-secondary">Total estimado</span>
                                <span className="fw-bold text-danger font-monospace fs-5">${calcularTotalBolsa()}</span>
                            </div>
                            <Button className="w-100 fw-bold py-3 text-white shadow" style={{ backgroundColor: '#e91e63', border: 'none', fontSize: '1.05rem' }} onClick={() => { Swal.fire('Listo', 'Muestra este resumen al cajero para procesar tu ticket.', 'success'); cerrarCarrito(); }}>
                                ✓ Confirmar Lista de Compra
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <footer className="dashboard-footer">
                <div className="dashboard-footer-title">© 2026 SmartBoutique</div>
                <div className="dashboard-footer-subtitle">Experiencia de compra premium • Moda inteligente</div>
                <div className="dashboard-footer-legal">Conectado a AWS RDS Postgres v15 • Infraestructura Cloud Sincronizada</div>
            </footer>
        </div>
    );
};

export default ClienteDashboard;