import React, { useState, useEffect } from 'react';
import { Row, Col, Table, Badge, Form, Alert, Button, Card, Modal, InputGroup } from 'react-bootstrap';
import Swal from 'sweetalert2';

const EncargadoDashboard = () => {
    const [recentActivity, setRecentActivity] = useState([]);
    const [productos, setProductos] = useState([]);
    const [ventasData, setVentasData] = useState([]);
    const [devolucionesData, setDevolucionesData] = useState([]);
    const [movimientosCajaData, setMovimientosCajaData] = useState([]);
    const [alertMessage, setAlertMessage] = useState(null);

    // Control de lienzo dinámico central idéntICO al de Admin
    const [vistaActiva, setVistaActiva] = useState('bienvenida');
    
    // Estados para el modal del ticket individual
    const [showTicketModal, setShowTicketModal] = useState(false);
    const [detallesTicket, setDetallesTicket] = useState([]);
    const [folioSeleccionado, setFolioSeleccionado] = useState('');

    // Estados para la terminal de ventas exprés
    const [idProductoVenta, setIdProductoVenta] = useState('');
    const [cantidadVenta, setCantidadVenta] = useState('');
    const [descuentoSeleccionado, setDescuentoSeleccionado] = useState('0');

    // Estados para el arqueo de caja chica
    const [showModalAbrir, setShowModalAbrir] = useState(false);
    const [montoInicialInput, setMontoInicialInput] = useState('');

    // Formulario de Inserción de Productos (Recepción de Mercancía)
    const [nombre, setNombre] = useState('');
    const [precio, setPrecio] = useState('');
    const [stock, setStock] = useState('');
    const [talla, setTalla] = useState('M');
    const [editProdColor, setEditProdColor] = useState('');
    const [editProdCategoria, setEditProdCategoria] = useState('');
    const [editProdDescripcion, setEditProdDescripcion] = useState('');
    const [editProdImagen, setEditProdImagen] = useState('');
    const [editProdTags, setEditProdTags] = useState('');

    // Estados para la actualización flotante de prendas
    const [showProdModal, setShowProdModal] = useState(false);
    const [selectedProd, setSelectedProd] = useState(null);
    const [editProdNombre, setEditProdNombre] = useState('');
    const [editProdPrecio, setEditProdPrecio] = useState('');
    const [editProdStock, setEditProdStock] = useState('');
    const [editProdTalla, setEditProdTalla] = useState('M');

    const usuarioActivo = localStorage.getItem('username') || 'lesly';
    const rolActivo = localStorage.getItem('userRole') || 'encargado';

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        if (!token) return {};
        return { 'Authorization': `Bearer ${token}` };
    };

    // Sincronización robusta con AWS RDS
    const cargarDatosEncargado = async () => {
        try {
            const authHeaders = getAuthHeaders();
            
            const resAudit = await fetch('http://34.219.103.28:3000/api/productos/auditoria');
            if (resAudit.ok) setRecentActivity(await resAudit.json());

            const resProd = await fetch('http://34.219.103.28:3000/api/productos');
            if (resProd.ok) setProductos(await resProd.json());

            const resVentas = await fetch('http://34.219.103.28:3000/api/productos/ventas', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json', 'username': usuarioActivo, ...authHeaders }
            });
            if (resVentas.ok) setVentasData(await resVentas.json());

            const resDev = await fetch('http://34.219.103.28:3000/api/productos/devoluciones', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json', 'username': usuarioActivo, ...authHeaders }
            });
            if (resDev.ok) setDevolucionesData(await resDev.json());

            const resCaja = await fetch('http://34.219.103.28:3000/api/productos/movimientos-caja', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json', 'username': usuarioActivo, ...authHeaders }
            });
            if (resCaja.ok) setMovimientosCajaData(await resCaja.json());

        } catch (error) {
            console.error("Error de conectividad AWS RDS en panel Encargado:", error);
        }
    };

    useEffect(() => { cargarDatosEncargado(); }, []);

    useEffect(() => {
        if (vistaActiva === 'mercancia') {
            setNombre(''); setPrecio(''); setStock(''); setTalla('M');
            setEditProdColor(''); setEditProdCategoria(''); setEditProdDescripcion('');
            setEditProdImagen(''); setEditProdTags('');
        }
    }, [vistaActiva]);

    // LÓGICA DE VENTAS REUTILIZADA DEL ADMIN
    const handleCompraDirectaEncargado = async (e) => {
        e.preventDefault();

        const productoExiste = productos.find(p => p.id === parseInt(idProductoVenta));
        if (!productoExiste) {
            Swal.fire('⚠️ Atención', 'El ID del producto no existe en el catálogo.', 'warning');
            return;
        }
        
        if (parseInt(cantidadVenta) > productoExiste.stock) {
            Swal.fire('⚠️ Stock Insuficiente', `Solo quedan ${productoExiste.stock} pz.`, 'error');
            return;
        }

        const precioCatalogo = parseFloat(productoExiste.precio);
        const porcentajeDescuento = parseFloat(descuentoSeleccionado); 
        const descuentoPorPieza = precioCatalogo * (porcentajeDescuento / 100);
        const precioConDescuento = precioCatalogo - descuentoPorPieza;
        
        const totalCobradoFinal = parseInt(cantidadVenta) * precioConDescuento;
        const totalDineroDescontado = parseInt(cantidadVenta) * descuentoPorPieza;

        const datosVenta = {
            total: totalCobradoFinal,
            descuento_aplicado: totalDineroDescontado, 
            usuario_id: 3, // ID de lesly en base de datos
            carrito: [{ producto_id: productoExiste.id, cantidad: parseInt(cantidadVenta), precio_unitario: precioConDescuento }]
        };

        try {
            const res = await fetch('http://34.219.103.28:3000/api/productos/registrar-venta', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify(datosVenta)
            });

            if (res.ok) {
                const data = await res.json();
                setIdProductoVenta('');
                setCantidadVenta('');
                setDescuentoSeleccionado('0'); 
                await cargarDatosEncargado(); 
                
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: `Venta registrada con éxito (Folio #V-${data.venta_id})`,
                    showConfirmButton: false,
                    timer: 2000,
                    timerProgressBar: true
                });
            }
        } catch (error) {
            Swal.fire('❌ Error', 'Error de comunicación con el servidor.', 'error');
        }
    };

    // VER DETALLES DE TICKET MODAL INDIVIDUAL
    const handleVerDetallesTicket = async (id) => {
        try {
            setFolioSeleccionado(id);
            const res = await fetch(`http://34.219.103.28:3000/api/productos/ventas/detalles/${id}`, {
                method: 'GET',
                headers: getAuthHeaders()
            });
            if (res.ok) {
                setDetallesTicket(await res.json()); 
                setShowTicketModal(true);
            }
        } catch (error) {
            console.error(error);
        }
    };

    // INYECTAR NUEVA MERCANCÍA AL CATÁLOGO GLOBAL
    const handleAddProductEncargado = async (e) => {
        e.preventDefault();
        try {
            const tagsArray = typeof editProdTags === 'string'
                ? editProdTags.split(',').map(tag => tag.trim()).filter(tag => tag !== '')
                : Array.isArray(editProdTags) ? editProdTags : [];

            const response = await fetch('http://34.219.103.28:3000/api/productos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre, precio: parseFloat(precio), stock: parseInt(stock), talla,
                    color: editProdColor, categoria: editProdCategoria, descripcion: editProdDescripcion,
                    imagen_url: editProdImagen, tags: tagsArray.length > 0 ? tagsArray : ['nueva_temporada'],
                    usuario: usuarioActivo, rol: rolActivo
                })
            });
            if (response.ok) {
                setAlertMessage(`¡Prenda "${nombre}" inyectada con éxito! ✨`);
                setVistaActiva('inventario');
                cargarDatosEncargado();
            }
        } catch (error) {
            setAlertMessage('Error de comunicación con el servidor.');
        }
    };

    // PRECARGAR FORMULARIO MODAL DE PRODUCTO (CON BOTÓN DE ACTUALIZAR ACTUAL)
    const abrirFormularioProducto = (p) => {
        setSelectedProd(p);
        setEditProdNombre(p.nombre || '');
        setEditProdPrecio(p.precio || '');
        setEditProdStock(p.stock || 0);
        setEditProdTalla(p.talla || 'M');
        setEditProdColor(p.color || 'Multicolor');
        setEditProdCategoria(p.categoria || 'General');
        setEditProdDescripcion(p.descripcion || '');
        const currentImg = p.imagen_url || '';
        setEditProdImagen(currentImg.includes('[object Object]') ? '' : currentImg);
        setEditProdTags(p.tags && Array.isArray(p.tags) ? p.tags.join(', ') : '');
        setShowProdModal(true);
    };

    // CONVERSIÓN AUTOMÁTICA A BASE64 EN FLOTANTE
    const handleFileChange = (e) => {
        const file = e.target.files[0]; 
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setEditProdImagen(String(reader.result)); 
            reader.readAsDataURL(file); 
        }
    };

    // GUARDAR CAMBIOS DE EDICIÓN FLOTANTE PRENDAS
    const handleSaveEditProduct = async (e) => {
        e.preventDefault();
        try {
            const tagsArray = editProdTags.split(',').map(t => t.trim()).filter(t => t !== '');
            let imagenAEnviar = editProdImagen;
            if (typeof imagenAEnviar === 'object' || imagenAEnviar.includes('[object Object]')) {
                imagenAEnviar = '';
            }

            const response = await fetch(`http://34.219.103.28:3000/api/productos/${selectedProd.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre: editProdNombre, precio: parseFloat(editProdPrecio), stock: parseInt(editProdStock),
                    talla: editProdTalla, color: editProdColor, categoria: editProdCategoria,
                    descripcion: editProdDescripcion, imagen_url: imagenAEnviar, tags: tagsArray
                })
            });

            if (response.ok) {
                setAlertMessage(`¡Cambios guardados en "${editProdNombre}" exitosamente! 📝`);
                setShowProdModal(false);
                cargarDatosEncargado(); 
            }
        } catch (error) {
            console.error(error);
        }
    };

    // APERTURA Y ARQUEO DE CAJA
    const handleAbrirCajaDefinitivo = async (e) => {
        e.preventDefault();
        const fondoNum = parseFloat(montoInicialInput);
        if (isNaN(fondoNum) || fondoNum < 0) return;

        try {
            const response = await fetch('http://34.219.103.28:3000/api/productos/movimientos-caja/abrir-caja', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({ usuario_id: 3, monto_inicial: fondoNum })
            });
            if (response.ok) {
                Swal.fire('¡Turno Abierto!', `Fondo inicial registrado: $${fondoNum.toFixed(2)}`, 'success');
                setShowModalAbrir(false);
                setMontoInicialInput('');
                cargarDatosEncargado();
            }
        } catch (error) { console.error(error); }
    };

    const handleCerrarCaja = async () => {
        Swal.fire({
            title: '¿Realizar corte de caja?',
            text: "Se sumarán todas las transacciones de este turno.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d32f2f',
            confirmButtonText: 'Sí, cerrar caja 🔒'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await fetch('http://34.219.103.28:3000/api/productos/movimientos-caja/cerrar-caja', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                        body: JSON.stringify({ usuario_id: 3 }) 
                    });
                    const data = await response.json();
                    if (response.ok) {
                        Swal.fire({
                            title: '¡Caja Cerrada!',
                            html: `<div style="text-align: left; font-size: 16px;">💰 <b>Ventas:</b> $${data.ventas_del_dia.toFixed(2)}<br/>💵 <b>Total Caja:</b> $${data.monto_final.toFixed(2)}</div>`,
                            icon: 'success'
                        });
                        cargarDatosEncargado();
                    }
                } catch (e) { console.error(e); }
            }
        });
    };

    const handleImprimirTicketCorte = async (datosCaja) => {
        try {
            const response = await fetch(`http://34.219.103.28:3000/api/productos/movimientos-caja/detalles-ticket/${datosCaja.id}`, {
                method: 'GET', headers: getAuthHeaders()
            });
            const articulosVendidos = await response.json();
            const fondoInicial = parseFloat(datosCaja.monto_inicial) || 0;
            const montoFinal = parseFloat(datosCaja.monto_final) || 0;
            const totalVentas = montoFinal > 0 ? (montoFinal - fondoInicial) : 0;

            const ventanaImpresion = window.open('', '_blank', 'width=420,height=700,scrollbars=yes');
            ventanaImpresion.document.write(`
                <html>
                <head>
                    <title>Ticket de Corte - #C-${datosCaja.id}</title>
                    <style>
                        body { font-family: 'Courier New', monospace; width: 300px; margin: 0 auto; padding: 20px 10px; font-size: 13px; }
                        .text-center { text-align: center; }
                        .fw-bold { font-weight: bold; }
                        .linea-divisoria { border-top: 1px dashed #000; margin: 8px 0; }
                        .flex-justify { display: flex; justify-content: space-between; }
                        .grand-total { font-size: 14px; font-weight: bold; border: 1px solid #000; padding: 4px; }
                    </style>
                </head>
                <body>
                    <div class="text-center">
                        <h3 style="margin:0;">✨ SmartBoutique ✨</h3>
                        <p style="margin:2px 0; font-size:11px;">SUPERVISIÓN DE SUCURSAL</p>
                    </div>
                    <div class="linea-divisoria"></div>
                    <div class="text-center fw-bold">📜 REPORTE DE ARQUEO DE CAJA</div>
                    <div style="font-size:12px; margin-top:6px;">
                        <div><b>Folio Corte:</b> #C-${datosCaja.id}</div>
                        <div><b>Encargado:</b> lesly</div>
                        <div><b>Estado:</b> ${datosCaja.estado.toUpperCase()}</div>
                    </div>
                    <div class="linea-divisoria"></div>
                    <table style="width:100%; font-size:12px;">
                        ${articulosVendidos.map(art => `<tr><td>${art.cantidad}x ${art.prenda}</td><td style="text-align:right;">$${parseFloat(art.subtotal).toFixed(2)}</td></tr>`).join('')}
                    </table>
                    <div class="linea-divisoria"></div>
                    <div class="flex-justify"><span>(+) FONDO INICIAL:</span><span>$${fondoInicial.toFixed(2)}</span></div>
                    <div class="flex-justify"><span>(+) VENTAS TURNO:</span><span class="fw-bold">$${totalVentas.toFixed(2)}</span></div>
                    <div class="linea-divisoria"></div>
                    <div class="flex-justify grand-total"><span>(=) ARQUEO TOTAL:</span><span>$${montoFinal > 0 ? montoFinal.toFixed(2) : fondoInicial.toFixed(2)}</span></div>
                    <script>window.print();</script>
                </body>
                </html>
            `);
            ventanaImpresion.document.close();
        } catch (e) { console.error(e); }
    };

    const styles = {
        mainContainer: { borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' },
        headerSection: { background: 'linear-gradient(135deg, #c2185b 0%, #ad1457 100%)', padding: '26px', margin: '0', border: 'none' },
        contentArea: { backgroundColor: '#ffffff', padding: '35px', minHeight: '65vh', height: '100%', border: 'none' },
        menuBtn: { fontSize: '1.15rem', textAlign: 'left', fontWeight: 'bold', marginBottom: '6px', borderRadius: '8px', padding: '12px 14px', border: 'none', display: 'block', width: '100%' },
        cardBoutique: { border: '1px solid #f8bbd0', borderRadius: '14px', overflow: 'hidden' }
    };

    return (
        <div className="w-100 px-1" style={styles.mainContainer}>
            {/* BANNER DE BIENVENIDA SUPERVISOR */}
            <header style={styles.headerSection}>
                <Row className="text-center align-items-center m-0 w-100">
                    <Col className="p-0">
                        <h1 className="fw-bold m-0 text-white" style={{ fontSize: '2.1rem', letterSpacing: '0.5px' }}>
                            Panel Supervisor: Encargado de Tienda ({usuarioActivo.toUpperCase()}) 🔑
                        </h1>
                    </Col>
                </Row>
            </header>

            {/* BARRA DE NAVEGACIÓN COMPARTIDA (LETRA ROBUSTA) */}
            <nav className="d-flex justify-content-center align-items-center flex-wrap gap-3 my-3 p-2 bg-light rounded shadow-sm mx-auto" style={{ maxWidth: '95%' }}>                
                <button 
                    style={{ ...styles.menuBtn, width: 'auto', padding: '10px 22px', margin: 0, backgroundColor: vistaActiva === 'inventario' ? '#c2185b' : '#fff', color: vistaActiva === 'inventario' ? '#ffffff' : '#c2185b' }} 
                    onClick={() => { setVistaActiva('inventario'); cargarDatosEncargado(); }}
                >
                    👗 Prendas
                </button>
                <button 
                    style={{ ...styles.menuBtn, width: 'auto', padding: '10px 22px', margin: 0, backgroundColor: vistaActiva === 'mercancia' ? '#c2185b' : '#fff', color: vistaActiva === 'mercancia' ? '#fff' : '#c2185b' }} 
                    onClick={() => { setVistaActiva('mercancia'); cargarDatosEncargado(); }}
                >
                    🚛 Recepción de Mercancía
                </button>
                
                <button 
                    style={{ ...styles.menuBtn, width: 'auto', padding: '10px 22px', margin: 0, backgroundColor: vistaActiva === 'devoluciones' ? '#c2185b' : '#fff', color: vistaActiva === 'devoluciones' ? '#fff' : '#c2185b' }} 
                    onClick={() => { setVistaActiva('devoluciones'); cargarDatosEncargado(); }}
                >
                    ↩️ Devoluciones
                </button>
                <button 
                    style={{ ...styles.menuBtn, width: 'auto', padding: '10px 22px', margin: 0, backgroundColor: vistaActiva === 'ventas' ? '#c2185b' : '#fff', color: vistaActiva === 'ventas' ? '#fff' : '#c2185b' }} 
                    onClick={() => { setVistaActiva('ventas'); cargarDatosEncargado(); }}
                >
                    🛍️ Ventas
                </button>
                <button 
                    style={{ ...styles.menuBtn, width: 'auto', padding: '10px 22px', margin: 0, backgroundColor: vistaActiva === 'caja' ? '#c2185b' : '#fff', color: vistaActiva === 'caja' ? '#fff' : '#c2185b' }} 
                    onClick={() => { setVistaActiva('caja'); cargarDatosEncargado(); }}
                >
                    💵 Control de Caja
                </button>
            </nav>

            {alertMessage && <Alert variant="success" onClose={() => setAlertMessage(null)} dismissible className="m-0 rounded-0 py-2 fs-5">{alertMessage}</Alert>}

            <div style={styles.contentArea}>
                {vistaActiva === 'bienvenida' && (
                    <div className="text-center py-5">
                        <div style={{ fontSize: '5rem' }}>✨</div>
                        <h3 className="fw-bold mt-3" style={{ color: '#c2185b' }}>Terminal de Supervisión Operativa Lista</h3>
                        <p className="text-muted" style={{ fontSize: '1.1rem' }}>Gestión de inventarios locales, incidencias de piso, rebajas y arqueos de caja rápidos.</p>
                    </div>
                )}

                {/* VISTA A: CATÁLOGO DE PRENDAS VERTICAL (IGUAL AL ADMIN CON BOTÓN DE ACTUALIZAR) */}
                {vistaActiva === 'inventario' && (
                    <div>
                        <h4 className="fw-bold mb-4" style={{ color: '#c2185b' }}>👗 Catálogo de Prendas en Existencia</h4>
                        <Row className="g-4">
                            {productos.map((p, i) => {
                                const fallbackImg = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'><rect width='100%' height='100%' fill='%23fce4ec'/><text x='50%' y='50%' font-family='sans-serif' font-size='14' fill='%23ad1457' text-anchor='middle'>Prenda SmartBoutique</text></svg>";
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
                                    <Col xs={12} md={6} lg={4} key={i} className="d-flex">
                                        <Card style={styles.cardBoutique} className="shadow-sm border-0 w-100 d-flex flex-column rounded-4 bg-white overflow-hidden">
                                            <div className="d-flex justify-content-center align-items-center p-3 bg-light" style={{ height: '220px', overflow: 'hidden', backgroundColor: '#fffdfd', borderBottom: '1px solid #f8bbd0' }}>
                                                <Card.Img variant="top" src={imagenSrc} style={{ maxHeight: '100%', maxWidth: '100%', width: 'auto', height: 'auto', objectFit: 'contain' }} onError={(e) => { e.target.src = fallbackImg; }} />
                                            </div>
                                            <Card.Body className="d-flex flex-column justify-content-between p-3" style={{ fontSize: '1.05rem' }}>
                                                <div>
                                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                                        <span className="text-muted fw-bold text-uppercase" style={{ fontSize: '0.85rem' }}>{p.categoria || 'Moda'}</span>
                                                        <Badge bg="light" text="dark" className="border">ID: #{p.id}</Badge>
                                                    </div>
                                                    <Card.Title className="fw-bold text-dark fs-5 mb-1 text-truncate">{p.nombre}</Card.Title>
                                                    <Card.Text className="text-muted mb-3 text-truncate-2" style={{ fontSize: '0.92rem', minHeight: '40px', lineHeight: '1.3' }}>{p.descripcion || 'Sin descripción asignada todavía.'}</Card.Text>
                                                    <div className="d-flex flex-wrap gap-1 mb-3">
                                                        <Badge bg="dark" className="px-2 py-1 small">Talla: {p.talla || 'M'}</Badge>
                                                        <Badge bg="secondary" className="px-2 py-1 small">Color: {p.color || 'Unicolor'}</Badge>
                                                        <Badge bg={p.stock > 10 ? 'success' : 'danger'} className="px-2 py-1 small">Stock: {p.stock} pz</Badge>
                                                    </div>
                                                </div>
                                                <div className="mt-auto pt-2">
                                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                                        <div className="d-flex flex-wrap gap-1" style={{ maxWidth: '60%' }}>
                                                            {tagsArray.slice(0, 2).map((t, idx) => <Badge key={idx} bg="light" text="secondary" className="border small">#{t}</Badge>)}
                                                        </div>
                                                        <div className="text-end">
                                                            <span className="d-block text-muted" style={{ fontSize: '0.65rem', fontWeight: 'bold' }}>PRECIO PISO</span>
                                                            <h4 className="fw-bold text-danger m-0 font-monospace" style={{ fontSize: '1.45rem' }}>${parseFloat(p.precio || 0).toFixed(2)}</h4>
                                                        </div>
                                                    </div>
                                                    {/* ⚙️ EL ENCARGADO SÍ CUENTA CON PRIVILEGIO DE ACTUALIZAR PRENDA */}
                                                    <Button style={{ backgroundColor: '#c2185b', borderColor: '#c2185b', borderRadius: '8px', fontSize: '1rem' }} className="w-100 fw-bold py-2 text-white shadow-sm mt-2" onClick={() => abrirFormularioProducto(p)}>
                                                        ⚙ Actualizar Prenda
                                                    </Button>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                );
                            })}
                        </Row>
                    </div>
                )}

                {/* VISTA B: RECEPCIÓN DE MERCANCÍA INTEGRAL */}
                {vistaActiva === 'mercancia' && (
                    <div className="mx-auto animate__animated animate__fadeIn" style={{ maxWidth: '900px', background: '#e68fbf', borderRadius: '18px', padding: '35px', border: '1px solid #f8bbd0', boxShadow: '0 4px 18px rgba(0,0,0,0.05)', fontSize: '1.05rem' }}>
                        <div className="mb-4 text-center pb-2 border-bottom"><h3 className="fw-bold mb-1" style={{ color: '#c2185b' }}>Agregar Nueva Prenda.</h3></div>
                        <Form onSubmit={handleAddProductEncargado}>
                            <Row className="g-3 mb-3">
                                <Col md={6}><Form.Group><Form.Label className="fw-bold text-muted">Nombre del Artículo</Form.Label><Form.Control type="text" value={nombre} onChange={e => setNombre(e.target.value)} required placeholder="Ej: Falda mezclilla" className="form-control-lg" /></Form.Group></Col>
                                <Col md={3}><Form.Group><Form.Label className="fw-bold text-muted">Precio Venta ($)</Form.Label><Form.Control type="number" step="0.01" value={precio} onChange={e => setPrecio(e.target.value)} required className="form-control-lg text-center" /></Form.Group></Col>
                                <Col md={3}><Form.Group><Form.Label className="fw-bold text-muted">Cantidad Inicial</Form.Label><Form.Control type="number" value={stock} onChange={e => setStock(e.target.value)} required className="form-control-lg text-center" /></Form.Group></Col>
                            </Row>
                            <Row className="g-3 mb-3">
                                <Col md={4}><Form.Group><Form.Label className="fw-bold text-muted">Talla Base</Form.Label><Form.Select value={talla} onChange={e => setTalla(e.target.value)} className="form-select-lg"><option value="S">S</option><option value="M">M</option><option value="L">L</option></Form.Select></Form.Group></Col>
                                <Col md={4}><Form.Group><Form.Label className="fw-bold text-muted">Color</Form.Label><Form.Control type="text" value={editProdColor} onChange={e => setEditProdColor(e.target.value)} placeholder="Azul, Rojo..." required className="form-control-lg" /></Form.Group></Col>
                                <Col md={4}><Form.Group><Form.Label className="fw-bold text-muted">Categoría</Form.Label><Form.Control type="text" value={editProdCategoria} onChange={e => setEditProdCategoria(e.target.value)} placeholder="Faldas..." required className="form-control-lg" /></Form.Group></Col>
                            </Row>
                            <Form.Group className="mb-3"><Form.Label className="fw-bold text-muted">Cargar Fotografía</Form.Label><Form.Control type="file" accept="image/*" onChange={handleFileChange} className="form-control-lg" /></Form.Group>
                            <Form.Group className="mb-3"><Form.Label className="fw-bold text-muted">Etiquetas (Separadas por comas)</Form.Label><Form.Control type="text" value={editProdTags} onChange={e => setEditProdTags(e.target.value)} placeholder="mezclilla, casual, moda" className="form-control-lg" /></Form.Group>
                            <Form.Group className="mb-4"><Form.Label className="fw-bold text-muted">Descripción del Producto</Form.Label><Form.Control as="textarea" rows={2} value={editProdDescripcion} onChange={e => setEditProdDescripcion(e.target.value)} className="form-control-lg" /></Form.Group>
                            <Button type="submit" className="w-100 fw-bold py-3 text-white shadow" style={{ backgroundColor: '#c2185b', border: 'none', borderRadius: '10px', fontSize: '1.15rem' }}> 📦 Guardar Nuevo Producto.</Button>
                        </Form>
                    </div>
                )}

                {/* VISTA C: VISTA CRUZADA DE MOVIMIENTOS (AUDITORÍA LOCAL) */}
                
                

                {/* VISTA D: DEVOLUCIONES DE MERCANCÍA */}
                {vistaActiva === 'devoluciones' && (
                    <div className="animate__animated animate__fadeIn" style={{ fontSize: '1.05rem' }}>
                        <h4 className="fw-bold mb-3" style={{ color: '#c2185b' }}>↩️ Registro de Devoluciones</h4>
                        <Card className="mb-4 shadow-sm border-0" style={{ borderRadius: '14px', backgroundColor: '#f1b2d2', border: '1px solid #f8bbd0' }}>
                            <Card.Body className="p-4">
                                <Form onSubmit={async (e) => {
                                    e.preventDefault();
                                    const form = e.target;
                                    try {
                                        const response = await fetch('http://34.219.103.28:3000/api/productos/devoluciones', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                                            body: JSON.stringify({ venta_id: parseInt(form.venta_id.value), producto_detalle: form.producto_detalle.value, cantidad: parseInt(form.cantidad.value), motivo_devolucion: form.motivo_devolucion.value, monto_reembolsado: parseFloat(form.monto_reembolsado.value), tipo_reembolso: form.tipo_reembolso.value, usuario_id: 3 })
                                        });
                                        if (response.ok) {
                                            Swal.fire('¡Éxito!', 'La devolución se registró y el stock fue restaurado.', 'success');
                                            form.reset(); cargarDatosEncargado();
                                        }
                                    } catch (err) { console.error(err); }
                                }}>
                                    <Row className="g-3">
                                        <Col md={2}><Form.Group><Form.Label className="fw-bold text-muted">TicketOrig.</Form.Label><Form.Control type="number" name="venta_id" className="form-control-lg text-center" required /></Form.Group></Col>
                                        <Col md={4}><Form.Group><Form.Label className="fw-bold text-muted">Artículo Devuelto</Form.Label><Form.Control type="text" name="producto_detalle" className="form-control-lg" required /></Form.Group></Col>
                                        <Col md={2}><Form.Group><Form.Label className="fw-bold text-muted">Cantidad</Form.Label><Form.Control type="number" name="cantidad" className="form-control-lg text-center" required /></Form.Group></Col>
                                        <Col md={2}><Form.Group><Form.Label className="fw-bold text-muted">Reembolso ($)</Form.Label><Form.Control type="number" step="0.01" name="monto_reembolsado" className="form-control-lg text-center" required /></Form.Group></Col>
                                        <Col md={2}><Form.Group><Form.Label className="fw-bold text-muted">Método</Form.Label><Form.Select name="tipo_reembolso" className="form-select-lg"><option value="Efectivo">💵 Efectivo</option><option value="Nota de Crédito">🎟️ Nota de Crédito</option></Form.Select></Form.Group></Col>
                                        <Col md={12}><Form.Group><Form.Label className="fw-bold text-muted">Motivo del Cambio</Form.Label><Form.Control type="text" name="motivo_devolucion" className="form-control-lg" required /></Form.Group></Col>
                                        <Col md={12} className="text-end mt-3"><Button type="submit" className="fw-bold px-4 py-2 btn-lg text-white shadow" style={{ backgroundColor: '#c2185b', borderColor: '#c2185b' }}>↩️ Aplicar Reembolso</Button></Col>
                                    </Row>
                                </Form>
                            </Card.Body>
                        </Card>

                        {/* TABLA HISTÓRICA */}
                        <div className="bg-white rounded-4 p-3 shadow-sm border">
                            <h6 className="fw-bold text-secondary mb-3 fs-5">📋 Historial de Devoluciones</h6>

                            <Table responsive hover className="text-center align-middle border mt-4">
                                <thead className="table-light"><tr><th>Folio Dev</th><th>Ticket Orig.</th><th>Prenda</th><th>Cant.</th><th>Motivo</th><th>Reembolso</th><th>Método</th><th>Autorizó</th></tr></thead>
                                <tbody>
                                    {devolucionesData.length === 0 ? <tr><td colSpan="8" className="text-muted py-3">No hay devoluciones registradas hoy.</td></tr> : devolucionesData.map((dev, i) => (
                                        <tr key={i}><td>#DEV-{dev.id}</td><td>#V-{dev.venta_id}</td><td className="fw-bold">{dev.producto_detalle}</td><td>{dev.cantidad} pz</td><td>{dev.motivo_devolucion}</td><td className="text-danger fw-bold">-${parseFloat(dev.monto_reembolsado).toFixed(2)}</td><td><Badge bg="secondary">{dev.tipo_reembolso}</Badge></td><td><Badge bg="dark">lesly</Badge></td></tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    </div>
                )}

                {/* VISTA E: TERMINAL DE VENTAS NORMAL (COBRO DIRECTO LIBRE) */}
                {vistaActiva === 'ventas' && (
                    <div className="animate__animated animate__fadeIn" style={{ fontSize: '1.05rem' }}>
                        <h4 className="fw-bold mb-3" style={{ color: '#c2185b' }}>🛒 Terminal de Cobro Exprés (Supervisor Rango 2)</h4>
                        <Form onSubmit={handleCompraDirectaEncargado} className="row g-3 mb-5 p-3 bg-light rounded align-items-end m-0 border shadow-sm">
                            <Col md={2}><Form.Group><Form.Label className="fw-bold text-muted mb-1">ID Producto</Form.Label><Form.Control type="number" placeholder="Ej: 3" value={idProductoVenta} onChange={e => setIdProductoVenta(e.target.value)} className="form-control-lg text-center fw-bold" required /></Form.Group></Col>
                            <Col md={2}><Form.Group><Form.Label className="fw-bold text-muted mb-1">Cantidad</Form.Label><Form.Control type="number" placeholder="Pzs" value={cantidadVenta} onChange={e => setCantidadVenta(e.target.value)} className="form-control-lg text-center fw-bold" required /></Form.Group></Col>
                            <Col md={5}>
                                <Form.Group>
                                    <Form.Label className="fw-bold text-muted mb-1">Descuento Especial (Acceso Libre Supervisor)</Form.Label>
                                    <Form.Select value={descuentoSeleccionado} onChange={e => setDescuentoSeleccionado(e.target.value)} className="form-select-lg fw-bold text-secondary">
                                        <option value="0">Sin Descuento (0%)</option>
                                        <option value="10">Descuento Temporada (10%)</option>
                                        <option value="15">Venta Especial (15%)</option>
                                        <option value="20">Liquidación (20%)</option>
                                        <option value="50">⚠️ Gran Outlet (50%)</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={3}><Button type="submit" className="w-100 fw-bold py-2 btn-lg text-white shadow" style={{ backgroundColor: '#c2185b', borderColor: '#c2185b', fontSize: '1.15rem' }}>💰 Registrar Venta</Button></Col>
                        </Form>

                        <h4 className="fw-bold mb-3 mt-4" style={{ color: '#c2185b' }}>💰 Historial de Ventas del Turno Activo</h4>
                        <Table responsive hover className="text-center align-middle mb-0 table-borderless border" style={{ fontSize: '1.1rem' }}>
                            <thead className="table-light"><tr style={{ height: '42px', fontSize: '1.15rem' }}><th>Folio</th><th>Vendedor</th><th>Rol</th><th>Descuento</th><th>Total Cobrado</th><th>Fecha y Hora</th><th>Acción</th></tr></thead>
                            <tbody>
                                {ventasData.length === 0 ? <tr><td colSpan="7" className="text-muted py-4 fs-5">No hay ventas registradas en este turno de caja.</td></tr> : ventasData.map((venta, i) => (
                                    <tr key={i} className="border-bottom" style={{ height: '46px' }}>
                                        <td className="fw-bold text-secondary">#V-{venta.id}</td>
                                        <td className="fw-bold">{venta.username || `Asesor: ${venta.usuario_id}`}</td>
                                        <td><Badge bg="warning" text="dark" className="fs-6">{venta.rol || 'vendedor'}</Badge></td>
                                        <td className="text-muted">${parseFloat(venta.descuento_aplicado || 0).toFixed(2)}</td>
                                        <td className="fw-bold text-success fs-5">${parseFloat(venta.total).toFixed(2)}</td>
                                        <td className="text-muted">{venta.fecha_venta ? new Date(venta.fecha_venta).toLocaleString('es-MX') : '---'}</td>
                                        <td><Button variant="outline-secondary" className="btn-sm py-1 px-3 fw-bold" onClick={() => handleVerDetallesTicket(venta.id)}>👁️ Ver Detalles</Button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                )}

                {/* VISTA F: CONTROL DE CAJA CHICA */}
                {vistaActiva === 'caja' && (
                    <div className="animate__animated animate__fadeIn p-2" style={{ fontSize: '1.05rem' }}>
                        <h4 className="fw-bold mb-4" style={{ color: '#c2185b' }}>💵 Control Financiero y Arqueos de Turno Local</h4>
                        <div className="row g-3 justify-content-center text-center mb-5">
                            <div className="col-12 col-md-3">
                                <div className="p-3 shadow-sm rounded-4 border bg-white d-flex flex-column justify-content-center align-items-center" style={{ height: '100%', minHeight: '140px' }}>
                                    <span className="text-muted fw-bold text-uppercase small">Fondo Apertura</span>
                                    <h2 className="fw-black my-2 text-primary" style={{ fontSize: '1.8rem' }}>${movimientosCajaData[0]?.estado === 'abierta' ? parseFloat(movimientosCajaData[0].monto_inicial).toFixed(2) : '0.00'}</h2>
                                    <Badge bg={movimientosCajaData[0]?.estado === 'abierta' ? 'success' : 'secondary'} className="px-3 py-2 fs-7">{movimientosCajaData[0]?.estado === 'abierta' ? 'Turno Activo' : 'Turno Cerrado'}</Badge>
                                </div>
                            </div>
                            <div className="col-12 col-md-4">
                                {movimientosCajaData[0]?.estado === 'abierta' ? (
                                    <button onClick={handleCerrarCaja} className="w-100 p-4 shadow border rounded-4 text-white h-100 d-flex flex-column justify-content-center align-items-center" style={{ background: 'linear-gradient(135deg, #d32f2f, #c2185b)', cursor: 'pointer' }}>
                                        <div className="fs-2 mb-1">🔓</div><span className="fw-bold text-uppercase text-white-50 small">Arqueo de Turno</span><h3 className="fw-bold m-0 mt-1" style={{ fontSize: '1.45rem' }}>Realizar Corte de Caja</h3>
                                    </button>
                                ) : (
                                    <button onClick={() => setShowModalAbrir(true)} className="w-100 p-4 shadow border rounded-4 text-white h-100 d-flex flex-column justify-content-center align-items-center" style={{ background: 'linear-gradient(135deg, #2e7d32, #1b5e20)', cursor: 'pointer' }}>
                                        <div className="fs-2 mb-1">💵</div><span className="fw-bold text-uppercase text-white-50 small">Turno Inactivo</span><h3 className="fw-bold m-0 mt-1" style={{ fontSize: '1.45rem' }}>Abrir Turno Encargado</h3>
                                    </button>
                                )}
                            </div>
                            <div className="col-12 col-md-3">
                                <button onClick={() => { if(movimientosCajaData.length > 0) { handleImprimirTicketCorte(movimientosCajaData[0]); } }} className="w-100 p-3 shadow-sm border rounded-4 bg-white h-100 d-flex flex-column justify-content-center align-items-center">
                                    <span className="text-muted fw-bold text-uppercase small">Total en Caja</span>
                                    <h2 className="fw-black my-2 text-success" style={{ fontSize: '1.8rem' }}>${movimientosCajaData[0] ? (parseFloat(movimientosCajaData[0].monto_final || movimientosCajaData[0].monto_inicial) - parseFloat(movimientosCajaData[0].monto_inicial)).toFixed(2) : '0.00'}</h2>
                                    <span className="badge bg-dark rounded-pill py-2 px-3 text-uppercase font-monospace fs-7">📄 Imprimir Reporte</span>
                                </button>
                            </div>
                        </div>

                        {/* HISTORIAL GENERAL */}
                        <div className="bg-white rounded-4 p-3 shadow-sm border">
                            <h6 className="fw-bold text-secondary mb-3 fs-5">📋 Historial General de Arqueos locales</h6>
                            <Table responsive hover className="text-center align-middle mb-0 table-borderless" style={{ fontSize: '1.05rem' }}>
                                <thead className="table-light"><tr><th>ID Corte</th><th>Operador ID</th><th>F. Apertura</th><th>Monto Inicial</th><th>F. Cierre</th><th>Monto Final</th><th>Estado</th></tr></thead>
                                <tbody>
                                    {movimientosCajaData.map((caja, i) => (
                                        <tr key={i} className="border-bottom" style={{ height: '46px' }}>
                                            <td className="fw-bold text-secondary">#C-{caja.id}</td>
                                            <td><Badge bg="dark" className="fs-6 px-2 py-1">ID User: {caja.usuario_id}</Badge></td>
                                            <td className="text-muted">{caja.fecha_apertura ? new Date(caja.fecha_apertura).toLocaleString('es-MX') : '---'}</td>
                                            <td className="fw-bold text-primary fs-5">${parseFloat(caja.monto_inicial).toFixed(2)}</td>
                                            <td className="text-muted">{caja.fecha_cierre ? new Date(caja.fecha_cierre).toLocaleString('es-MX') : '---'}</td>
                                            <td className="fw-bold text-success fs-5">{caja.monto_final ? `$${parseFloat(caja.monto_final).toFixed(2)}` : '---'}</td>
                                            <td><Badge bg={caja.estado === 'abierta' ? 'success' : 'secondary'} className="fs-6 px-2 py-1">{caja.estado.toUpperCase()}</Badge></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    </div>
                )}
            </div>

            {/* ====== MODAL: TICKET INDIVIDUAL IMPRIMIBLE (REUTILIZADO) ====== */}
            <Modal show={showTicketModal} onHide={() => setShowTicketModal(false)} centered size="sm">
                <Modal.Body className="p-4" style={{ fontFamily: 'Courier New, Courier, monospace', backgroundColor: '#ffffff', fontSize: '1.05rem' }}>
                    <div className="d-flex gap-2 justify-content-center mb-4 d-print-none">
                        <Button variant="success" size="md" className="fw-bold px-4 shadow-sm border-0" style={{ backgroundColor: '#2e7d32' }} onClick={() => window.print()}>🖨️ Imprimir</Button>
                        <Button variant="secondary" size="md" className="fw-bold px-4 shadow-sm border-0" style={{ backgroundColor: '#757575' }} onClick={() => setShowTicketModal(false)}>❌ Cerrar</Button>
                    </div>
                    <div className="text-center mb-3">
                        <h4 className="fw-bold m-0" style={{ color: '#ad1457', letterSpacing: '1px' }}>✨ SMART BOUTIQUE ✨</h4>
                        <small className="text-muted d-block" style={{ fontSize: '0.8rem' }}>Instituto Tecnológico Superior de Apatzingán</small>
                        <div className="my-2" style={{ borderTop: '1px dashed #ced4da' }}></div>
                        <span className="fw-bold d-block">COMPROBANTE DE VENTA</span>
                        <span className="text-secondary">Folio: #V-{folioSeleccionado}</span>
                    </div>
                    <div className="mb-3">
                        {detallesTicket.map((item, i) => (
                            <div key={i} className="mb-2" style={{ fontSize: '0.85rem', lineHeight: '1.3' }}>
                                <div className="fw-bold text-dark text-uppercase">{item.nombre_prenda}</div>
                                <div className="d-flex justify-content-between text-muted ps-2">
                                    <span>{item.cantidad} pza(s) x ${parseFloat(item.precio_unitario).toFixed(2)}</span>
                                    <span className="fw-bold text-dark">${(item.cantidad * parseFloat(item.precio_unitario)).toFixed(2)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="my-2" style={{ borderTop: '1px dashed #ced4da' }}></div>
                    <div style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
                        <div className="d-flex justify-content-between text-muted"><span>SUBTOTAL:</span><span>${detallesTicket.reduce((acc, item) => acc + (item.cantidad * parseFloat(item.precio_unitario)), 0).toFixed(2)}</span></div>
                        <div className="d-flex justify-content-between fw-bold mb-3" style={{ fontSize: '0.95rem' }}><span>TOTAL COBRADO:</span><span class="text-success">${detallesTicket.reduce((acc, item) => acc + (item.cantidad * parseFloat(item.precio_unitario)), 0).toFixed(2)}</span></div>
                    </div>
                </Modal.Body>
            </Modal>

            {/* ====== MODAL: APERTURA DE TURNO ENCARGADO ====== */}
            <Modal show={showModalAbrir} onHide={() => setShowModalAbrir(false)} centered backdrop="static">
                <Modal.Header closeButton className="border-0 pb-0"><Modal.Title className="fw-bold fs-5" style={{ color: '#ad1457' }}>🔑 Apertura de Caja - Turno Supervisor</Modal.Title></Modal.Header>
                <form onSubmit={handleAbrirCajaDefinitivo}>
                    <Modal.Body className="py-3 fs-5">
                        <Form.Group>
                            <Form.Label className="fw-bold text-secondary mb-2">Monto de Apertura en Efectivo ($):</Form.Label>
                            <Form.Control type="number" step="0.01" min="0" placeholder="0.00" className="text-center fw-bold text-primary fs-3 py-2 shadow-sm" value={montoInicialInput} onChange={(e) => setMontoInicialInput(e.target.value)} autoFocus required />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer className="border-0 pt-0"><Button variant="secondary" className="fw-bold" onClick={() => setShowModalAbrir(false)}>Cancelar</Button><Button variant="success" type="submit" className="fw-bold px-3">🚀 Confirmar Apertura</Button></Modal.Footer>
                </form>
            </Modal>

            {/* ====== MODAL: ACTUALIZACIÓN FLOTANTE PRENDAS ====== */}
            <Modal show={showProdModal} onHide={() => setShowProdModal(false)} centered size="lg">
                <Modal.Header closeButton style={{ borderBottom: '1px solid #f8bbd0' }}><Modal.Title className="fw-bold fs-4" style={{ color: '#ad1457' }}>⚙️ Actualizar Prenda</Modal.Title></Modal.Header>
                <Modal.Body style={{ backgroundColor: '#fffdfd', fontSize: '1.05rem' }}>
                    <Form onSubmit={handleSaveEditProduct}>
                        <Row className="g-3 mb-2">
                            <Col md={6}><Form.Group><Form.Label className="fw-bold text-muted">Nombre del Producto</Form.Label><Form.Control type="text" value={editProdNombre} onChange={e => setEditProdNombre(e.target.value)} required className="form-control-lg" /></Form.Group></Col>
                            <Col md={3}><Form.Group><Form.Label className="fw-bold text-muted">Precio ($ MXN)</Form.Label><Form.Control type="number" step="0.01" value={editProdPrecio} onChange={e => setEditProdPrecio(e.target.value)} required className="form-control-lg text-center" /></Form.Group></Col>
                            <Col md={3}><Form.Group><Form.Label className="fw-bold text-muted">Stock Físico</Form.Label><Form.Control type="number" value={editProdStock} onChange={e => setEditProdStock(e.target.value)} required className="form-control-lg text-center" /></Form.Group></Col>
                        </Row>
                        <Row className="g-3 mb-2">
                            <Col md={4}><Form.Group><Form.Label className="fw-bold text-muted">Talla Base</Form.Label><Form.Select value={editProdTalla} onChange={e => setEditProdTalla(e.target.value)} className="form-select-lg"><option value="S">S</option><option value="M">M</option><option value="L">L</option></Form.Select></Form.Group></Col>
                            <Col md={4}><Form.Group><Form.Label className="fw-bold text-muted">Color Temático</Form.Label><Form.Control type="text" value={editProdColor} onChange={e => setEditProdColor(e.target.value)} required className="form-control-lg" /></Form.Group></Col>
                            <Col md={4}><Form.Group><Form.Label className="fw-bold text-muted">Categoría en Tienda</Form.Label><Form.Control type="text" value={editProdCategoria} onChange={e => setEditProdCategoria(e.target.value)} required className="form-control-lg" /></Form.Group></Col>
                        </Row>
                        <Form.Group className="mb-2"><Form.Label className="fw-bold text-muted">Selector de Fotografía</Form.Label><Form.Control type="file" accept="image/*" onChange={handleFileChange} className="form-control-lg" /></Form.Group>
                        <Form.Group className="mb-2"><Form.Label className="fw-bold text-muted">Cadena Hash</Form.Label><Form.Control type="text" readOnly disabled value={editProdImagen && editProdImagen.length > 60 ? `${editProdImagen.substring(0, 60)}...` : editProdImagen} className="form-control-lg" /></Form.Group>
                        {editProdImagen && editProdImagen.trim() !== '' && !editProdImagen.includes('[object Object]') && (
                            <div className="mt-2 text-center bg-light p-2 rounded border">
                                <img src={editProdImagen.startsWith('data:image') || editProdImagen.includes('http') ? editProdImagen : `data:image/jpeg;base64,${editProdImagen}`} alt="Vista previa" style={{ height: '160px', borderRadius: '8px', objectFit: 'contain', border: '1px solid #f8bbd0' }} />
                            </div>
                        )}
                        <Form.Group className="mb-2"><Form.Label className="fw-bold text-muted">Etiquetas</Form.Label><Form.Control type="text" value={editProdTags} onChange={e => setEditProdTags(e.target.value)} className="form-control-lg" /></Form.Group>
                        <Form.Group className="mb-4"><Form.Label className="fw-bold text-muted">Descripción</Form.Label><Form.Control as="textarea" rows={2} value={editProdDescripcion} onChange={e => setEditProdDescripcion(e.target.value)} className="form-control-lg" /></Form.Group>
                        <Button type="submit" style={{ backgroundColor: '#c2185b', border: 'none' }} className="w-100 fw-bold py-3 text-white shadow btn-lg">Aplicar Cambios de Sucursal.</Button>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default EncargadoDashboard;