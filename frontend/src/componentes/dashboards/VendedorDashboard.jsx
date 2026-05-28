import React, { useState, useEffect } from 'react';
import { Row, Col, Table, Badge, Form, Alert, Button, Card, Modal, InputGroup } from 'react-bootstrap';
import Swal from 'sweetalert2';

const VendedorDashboard = () => {
    const [productos, setProductos] = useState([]);
    const [asistencias, setAsistencias] = useState([]);
    const [ventasData, setVentasData] = useState([]);
    const [descuentosCatalogo, setDescuentosCatalogo] = useState([]); // Tabla informativa de descuentos
    
    // Control de navegación idéntico al Administrador
    const [vistaActiva, setVistaActiva] = useState('bienvenida');
    
    // Control del POS y carrito
    const [idProductoVenta, setIdProductoVenta] = useState('');
    const [cantidadVenta, setCantidadVenta] = useState('');
    const [descuentoSeleccionado, setDescuentoSeleccionado] = useState('0');
    
    // 🔐 ESTADOS DE SEGURIDAD Y BYPASS
    const [descuentoAutorizado, setDescuentoAutorizado] = useState(false);
    const [supervisorNombre, setSupervisorNombre] = useState('');
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [supervisorIdInput, setSupervisorIdInput] = useState('');

    const usuarioActivo = localStorage.getItem('username') || 'sherlyn';
    const rolActivo = localStorage.getItem('userRole') || 'vendedor';

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        if (!token) return {};
        return { 'Authorization': `Bearer ${token}` };
    };

    // Sincronización en la nube (AWS RDS)
    const sincronizarVendedor = async () => {
        try {
            const authHeaders = getAuthHeaders();
            
            const resProd = await fetch('http://34.219.103.28:3000/api/productos');
            if (resProd.ok) setProductos(await resProd.json());

            const resVentas = await fetch('http://34.219.103.28:3000/api/productos/ventas', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json', 'username': usuarioActivo, ...authHeaders }
            });
            if (resVentas.ok) setVentasData(await resVentas.json());

            // Jalar llamadas activas de probadores
            const resAsis = await fetch('http://34.219.103.28:3000/api/productos/asistencia');
            if (resAsis.ok) setAsistencias(await resAsis.json());

            // Mock de descuentos permitidos en base de datos
            setDescuentosCatalogo([
                { id: 1, nombre: 'Sin Descuento', porcentaje: 0, descripcion: 'Precio regular de etiqueta' },
                { id: 2, nombre: 'Descuento de Temporada', porcentaje: 10, descripcion: 'Requiere validación de supervisor' },
                { id: 3, nombre: 'Venta Especial', porcentaje: 15, descripcion: 'Eventos específicos en tienda' },
                { id: 4, nombre: 'Liquidación', porcentaje: 20, descripcion: 'Últimas piezas en piso' },
                { id: 5, name: 'Gran Outlet', porcentaje: 50, descripcion: 'Remate masivo autorizado' }
            ]);

        } catch (e) {
            console.error("Error sincronizando piso de venta:", e);
        }
    };

    useEffect(() => { sincronizarVendedor(); }, []);

    // 🔒 PROCESAR EL BYPASS DE AUTORIZACIÓN DINÁMICA
    const handleVerificarAutorizacion = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('http://34.219.103.28:3000/api/productos/usuarios/validar-autorizacion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({ supervisor_id: supervisorIdInput })
            });
            const data = await res.json();

            if (res.ok && data.valid) {
                setDescuentoAutorizado(true);
                setSupervisorNombre(data.supervisor);
                setShowAuthModal(false);
                setSupervisorIdInput('');
                Swal.fire('¡Desbloqueado!', `Descuento autorizado por ${data.supervisor} (${data.rol.toUpperCase()}) ✨`, 'success');
            } else {
                Swal.fire('Acceso Denegado', data.error || 'Este ID no tiene rango de Supervisor.', 'error');
            }
        } catch (err) {
            Swal.fire('❌ Error', 'No se pudo conectar con el módulo de seguridad.', 'error');
        }
    };

    // TRANSACCIÓN DE COMPRA EXPRÉS ASESOR
    const handleCompraDirectaVendedor = async (e) => {
        e.preventDefault();

        const productoExiste = productos.find(p => p.id === parseInt(idProductoVenta));
        if (!productoExiste) {
            Swal.fire('⚠️ Catálogo', 'El ID del producto no existe.', 'warning');
            return;
        }
        
        if (parseInt(cantidadVenta) > productoExiste.stock) {
            Swal.fire('⚠️ Inventario', `Stock insuficiente. Quedan ${productoExiste.stock} pz.`, 'error');
            return;
        }

        const precioCatalogo = parseFloat(productoExiste.precio);
        const porcentajeDescuento = parseFloat(descuentoSeleccionado); 
        
        if (porcentajeDescuento > 0 && !descuentoAutorizado) {
            Swal.fire('🔒 Permiso Requerido', 'Debes solicitar la autorización de un Gerente o Encargado para aplicar rebajas.', 'warning');
            return;
        }

        const descuentoPorPieza = precioCatalogo * (porcentajeDescuento / 100);
        const precioConDescuento = precioCatalogo - descuentoPorPieza;
        const totalCobradoFinal = parseInt(cantidadVenta) * precioConDescuento;
        const totalDineroDescontado = parseInt(cantidadVenta) * descuentoPorPieza;

        const datosVenta = {
            total: totalCobradoFinal,
            descuento_aplicado: totalDineroDescontado, 
            usuario_id: 2, 
            carrito: [{ producto_id: productoExiste.id, cantidad: parseInt(cantidadVenta), precio_unitario: precioConDescuento }]
        };

        try {
            const res = await fetch('http://34.219.103.28:3000/api/productos/registrar-venta', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify(datosVenta)
            });

            if (res.ok) {
                setIdProductoVenta('');
                setCantidadVenta('');
                setDescuentoSeleccionado('0'); 
                setDescuentoAutorizado(false); 
                setSupervisorNombre('');
                
                await sincronizarVendedor(); 
                Swal.fire('🛍️ ¡Venta Exitosa!', 'Registro inyectado en el turno actual de la caja.', 'success');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleAtenderProbador = async (id) => {
        setAsistencias(asistencias.filter(as => as.id !== id));
        Swal.fire('🔔 Probadores', 'Asistencia marcada como completada.', 'success');
    };

    const styles = {
        mainContainer: { borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' },
        headerSection: { background: 'linear-gradient(135deg, #e91e63 0%, #c2185b 100%)', padding: '24px', margin: '0', border: 'none' },
        menuBtn: { fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '6px', borderRadius: '8px', padding: '10px 20px', border: 'none', display: 'block', width: 'auto', backgroundColor: '#fff', color: '#e91e63', transition: 'all 0.2s' },
        contentArea: { backgroundColor: '#ffffff', padding: '35px', minHeight: '60vh', border: 'none' },
        cardBoutique: { border: '1px solid #f8bbd0', borderRadius: '14px', overflow: 'hidden' }
    };

    return (
        <div className="w-100 px-1" style={styles.mainContainer}>
            {/* BANNER DE BIENVENIDA ASESOR (LETRA MÁS GRANDE) */}
            <header style={styles.headerSection}>
                <Row className="text-center align-items-center m-0 w-100">
                    <Col className="p-0">
                        <h1 className="fw-bold m-0 text-white" style={{ fontSize: '2.1rem', letterSpacing: '0.5px' }}>
                            Panel de Piso de Venta: {usuarioActivo.toUpperCase()} 👑
                        </h1>
                    </Col>
                </Row>
            </header>

            {/* MENÚ DE OPCIONES ADAPTATIVO (FUENTES MÁS ROBUSTAS) */}
            <nav className="d-flex justify-content-center align-items-center gap-3 my-3 p-2 bg-light rounded shadow-sm mx-auto" style={{ maxWidth: '95%' }}>                
                <button 
                    style={{ ...styles.menuBtn, backgroundColor: vistaActiva === 'inventario' ? '#e91e63' : '#fff', color: vistaActiva === 'inventario' ? '#fff' : '#e91e63' }} 
                    onClick={() => { setVistaActiva('inventario'); sincronizarVendedor(); }}
                >
                    👗 Catálogo de Prendas
                </button>
                <button 
                    style={{ ...styles.menuBtn, backgroundColor: vistaActiva === 'probadores' ? '#e91e63' : '#fff', color: vistaActiva === 'probadores' ? '#fff' : '#e91e63' }} 
                    onClick={() => { setVistaActiva('probadores'); sincronizarVendedor(); }}
                >
                    🔔 Alertas Probadores {asistencias.length > 0 && <Badge bg="danger" className="ms-1 fs-6">{asistencias.length}</Badge>}
                </button>
                <button 
                    style={{ ...styles.menuBtn, backgroundColor: vistaActiva === 'descuentos' ? '#e91e63' : '#fff', color: vistaActiva === 'descuentos' ? '#fff' : '#e91e63' }} 
                    onClick={() => { setVistaActiva('descuentos'); sincronizarVendedor(); }}
                >
                    🎟️ Lista de Promociones
                </button>
                <button 
                    style={{ ...styles.menuBtn, backgroundColor: vistaActiva === 'ventas' ? '#e91e63' : '#fff', color: vistaActiva === 'ventas' ? '#fff' : '#e91e63' }} 
                    onClick={() => { setVistaActiva('ventas'); sincronizarVendedor(); }}
                >
                    🛍️ Ventas
                </button>
            </nav>

            <div style={styles.contentArea}>
                {vistaActiva === 'bienvenida' && (
                    <div className="text-center py-5">
                        <div style={{ fontSize: '5rem' }}>✨</div>
                        <h3 className="fw-bold mt-3" style={{ color: '#e91e63' }}>Terminal de Piso de Venta Lista</h3>
                        <p className="text-muted" style={{ fontSize: '1.1rem' }}>Selecciona una opción del menú superior para iniciar operaciones de atención al cliente.</p>
                    </div>
                )}

                {/* VISTA A: CONSULTAR PRENDAS HORIZONTAL CON LETRA GRANDE */}
                {vistaActiva === 'inventario' && (
                    <div>
                        <h4 className="fw-bold mb-4" style={{ color: '#e91e63' }}>👗 Prendas en Existencia</h4>
                        <Row className="g-3">
                            {productos.map((p, i) => {
                                const fallbackImg = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'><rect width='100%' height='100%' fill='%23fce4ec'/><text x='50%' y='50%' font-family='sans-serif' font-size='14' fill='%23e91e63' text-anchor='middle'>Prenda SmartBoutique</text></svg>";
                                const tagsArray = p.tags && Array.isArray(p.tags) ? p.tags : [];
                                let imagenSrc = fallbackImg; 

                                if (p.imagen_url && p.imagen_url.trim() !== '' && !p.imagen_url.includes('[object Object]')) {
                                    if (p.imagen_url.startsWith('data:image')) {
                                        imagenSrc = p.imagen_url;
                                    } else if (!p.imagen_url.includes('http')) {
                                        imagenSrc = `data:image/jpeg;base64,${p.imagen_url}`;
                                    } else {
                                        imagenSrc = p.imagen_url;
                                    }
                                }

                                return (
                                    <Col md={12} lg={6} key={i}>
                                        <Card style={styles.cardBoutique} className="shadow-sm h-100 overflow-hidden">
                                            <Row className="g-0 h-100">
                                                
                                                {/* 👈 LADO IZQUIERDO: DETALLES TEXTUALES CON FONT ENLARGED */}
                                                <Col xs={7} className="d-flex flex-column justify-content-between p-3">
                                                    <div>
                                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                                            <span className="text-muted fw-bold text-uppercase" style={{ fontSize: '0.95rem', letterSpacing: '0.5px' }}>{p.categoria || 'Moda'}</span>
                                                            <Badge bg="light" text="dark" className="border fs-6">ID: #{p.id}</Badge>
                                                        </div>
                                                        
                                                        <Card.Title className="fw-bold text-dark fs-4 mb-2">
                                                            {p.nombre}
                                                        </Card.Title>
                                                        
                                                        <Card.Text className="text-muted mb-3" style={{ fontSize: '1rem', minHeight: '44px', lineHeight: '1.4' }}>
                                                            {p.descripcion || 'Sin descripción asignada todavía.'}
                                                        </Card.Text>

                                                        {/* Especificaciones Técnicas (Agrandadas) */}
                                                        <div className="d-flex flex-wrap gap-2 mb-2">
                                                            <Badge bg="dark" className="p-2 fs-6">Talla: {p.talla || 'M'}</Badge>
                                                            <Badge bg="secondary" className="p-2 fs-6">Color: {p.color || 'Unicolor'}</Badge>
                                                            <Badge bg={p.stock > 5 ? 'success' : 'danger'} className="p-2 fs-6">Stock: {p.stock} pz</Badge>
                                                        </div>
                                                    </div>

                                                    <div className="d-flex justify-content-between align-items-end mt-3">
                                                        <div className="d-flex flex-wrap gap-1" style={{ maxWidth: '60%' }}>
                                                            {tagsArray.map((t, idx) => (
                                                                <Badge key={idx} bg="light" text="secondary" className="border p-1" style={{ fontSize: '0.85rem' }}>#{t}</Badge>
                                                            ))}
                                                        </div>
                                                        <div className="text-end">
                                                            <span className="d-block text-muted fw-bold" style={{ fontSize: '0.75rem' }}>PRECIO PISO</span>
                                                            <h3 className="fw-bold text-danger m-0 font-monospace" style={{ fontSize: '1.8rem' }}>
                                                                ${parseFloat(p.precio || 0).toFixed(2)}
                                                            </h3>
                                                        </div>
                                                    </div>
                                                </Col>

                                                {/* 👉 LADO DERECHO: FOTOGRAFÍA COMODA */}
                                                <Col xs={5} className="d-flex align-items-center justify-content-center bg-light border-start" style={{ borderColor: '#f8bbd0' }}>
                                                    <div 
                                                        className="w-100 d-flex justify-content-center align-items-center p-2" 
                                                        style={{ height: '100%', minHeight: '230px', backgroundColor: '#fffdfd' }}
                                                    >
                                                        <Card.Img 
                                                            src={imagenSrc} 
                                                            style={{ 
                                                                maxHeight: '210px', 
                                                                maxWidth: '100%', 
                                                                width: 'auto', 
                                                                height: 'auto',
                                                                objectFit: 'contain' 
                                                            }} 
                                                            onError={(e) => { e.target.src = fallbackImg; }}
                                                        />
                                                    </div>
                                                </Col>

                                            </Row>
                                        </Card>
                                    </Col>
                                );
                            })}
                        </Row>
                    </div>
                )}

                {/* VISTA B: PROBADORES CON FUENTE ROBUSTA */}
                {vistaActiva === 'probadores' && (
                    <div>
                        <h4 className="fw-bold mb-4" style={{ color: '#e91e63' }}>🚨 Solicitudes de Asistencia en Probadores</h4>
                        {asistencias.length === 0 ? (
                            <Alert variant="light" className="text-center border text-muted py-4 fs-5">No hay llamadas de probadores activas en este momento. 👍</Alert>
                        ) : (
                            asistencias.map((as, i) => (
                                <Alert variant="danger" key={i} className="d-flex justify-content-between align-items-center shadow-sm border-0 bg-opacity-10 py-3" style={{ backgroundColor: '#fff5f5', borderLeft: '6px solid #e91e63', fontSize: '1.15rem' }}>
                                    <div className="text-dark">
                                        🔥 <b>Llamada Urgente:</b> Cabina <b className="fs-4 text-danger">{as.probador_id}</b> está solicitando un asesor.<br/>
                                        <small className="text-muted fs-6">Estado: <Badge bg="warning" className="fs-7">{as.estado}</Badge> | Hora: {as.fecha_solicitud ? new Date(as.fecha_solicitud).toLocaleTimeString() : 'Ahora'}</small>
                                    </div>
                                    <Button size="md" variant="danger" style={{ backgroundColor: '#e91e63', border: 'none' }} className="fw-bold px-3" onClick={() => handleAtenderProbador(as.id)}>
                                        Marcar Atendido ✓
                                    </Button>
                                </Alert>
                            ))
                        )}
                    </div>
                )}

                {/* VISTA C: TABLA DE DESCUENTOS CON TIPOGRAFÍA GRANDE */}
                {vistaActiva === 'descuentos' && (
                    <div>
                        <h4 className="fw-bold mb-4" style={{ color: '#e91e63' }}>🎟️ Lista de Descuentos Oficiales Configurados</h4>
                        <Table responsive hover className="text-center align-middle border" style={{ fontSize: '1.1rem' }}>
                            <thead className="table-light">
                                <tr style={{ fontSize: '1.15rem' }}><th>Código ID</th><th>Nombre de Campaña</th><th>Porcentaje</th><th>Uso Permitido</th></tr>
                            </thead>
                            <tbody>
                                {descuentosCatalogo.map((d, i) => (
                                    <tr key={i} style={{ height: '48px' }}>
                                        <td><b>#D-{d.id}</b></td>
                                        <td className="fw-bold text-secondary">{d.nombre}</td>
                                        <td><Badge bg="purple" className="fs-6 style-badge" style={{ backgroundColor: '#7b1fa2', padding: '6px 12px' }}>{d.porcentaje}% OFF</Badge></td>
                                        <td className="text-muted text-start ps-3">{d.descripcion}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                )}

                {/* VISTA D: TERMINAL VENTAS CON CONTROLES GRANDES (POS TOUCH-LEGIBLE) */}
                {vistaActiva === 'ventas' && (
                    <div className="animate__animated animate__fadeIn" style={{ fontSize: '1.05rem' }}>
                        <h4 className="fw-bold mb-3" style={{ color: '#e91e63' }}>🛒 Módulo de Cobro</h4>
                        
                        <Form onSubmit={handleCompraDirectaVendedor} className="row g-3 mb-5 p-3 bg-light rounded align-items-end m-0 border shadow-sm">
                            <Col md={2}>
                                <Form.Label className="fw-bold text-muted mb-1" style={{ fontSize: '1.05rem' }}>ID Producto</Form.Label>
                                <Form.Control type="number" placeholder="Ej: 3" value={idProductoVenta} onChange={e => setIdProductoVenta(e.target.value)} className="form-control-lg text-center fw-bold" required />
                            </Col>
                            <Col md={2}>
                                <Form.Label className="fw-bold text-muted mb-1" style={{ fontSize: '1.05rem' }}>Cantidad</Form.Label>
                                <Form.Control type="number" placeholder="Pzs" value={cantidadVenta} onChange={e => setCantidadVenta(e.target.value)} className="form-control-lg text-center fw-bold" required />
                            </Col>
                            <Col md={3}>
                                <Form.Label className="fw-bold text-muted mb-1" style={{ fontSize: '1.05rem' }}>Descuento Especial</Form.Label>
                                <Form.Select 
                                    value={descuentoSeleccionado} 
                                    onChange={e => setDescuentoSeleccionado(e.target.value)} 
                                    className="form-select-lg fw-bold text-secondary"
                                    disabled={parseFloat(descuentoSeleccionado) > 0 && !descuentoAutorizado}
                                >
                                    <option value="0">Sin Descuento (0%)</option>
                                    <option value="10" disabled={!descuentoAutorizado}>Descuento Temporada (10%) 🔒</option>
                                    <option value="15" disabled={!descuentoAutorizado}>Venta Especial (15%) 🔒</option>
                                    <option value="20" disabled={!descuentoAutorizado}>Liquidación (20%) 🔒</option>
                                    <option value="50" disabled={!descuentoAutorizado}>Gran Outlet (50%) 🔒</option>
                                </Form.Select>
                            </Col>
                            
                            <Col md={2}>
                                {descuentoAutorizado ? (
                                    <Badge bg="success" className="w-100 py-3 fs-6 block text-center shadow-sm">✓ DESBLOQUEADO</Badge>
                                ) : (
                                    <Button type="button" variant="dark" className="w-100 fw-bold py-2 btn-lg shadow-sm fs-6" onClick={() => setShowAuthModal(true)}>
                                        🔑 Autorizar
                                    </Button>
                                )}
                            </Col>
                            
                            <Col md={3}>
                                <Button type="submit" className="w-100 fw-bold py-2 btn-lg text-white shadow" style={{ backgroundColor: '#e91e63', borderColor: '#e91e63', fontSize: '1.15rem' }}>
                                    💰 Realizar Compra
                                </Button>
                            </Col>
                        </Form>

                        {/* HISTORIAL DE VENTAS CON LETRAS AMPLIADAS */}
                        <h4 className="fw-bold mb-3 mt-4" style={{ color: '#e91e63' }}>💰 Mis Ventas</h4>
                        <Table responsive hover className="text-center align-middle mb-0 table-borderless border" style={{ fontSize: '1.1rem' }}>
                            <thead className="table-light">
                                <tr style={{ height: '42px', fontSize: '1.15rem' }}><th>Folio</th><th>Descuento</th><th>Total Cobrado</th><th>Fecha y Hora</th></tr>
                            </thead>
                            <tbody>
                                {ventasData.length === 0 ? (
                                    <tr><td colSpan="4" className="text-muted py-4 fs-5">No has registrado ventas en este turno de caja.</td></tr>
                                ) : (
                                    ventasData.map((venta, i) => (
                                        <tr key={i} className="border-bottom" style={{ height: '46px' }}>
                                            <td className="fw-bold text-secondary">#V-{venta.id}</td>
                                            <td className="text-muted">${parseFloat(venta.descuento_aplicado || 0).toFixed(2)}</td>
                                            <td className="fw-bold text-success fs-5">${parseFloat(venta.total).toFixed(2)}</td>
                                            <td className="text-muted">{venta.fecha_venta ? new Date(venta.fecha_venta).toLocaleString('es-MX') : '---'}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </Table>
                    </div>
                )}
            </div>

            {/* ====== MODAL INTERACTIVO: CAPTURA DE ID DE SUPERVISOR ====== */}
            <Modal show={showAuthModal} onHide={() => setShowAuthModal(false)} centered size="sm">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold text-dark fs-5">🔒 Llave de Supervisor</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleVerificarAutorizacion}>
                    <Modal.Body className="py-3">
                        <Form.Group>
                            <Form.Label className="text-muted fw-bold mb-2" style={{ fontSize: '1rem' }}>
                                Ingresa tu ID de Empleado:
                            </Form.Label>
                            <Form.Control 
                                type="number" 
                                placeholder="1" 
                                className="text-center fw-bold text-danger fs-3 py-2"
                                value={supervisorIdInput} 
                                onChange={e => setSupervisorIdInput(e.target.value)} 
                                required 
                                autoFocus 
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer className="border-0 pt-0">
                        <Button variant="light" size="sm" className="fw-bold" onClick={() => setShowAuthModal(false)}>Cancelar</Button>
                        <Button type="submit" variant="danger" size="sm" style={{ backgroundColor: '#e91e63', border: 'none' }} className="fw-bold px-3">
                            Validar 🔓
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
};

export default VendedorDashboard;