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
        
        // Blindaje de seguridad: Si intentan inyectar descuento sin token de supervisor
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
            usuario_id: 2, // ID de sherlyn o dinámico del login
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
                setDescuentoAutorizado(false); // Reseteamos la llave de seguridad para la siguiente venta
                setSupervisorNombre('');
                
                await sincronizarVendedor(); 
                Swal.fire('🛍️ ¡Venta Exitosa!', 'Registro inyectado en el turno actual de la caja.', 'success');
            }
        } catch (error) {
            console.error(error);
        }
    };

    // Resolver llamada de probador
    const handleAtenderProbador = async (id) => {
        // Fetch opcional a tu tabla asistencia_probadores para cambiar estado a 'atendido'
        setAsistencias(asistencias.filter(as => as.id !== id));
        Swal.fire('🔔 Probadores', 'Asistencia marcada como completada.', 'success');
    };

    const styles = {
        mainContainer: { borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' },
        headerSection: { background: 'linear-gradient(135deg, #e91e63 0%, #c2185b 100%)', padding: '22px', margin: '0', border: 'none' },
        menuBtn: { textAlign: 'left', fontWeight: 'bold', marginBottom: '6px', borderRadius: '8px', padding: '6px 16px', border: 'none', display: 'block', width: 'auto', backgroundColor: '#fff', color: '#e91e63' },
        contentArea: { backgroundColor: '#ffffff', padding: '30px', minHeight: '60vh', border: 'none' },
        cardBoutique: { border: '1px solid #f8bbd0', borderRadius: '14px', overflow: 'hidden' }
    };

    return (
        <div className="w-100 px-1" style={styles.mainContainer}>
            {/* BANNER DE BIENVENIDA ASESOR */}
            <header style={styles.headerSection}>
                <Row className="text-center align-items-center m-0 w-100">
                    <Col className="p-0">
                        <h2 className="fw-bold m-0 text-white" style={{ fontSize: '1.6rem' }}>
                            Panel de Piso de Venta: {usuarioActivo.toUpperCase()} 🛍️
                        </h2>
                    </Col>
                </Row>
            </header>

            {/* MENÚ DE OPCIONES ADAPTATIVO */}
            <nav className="d-flex justify-content-center align-items-center gap-2 my-3 p-2 bg-light rounded shadow-sm mx-auto" style={{ maxWidth: '95%' }}>                
                <button 
                    style={{ ...styles.menuBtn, backgroundColor: vistaActiva === 'inventario' ? '#e91e63' : '#fff', color: vistaActiva === 'inventario' ? '#fff' : '#e91e63' }} 
                    onClick={() => { setVistaActiva('inventario'); sincronizarVendedor(); }}
                >
                    👗 Consultar Prendas
                </button>
                <button 
                    style={{ ...styles.menuBtn, backgroundColor: vistaActiva === 'probadores' ? '#e91e63' : '#fff', color: vistaActiva === 'probadores' ? '#fff' : '#e91e63' }} 
                    onClick={() => { setVistaActiva('probadores'); sincronizarVendedor(); }}
                >
                    🔔 Probadores {asistencias.length > 0 && <Badge bg="danger">{asistencias.length}</Badge>}
                </button>
                <button 
                    style={{ ...styles.menuBtn, backgroundColor: vistaActiva === 'descuentos' ? '#e91e63' : '#fff', color: vistaActiva === 'descuentos' ? '#fff' : '#e91e63' }} 
                    onClick={() => { setVistaActiva('descuentos'); sincronizarVendedor(); }}
                >
                    🎟️ Ver Promociones
                </button>
                <button 
                    style={{ ...styles.menuBtn, backgroundColor: vistaActiva === 'ventas' ? '#e91e63' : '#fff', color: vistaActiva === 'ventas' ? '#fff' : '#e91e63' }} 
                    onClick={() => { setVistaActiva('ventas'); sincronizarVendedor(); }}
                >
                    🛒 Terminal Ventas
                </button>
            </nav>

            <div style={styles.contentArea}>
                {vistaActiva === 'bienvenida' && (
                    <div className="text-center py-5">
                        <div style={{ fontSize: '4rem' }}>✨</div>
                        <h4 className="fw-bold mt-3" style={{ color: '#e91e63' }}>Terminal de Asesoría Activa</h4>
                        <p className="text-muted small">Selecciona una opción del menú superior para iniciar operaciones en piso.</p>
                    </div>
                )}

                {/* VISTA A: CONSULTAR PRENDAS (SIN EL BOTÓN DE ACTUALIZAR) */}
                {vistaActiva === 'inventario' && (
                    <div>
                        <h5 className="fw-bold mb-4" style={{ color: '#e91e63' }}>👗 Catálogo de Prendas en Existencia</h5>
                        <Row className="g-3">
                            {productos.map((p, i) => (
                                <Col md={4} key={i}>
                                    <Card style={styles.cardBoutique} className="shadow-sm h-100">
                                        <Card.Body className="d-flex flex-column justify-content-between p-3">
                                            <div>
                                                <div className="d-flex justify-content-between align-items-center mb-1">
                                                    <span className="text-muted small fw-bold text-uppercase">{p.categoria || 'Moda'}</span>
                                                    <Badge bg="light" text="dark" className="border">ID: #{p.id}</Badge>
                                                </div>
                                                <Card.Title className="fw-bold text-dark fs-5 mb-1">{p.nombre}</Card.Title>
                                                <div className="mb-2">
                                                    <Badge bg="dark" className="me-1">Talla: {p.talla || 'M'}</Badge>
                                                    <Badge bg="secondary" className="me-1">Color: {p.color || 'Unicolor'}</Badge>
                                                    <Badge bg={p.stock > 5 ? 'success' : 'danger'}>Stock: {p.stock} pz</Badge>
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="fw-bold text-danger mt-2">${parseFloat(p.precio || 0).toFixed(2)}</h4>
                                                {/* 🚫 AQUÍ SE QUITÓ EL BOTÓN ACTUALIZAR CONFORME A REGLA DE NEGOCIO */}
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    </div>
                )}

                {/* VISTA B: ASISTENCIA A PROBADORES COMPLETA */}
                {vistaActiva === 'probadores' && (
                    <div>
                        <h5 className="fw-bold mb-3 small" style={{ color: '#e91e63' }}>🚨 Solicitudes de Asistencia en Probadores</h5>
                        {asistencias.length === 0 ? (
                            <Alert variant="light" className="text-center border text-muted">No hay llamadas de probadores activas en este momento. 👍</Alert>
                        ) : (
                            asistencias.map((as, i) => (
                                <Alert variant="danger" key={i} className="d-flex justify-content-between align-items-center shadow-sm border-0 bg-opacity-10" style={{ backgroundColor: '#fff5f5', borderLeft: '5px solid #e91e63' }}>
                                    <div className="text-dark">
                                        🔥 <b>Llamada Urgente:</b> Cabina <b>{as.probador_id}</b> está solicitando un asesor.                                        <small className="text-muted">Estado: <Badge bg="warning">{as.estado}</Badge> | Recibido: {as.fecha_solicitud ? new Date(as.fecha_solicitud).toLocaleTimeString() : 'Ahora'}</small>
                                    </div>
                                    <Button size="sm" variant="danger" style={{ backgroundColor: '#e91e63', border: 'none' }} onClick={() => handleAtenderProbador(as.id)}>
                                        Markar Atendido ✓
                                    </Button>
                                </Alert>
                            ))
                        )}
                    </div>
                )}

                {/* VISTA C: TABLA INFORMATIVA DE DESCUENTOS */}
                {vistaActiva === 'descuentos' && (
                    <div>
                        <h5 className="fw-bold mb-3 small" style={{ color: '#e91e63' }}>🎟️ Lista de Descuentos Oficiales Configurados</h5>
                        <Table responsive hover size="sm" className="small text-center align-middle border">
                            <thead className="table-light">
                                <tr><th>Código ID</th><th>Nombre de Campaña</th><th>Porcentaje</th><th>Uso Permitido</th></tr>
                            </thead>
                            <tbody>
                                {descuentosCatalogo.map((d, i) => (
                                    <tr key={i}>
                                        <td><b>#D-{d.id}</b></td>
                                        <td className="fw-bold text-secondary">{d.nombre}</td>
                                        <td><Badge bg="purple" style={{ backgroundColor: '#7b1fa2' }}>{d.porcentaje}% OFF</Badge></td>
                                        <td className="text-muted text-start">{d.descripcion}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                )}

                {/* VISTA D: TERMINAL VENTAS (POS CON FILTRO DE SEGURIDAD) */}
                {vistaActiva === 'ventas' && (
                    <div className="animate__animated animate__fadeIn">
                        <h5 className="fw-bold mb-3 small" style={{ color: '#e91e63' }}>🛒 Módulo de Cobro Exprés</h5>
                        
                        <Form onSubmit={handleCompraDirectaVendedor} className="row g-2 mb-4 p-3 bg-light rounded align-items-end m-0 border">
                            <Col md={2}>
                                <Form.Label className="small fw-bold text-muted mb-1">ID Producto</Form.Label>
                                <Form.Control type="number" placeholder="Ej: 3" value={idProductoVenta} onChange={e => setIdProductoVenta(e.target.value)} size="sm" required />
                            </Col>
                            <Col md={2}>
                                <Form.Label className="small fw-bold text-muted mb-1">Cantidad</Form.Label>
                                <Form.Control type="number" placeholder="Pzs" value={cantidadVenta} onChange={e => setCantidadVenta(e.target.value)} size="sm" required />
                            </Col>
                            <Col md={3}>
                                <Form.Label className="small fw-bold text-muted mb-1">Descuento Especial</Form.Label>
                                <Form.Select 
                                    value={descuentoSeleccionado} 
                                    onChange={e => setDescuentoSeleccionado(e.target.value)} 
                                    size="sm"
                                    disabled={parseFloat(descuentoSeleccionado) > 0 && !descuentoAutorizado}
                                >
                                    <option value="0">Sin Descuento (0%)</option>
                                    <option value="10" disabled={!descuentoAutorizado}>Descuento Temporada (10%) 🔒</option>
                                    <option value="15" disabled={!descuentoAutorizado}>Venta Especial (15%) 🔒</option>
                                    <option value="20" disabled={!descuentoAutorizado}>Liquidación (20%) 🔒</option>
                                    <option value="50" disabled={!descuentoAutorizado}>Gran Outlet (50%) 🔒</option>
                                </Form.Select>
                            </Col>
                            
                            {/* 🔐 BOTÓN INTERACTIVO DE AUTORIZACIÓN PARA EL SUPERVISOR */}
                            <Col md={2}>
                                {descuentoAutorizado ? (
                                    <Badge bg="success" className="w-100 py-2 fs-7 block text-center">✓🔓 Aut: {supervisorNombre}</Badge>
                                ) : (
                                    <Button type="button" variant="dark" size="sm" className="w-100 fw-bold" onClick={() => setShowAuthModal(true)}>
                                        🔑 Autorizar Descuento
                                    </Button>
                                )}
                            </Col>
                            
                            <Col md={3}>
                                <Button type="submit" size="sm" className="w-100 fw-bold text-white shadow-sm" style={{ backgroundColor: '#e91e63', borderColor: '#e91e63' }}>
                                    💰 Realizar Compra
                                </Button>
                            </Col>
                        </Form>

                        {/* HISTORIAL DE VENTAS DEL TURNO DEL VENDEDOR */}
                        <h5 className="fw-bold mb-3 small mt-4" style={{ color: '#e91e63' }}>💰 Mis Ventas del Turno Activo</h5>
                        <Table responsive hover size="sm" className="small text-center align-middle mb-0 table-borderless border">
                            <thead className="table-light">
                                <tr><th>Folio</th><th>Descuento</th><th>Total Cobrado</th><th>Fecha y Hora</th></tr>
                            </thead>
                            <tbody>
                                {ventasData.length === 0 ? (
                                    <tr><td colSpan="4" className="text-muted py-3">No has registrado ventas en este turno de caja.</td></tr>
                                ) : (
                                    ventasData.map((venta, i) => (
                                        <tr key={i} className="border-bottom">
                                            <td className="fw-bold text-secondary">#V-{venta.id}</td>
                                            <td className="text-muted">${parseFloat(venta.descuento_aplicado || 0).toFixed(2)}</td>
                                            <td className="fw-bold text-success">${parseFloat(venta.total).toFixed(2)}</td>
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
                <Modal.Header closeButton className="border-0 pb-0"><Modal.Title className="fw-bold text-dark h6">🔒 Permiso de Supervisor</Modal.Title></Modal.Header>
                <Form onSubmit={handleVerVerify = handleVerificarAutorizacion}>
                    <Modal.Body className="py-3">
                        <Form.Group>
                            <Form.Label className="small text-muted fw-bold mb-2">Ingresa tu ID de Empleado (Gerente / Encargado):</Form.Label>
                            <Form.Control 
                                type="number" 
                                placeholder="Ej: 1" 
                                className="text-center fw-bold text-danger fs-5"
                                value={supervisorIdInput} 
                                onChange={e => setSupervisorIdInput(e.target.value)} 
                                required 
                                autoFocus 
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer className="border-0 pt-0">
                        <Button variant="light" size="sm" onClick={() => setShowAuthModal(false)}>Cancelar</Button>
                        <Button type="submit" variant="danger" size="sm" style={{ backgroundColor: '#e91e63', border: 'none' }} className="fw-bold">
                            Validar Llave 🔓
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
};

export default VendedorDashboard;