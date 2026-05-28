import React, { useState, useEffect } from 'react';
import { Row, Col, Table, Badge, Form, Alert, Button, Card, Modal, InputGroup } from 'react-bootstrap';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';

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

    // 🚛 ESTADO DE IMAGEN EXCLUSIVO PARA RECEPCIÓN DE MERCANCÍA VENDEDOR
    const [nuevaPrendaImagen, setNuevaPrendaImagen] = useState('');

    const usuarioActivo = localStorage.getItem('username') || 'sherlyn';
    const rolActivo = localStorage.getItem('userRole') || 'vendedor';
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

    // 🔄 LÓGICA DE TRANSFORMACIÓN DE IMAGEN A BASE64 PARA LA NUEVA MERCANCÍA
    const handleFileChangeVendedor = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNuevaPrendaImagen(String(reader.result));
            };
            reader.readAsDataURL(file);
        }
    };

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
    try {
        const res = await fetch(`http://34.219.103.28:3000/api/productos/asistencia/atender/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify({ usuario_id: 4 }) // Mandamos el ID de Sherlyn u operador activo
        });
        if (res.ok) {
            Swal.fire('✓ Finalizado', 'Asistencia completada con éxito en la base de datos.', 'success');
            sincronizarVendedor();
        }
    } catch (err) {
        console.error(err);
    }
};
    const handleRecibirProbador = async (id) => {
    try {
        const res = await fetch(`http://34.219.103.28:3000/api/productos/asistencia/recibir/${id}`, {
            method: 'PUT',
            headers: { ...getAuthHeaders() }
        });
        if (res.ok) {
            Swal.fire('📩 Recibido', 'Le hemos notificado al cliente que vas en camino.', 'info');
            sincronizarVendedor();
        }
    } catch (err) {
        console.error(err);
    }
};

    const styles = {
        mainContainer: { borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' },
        headerSection: { background: 'linear-gradient(135deg, #c2185b 0%, #ad1457 100%)', padding: '24px', margin: '0', border: 'none' },
        footer: { background: 'linear-gradient(135deg, #c2185b 0%, #ad1457 100%)', color: '#ffffff', padding: '18px 24px', marginTop: '20px', textAlign: 'center' },
        menuBtn: { fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '6px', borderRadius: '8px', padding: '10px 20px', border: 'none', display: 'block', width: 'auto', backgroundColor: '#fff', color: '#e91e63', transition: 'all 0.2s' },
        contentArea: { backgroundColor: '#ffffff', padding: '35px', minHeight: '60vh', border: 'none' },
        cardBoutique: { border: '1px solid #f8bbd0', borderRadius: '14px', overflow: 'hidden' }
    };

    return (
        <div className="dashboard-responsive w-100 px-1" style={styles.mainContainer}>
            {/* BANNER DE BIENVENIDA ASESOR */}
            <header style={styles.headerSection}>
                <Row className="align-items-center m-0 w-100 flex-column flex-md-row">
                    <Col className="p-0 text-center text-md-start">
                        <h1 className="fw-bold m-0 text-white" style={{ fontSize: '2.1rem', letterSpacing: '0.5px' }}>
                            Panel de Piso de Venta: {usuarioActivo.toUpperCase()} 👑
                        </h1>
                    </Col>
                    <Col className="p-0 text-center text-md-end mt-3 mt-md-0" style={{ minWidth: '160px' }}>
                        <Button
                            variant="light"
                            onClick={handleLogout}
                            style={{ borderRadius: '20px', padding: '8px 20px', paddingTop: '6px', fontSize: '1.05rem', fontWeight: 'bold', color: '#e91e63' }}
                        >
                            Cerrar Sesión
                        </Button>
                    </Col>
                </Row>
            </header>

            {/* MENÚ DE OPCIONES ADAPTATIVO CON RECEPCIÓN AGREGADO */}
            <nav className="dashboard-menu" style={{ maxWidth: '100%', margin: 0 }}>
                <button type="button" className={`dashboard-menu-button flex-shrink-0 ${vistaActiva === 'inventario' ? 'active' : ''}`} onClick={() => { setVistaActiva('inventario'); sincronizarVendedor(); }}>
                    👗 Catálogo de Prendas
                </button>
                <button type="button" className={`dashboard-menu-button flex-shrink-0 ${vistaActiva === 'mercancia' ? 'active' : ''}`} onClick={() => { setVistaActiva('mercancia'); setNuevaPrendaImagen(''); }}>
                    🚛 Recepción de Mercancía
                </button>
                <button type="button" className={`dashboard-menu-button flex-shrink-0 ${vistaActiva === 'probadores' ? 'active' : ''}`} onClick={() => { setVistaActiva('probadores'); sincronizarVendedor(); }}>
                    🔔 Alertas Probadores {asistencias.length > 0 && <Badge bg="danger" className="ms-1 fs-6">{asistencias.length}</Badge>}
                </button>
                <button type="button" className={`dashboard-menu-button flex-shrink-0 ${vistaActiva === 'descuentos' ? 'active' : ''}`} onClick={() => { setVistaActiva('descuentos'); sincronizarVendedor(); }}>
                    🎟️ Lista de Promociones
                </button>
                <button type="button" className={`dashboard-menu-button flex-shrink-0 ${vistaActiva === 'ventas' ? 'active' : ''}`} onClick={() => { setVistaActiva('ventas'); sincronizarVendedor(); }}>
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
                                                
                                                {/* LADO IZQUIERDO: DETALLES TEXTUALES */}
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

                                                {/* LADO DERECHO: FOTOGRAFÍA COMODA */}
                                                <Col xs={5} className="d-flex align-items-center justify-content-center bg-light border-start" style={{ borderColor: '#f8bbd0' }}>
                                                    <div className="w-100 d-flex justify-content-center align-items-center p-2" style={{ height: '100%', minHeight: '230px', backgroundColor: '#fffdfd' }}>
                                                        <Card.Img 
                                                            src={imagenSrc} 
                                                            style={{ maxHeight: '210px', maxWidth: '100%', width: 'auto', height: 'auto', objectFit: 'contain' }} 
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

                {/* 🚛 NUEVA VISTA EXTRA: RECEPCIÓN DE MERCANCÍA PARA EL VENDEDOR (LETRA GRANDE) */}
                {vistaActiva === 'mercancia' && (
                    <div
                        className="mx-auto animate__animated animate__fadeIn"
                        style={{
                            maxWidth: '900px',
                            background: '#e68fbf',
                            borderRadius: '18px',
                            padding: '35px',
                            border: '1px solid #f8bbd0',
                            boxShadow: '0 4px 18px rgba(0,0,0,0.05)',
                            fontSize: '1.05rem'
                        }}
                    >
                        <div className="mb-4 text-center pb-2 border-bottom">
                            <h3 className="fw-bold mb-1" style={{ color: '#ad1457' }}>Agregar Nueva Prenda</h3>
                        </div>

                        <Form onSubmit={async (e) => {
                            e.preventDefault();
                            const form = e.target;
                            
                            const tagsInput = form.tags.value;
                            const tagsArray = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag !== '') : ['nueva_temporada'];

                            try {
                                const response = await fetch('http://34.219.103.28:3000/api/productos', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                                    body: JSON.stringify({
                                        nombre: form.nombre.value,
                                        precio: parseFloat(form.precio.value),
                                        stock: parseInt(form.stock.value),
                                        talla: form.talla.value,
                                        color: form.color.value,
                                        categoria: form.categoria.value,
                                        descripcion: form.descripcion.value,
                                        imagen_url: nuevaPrendaImagen,
                                        tags: tagsArray,
                                        usuario: usuarioActivo,
                                        rol: rolActivo
                                    })
                                });
                                
                                if (response.ok) {
                                    Swal.fire('¡Mercancía Inyectada!', `Prenda registrada con éxito en el inventario global cloud.`, 'success');
                                    form.reset();
                                    setNuevaPrendaImagen('');
                                    sincronizarVendedor();
                                } else {
                                    Swal.fire('⚠️ Servidor', 'No se pudo guardar la prenda. Revisa la red.', 'error');
                                }
                            } catch (err) { 
                                console.error(err);
                                Swal.fire('❌ Error', 'Error de comunicación con AWS RDS.', 'error'); 
                            }
                        }}>
                            <Row className="g-3 mb-3">
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label className="fw-bold text-muted">Nombre del Artículo</Form.Label>
                                        <Form.Control type="text" name="nombre" required placeholder="Ej: Vestido Gala Satinado" className="form-control-lg" />
                                    </Form.Group>
                                </Col>
                                <Col md={3}><Form.Group><Form.Label className="fw-bold text-muted">Precio Venta ($)</Form.Label><Form.Control type="number" step="0.01" name="precio" required className="form-control-lg text-center" /></Form.Group></Col>
                                <Col md={3}><Form.Group><Form.Label className="fw-bold text-muted">Cantidad Inicial</Form.Label><Form.Control type="number" name="stock" required className="form-control-lg text-center" /></Form.Group></Col>
                            </Row>

                            <Row className="g-3 mb-3">
                                <Col md={4}>
                                    <Form.Group>
                                        <Form.Label className="fw-bold text-muted">Talla Base</Form.Label>
                                        <Form.Select name="talla" className="form-select-lg"><option value="S">S</option><option value="M">M</option><option value="L">L</option></Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={4}><Form.Group><Form.Label className="fw-bold text-muted">Color Temático</Form.Label><Form.Control type="text" name="color" placeholder="Negro, Arena..." required className="form-control-lg" /></Form.Group></Col>
                                <Col md={4}><Form.Group><Form.Label className="fw-bold text-muted">Categoría en Tienda</Form.Label><Form.Control type="text" name="categoria" placeholder="Pantalones, Tops..." required className="form-control-lg" /></Form.Group></Col>
                            </Row>

                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold text-muted">Fotografía de la Prenda (Conversión automática)</Form.Label>
                                <Form.Control type="file" accept="image/*" onChange={handleFileChangeVendedor} className="form-control-lg" />
                                {nuevaPrendaImagen && (
                                    <div className="mt-3 text-center bg-light p-2 rounded border">
                                        <img src={nuevaPrendaImagen} alt="Vista previa" style={{ height: '140px', borderRadius: '8px', objectFit: 'contain' }} />
                                    </div>
                                )}
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold text-muted">Etiquetas (`tags` - Separados por comas)</Form.Label>
                                <Form.Control type="text" name="tags" placeholder="lino, fresco, playa" className="form-control-lg" />
                            </Form.Group>

                            <Form.Group className="mb-4">
                                <Form.Label className="fw-bold text-muted">Descripción Corta</Form.Label>
                                <Form.Control as="textarea" rows={2} name="descripcion" placeholder="Detalles de composición o corte..." className="form-control-lg" />
                            </Form.Group>

                            <Button type="submit" className="w-100 fw-bold py-3 text-white shadow" style={{ backgroundColor: '#ad1457', border: 'none', borderRadius: '10px', fontSize: '1.15rem' }}>
                                📦 Guardar Nuevo Producto.
                            </Button>
                        </Form>
                    </div>
                )}

                {/* VISTA B: PROBADORES */}
                {vistaActiva === 'probadores' && (
                    <div>
                        <h4 className="fw-bold mb-4" style={{ color: '#e91e63' }}>🚨 Solicitudes de Asistencia en Probadores</h4>
                        {asistencias.length === 0 ? (
                            <Alert variant="light" className="text-center border text-muted py-4 fs-5">No hay llamadas de probadores activas en este momento. 👍</Alert>
                        ) : (
                            asistencias.map((as, i) => {
                                const esAtendido = as.estado === 'atendido';

                                // Definimos los estilos en línea dinámicos para el estado verde suave
                                const alertStyle = {
                                    backgroundColor: esAtendido ? '#e8f5e9' : '#fff5f5', 
                                    borderLeft: esAtendido ? '6px solid #a5d6a7' : '6px solid #e91e63',
                                    fontSize: '1.15rem',
                                    opacity: esAtendido ? 0.8 : 1 // Efecto visual deshabilitado sutil
                                };

                                return (
                                    <Alert 
                                        key={i} 
                                        className="d-flex justify-content-between align-items-center shadow-sm border-0 py-3" 
                                        style={alertStyle}
                                    >
                                        <div className="text-dark">
                                            🔥 <b>Llamada Urgente:</b> Cabina <b className={esAtendido ? "fs-4 text-success" : "fs-4 text-danger"}>{as.probador_id}</b> {esAtendido ? 'fue atendida con éxito.' : 'está solicitando un asesor.'}
                                            <br/>
                                            {/* 💬 Renderizado dinámico del mensaje enviado por el cliente */}
                                            <small className="text-muted fs-6 d-block my-1">
                                                📂 Mensaje: "{as.nota || 'Sin nota adjunta.'}"
                                            </small>
                                            <small className="text-muted fs-6">
                                                Estado: {' '}
                                                <Badge bg={as.estado === 'pendiente' ? 'danger' : as.estado === 'recibido' ? 'warning' : 'success'}>
                                                    {as.estado.toUpperCase()}
                                                </Badge>
                                                {' '} | Hora: {as.fecha_solicitud ? new Date(as.fecha_solicitud).toLocaleTimeString() : 'Ahora'}
                                            </small>
                                        </div>

                                        <div className="d-flex gap-2">
                                            <Button 
                                                size="md" 
                                                variant="warning" 
                                                className="fw-bold px-3 text-dark" 
                                                onClick={() => handleRecibirProbador(as.id)}
                                                disabled={as.estado !== 'pendiente'}
                                            >
                                                {as.estado === 'pendiente' ? '📩 Marcar Recibido' : 'Recibido'}
                                            </Button>
                                            <Button 
                                                size="md" 
                                                variant="success" 
                                                className="fw-bold px-3 text-white" 
                                                onClick={() => handleAtenderProbador(as.id)}
                                                disabled={esAtendido}
                                            >
                                                {esAtendido ? 'Atendido ✓' : 'Marcar Atendido ✓'}
                                            </Button>
                                        </div>
                                    </Alert>
                                );
                            })
                        )}
                    </div>
                )}

                {/* VISTA C: TABLA DE DESCUENTOS */}
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

                {/* VISTA D: TERMINAL VENTAS */}
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
                                ) }
                            </Col>
                            
                            <Col md={3}>
                                <Button type="submit" className="w-100 fw-bold py-2 btn-lg text-white shadow" style={{ backgroundColor: '#e91e63', borderColor: '#e91e63', fontSize: '1.15rem' }}>
                                    💰 Realizar Compra
                                </Button>
                            </Col>
                        </Form>

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

            {/* ====== MODAL INTERACTIVO: ID SUPERVISOR ====== */}
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
            <footer className="dashboard-footer">
                <div className="dashboard-footer-title">© 2026 SmartBoutique</div>
                <div className="dashboard-footer-subtitle">Panel de ventas premium • Punto de venta inteligente</div>
                <div className="dashboard-footer-legal">Infraestructura Global Conectada a AWS RDS Postgres v15 • Sistema en Línea Activo</div>
            </footer>
        </div>
    );
};

export default VendedorDashboard;