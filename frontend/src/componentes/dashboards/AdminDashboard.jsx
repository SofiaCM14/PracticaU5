import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Table, Badge, Form, Alert, Button, Card, Modal, InputGroup } from 'react-bootstrap';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
    const navigate = useNavigate();
    
    const [recentActivity, setRecentActivity] = useState([]);
    const [listaUsuarios, setListaUsuarios] = useState([]);
    const [productos, setProductos] = useState([]);
    const [alertMessage, setAlertMessage] = useState(null);
    const [showPass, setShowPass] = useState(false);
    const [showNewPass, setShowNewPass] = useState(false);
    const [nuevoPassword, setNuevoPassword] = useState('');
    
    const [vistaActiva, setVistaActiva] = useState('bienvenida');
    const [showTicketModal, setShowTicketModal] = useState(false);
    const [detallesTicket, setDetallesTicket] = useState([]);
    const [folioSeleccionado, setFolioSeleccionado] = useState('');
    
    const [idProductoVenta, setIdProductoVenta] = useState('');
    const [cantidadVenta, setCantidadVenta] = useState('');
    const [descuentoSeleccionado, setDescuentoSeleccionado] = useState('0'); 
    const [movimientosCajaData, setMovimientosCajaData] = useState([]); 
    const [showModalAbrir, setShowModalAbrir] = useState(false); 
    const [montoInicialInput, setMontoInicialInput] = useState(''); 

    // 🔄 NUEVOS ESTADOS DE PAGINACIÓN Y BÚSQUEDA (PRODUCTOS)
    const [paginaActual, setPaginaActual] = useState(1);
    const [terminoBusqueda, setTerminoBusqueda] = useState('');
    const [totalPaginas, setTotalPaginas] = useState(1);
    const [cargandoMas, setCargandoMas] = useState(false);
    const [limitePorPagina] = useState(12); // Coincide con tu Backend

    const [nombre, setNombre] = useState('');
    const [precio, setPrecio] = useState('');
    const [stock, setStock] = useState('');
    const [talla, setTalla] = useState('M');

    const [nuevoUsername, setNuevoUsername] = useState('');
    const [nuevoRol, setNuevoRol] = useState('vendedor');

    const [editandoId, setEditandoId] = useState(null); 
    const [editUsername, setEditUsername] = useState('');
    const [editRol, setEditRol] = useState('vendedor');

    const [showProdModal, setShowProdModal] = useState(false);
    const [selectedProd, setSelectedProd] = useState(null);
    const [editProdNombre, setEditProdNombre] = useState('');
    const [editProdPrecio, setEditProdPrecio] = useState('');
    const [editProdStock, setEditProdStock] = useState('');
    const [editProdTalla, setEditProdTalla] = useState('M');
    const [editProdColor, setEditProdColor] = useState('');
    const [editProdCategoria, setEditProdCategoria] = useState('');
    const [editProdDescripcion, setEditProdDescripcion] = useState('');
    const [editProdImagen, setEditProdImagen] = useState('');
    const [editProdTags, setEditProdTags] = useState('');
    const [ventasData, setVentasData] = useState([]);
    const [devolucionesData, setDevolucionesData] = useState([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userIdAEliminar, setUserIdAEliminar] = useState(null);
    const [usernameAEliminar, setUsernameAEliminar] = useState('');
    const [editPassword, setEditPassword] = useState('');

    const usuarioActivo = localStorage.getItem('username') || 'admin_sofi';
    const rolActivo = localStorage.getItem('userRole') || 'admin';
    const usuarioId = localStorage.getItem('userId') ? parseInt(localStorage.getItem('userId')) : 1;
    const cajaActiva = movimientosCajaData.find((c) => c.estado === 'abierta') || movimientosCajaData[0] || null;

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

    // 🟢 FUNCIÓN CORE ACTUALIZADA CON PARÁMETROS DINÁMICOS DE PAGINACIÓN
    const cargarDatosAdmin = useCallback(async (reiniciarProductos = false, paginaDestino = 1) => {
        try {
            const authHeaders = getAuthHeaders();

            // 1. Carga Dinámica de Catálogo de Productos con Paginación y Filtro
            setCargandoMas(true);
            const queryPage = reiniciarProductos ? 1 : paginaDestino;
            const resProd = await fetch(`http://34.219.103.28:3000/api/productos?page=${queryPage}&limit=${limitePorPagina}&search=${encodeURIComponent(terminoBusqueda)}`);
            
            if (resProd.ok) {
                const dataJSON = await resProd.json();
                
                if (reiniciarProductos || queryPage === 1) {
                    setProductos(dataJSON.records);
                    setPaginaActual(1);
                } else {
                    // Scrolling infinito: Concatena los registros previos con la nueva carga
                    setProductos(prev => [...prev, ...dataJSON.records]);
                    setPaginaActual(queryPage);
                }
                setTotalPaginas(dataJSON.meta.totalPages);
            }
            setCargandoMas(false);

            // 2. Cargar datos estáticos de los módulos restantes
            const resAudit = await fetch('http://34.219.103.28:3000/api/productos/auditoria?page=1&limit=1000', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json', 'username': usuarioActivo, ...authHeaders }
            });
            if (resAudit.ok) {
                const auditData = await resAudit.json();
                setRecentActivity(Array.isArray(auditData.records) ? auditData.records : []);
            } else {
                setRecentActivity([]);
            }

            const resUser = await fetch('http://34.219.103.28:3000/api/productos/usuarios', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json', 'username': usuarioActivo, ...authHeaders }
            });
            if (resUser.ok) setListaUsuarios(await resUser.json());

            const resVentas = await fetch('http://34.219.103.28:3000/api/productos/ventas', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json', 'username': usuarioActivo, ...authHeaders }
            });
            if (resVentas.ok) setVentasData(await resVentas.json());

            const resDevoluciones = await fetch('http://34.219.103.28:3000/api/productos/devoluciones', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json', 'username': usuarioActivo, ...authHeaders }
            });
            if (resDevoluciones.ok) setDevolucionesData(await resDevoluciones.json());

            const resCaja = await fetch('http://34.219.103.28:3000/api/productos/movimientos-caja', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json', 'username': usuarioActivo, ...authHeaders }
            });
            if (resCaja.ok) setMovimientosCajaData(await resCaja.json());

        } catch (error) {
            console.error("Error de conectividad AWS RDS:", error);
            setCargandoMas(false);
        }
    }, [terminoBusqueda, limitePorPagina, usuarioActivo]);

    // Disparador de búsqueda cada vez que cambia el texto
    useEffect(() => {
        if (vistaActiva === 'inventario') {
            cargarDatosAdmin(true);
        }
    }, [terminoBusqueda, vistaActiva]);

    // Función de Scroll / Cargar más para la paginación secuencial
    const handleCargarMasProductos = () => {
        const siguientePagina = paginaActual + 1;
        if (siguientePagina <= totalPaginas) {
            cargarDatosAdmin(false, siguientePagina);
        }
    };

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
            console.error("Error cargando detalles:", error);
        }
    };

    const handleCompraDirecta = async (e) => {
        e.preventDefault();
// Busca de forma segura asegurando que 'productos' sea el arreglo de filas
        const productosArreglo = Array.isArray(productos) ? productos : [];
        const productoExiste = productosArreglo.find(p => p.id === parseInt(idProductoVenta));        if (!productoExiste) {
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
        const usuarioIdReal = localStorage.getItem('userId') ? parseInt(localStorage.getItem('userId')) : 1;

        const datosVenta = {
            total: totalCobradoFinal,
            descuento_aplicado: totalDineroDescontado, 
            usuario_id: usuarioIdReal,
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
                setIdProductoVenta(''); setCantidadVenta(''); setDescuentoSeleccionado('0'); 
                await cargarDatosAdmin(true); 
                Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: `Venta registrada (Folio #V-${data.venta_id})`, showConfirmButton: false, timer: 2000 });
            } else {
                Swal.fire('❌ Error', 'Error al registrar la venta.', 'error');
            }
        } catch (error) {
            Swal.fire('❌ Error', 'Error de comunicación con el servidor.', 'error');
        }
    };

    const handleRegistroDevolucion = async (e) => {
        e.preventDefault();
        const form = e.target;
        try {
            const response = await fetch('http://34.219.103.28:3000/api/productos/devoluciones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({
                    venta_id: parseInt(form.venta_id.value),
                    producto_detalle: form.producto_detalle.value,
                    cantidad: parseInt(form.cantidad.value),
                    motivo_devolucion: form.motivo_devolucion.value,
                    monto_reembolsado: parseFloat(form.monto_reembolsado.value),
                    tipo_reembolso: form.tipo_reembolso.value,
                    usuario_id: usuarioId
                })
            });

            if (response.ok) {
                Swal.fire('¡Éxito!', 'La devolución se registró correctamente.', 'success');
                form.reset();
                await cargarDatosAdmin(true);
            } else {
                const err = await response.json();
                Swal.fire('❌ Error', err.error || 'No se pudo procesar la devolución.', 'error');
            }
        } catch (error) {
            console.error(error);
            Swal.fire('❌ Error', 'Error de comunicación con el servidor.', 'error');
        }
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();
        try {
            const tagsArray = typeof editProdTags === 'string'
                ? editProdTags.split(',').map(tag => tag.trim()).filter(tag => tag !== '')
                : [];

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
                setNombre(''); setPrecio(''); setStock(''); setTalla('M');
                setEditProdColor(''); setEditProdCategoria(''); setEditProdDescripcion(''); setEditProdImagen(''); setEditProdTags('');
                setVistaActiva('inventario');
                cargarDatosAdmin(true);
            }
        } catch (error) { setAlertMessage('Error de comunicación con el servidor.'); }
    };

    const abrirFormularioProducto = (p) => {
        setSelectedProd(p);
        setEditProdNombre(p.nombre || '');
        setEditProdPrecio(p.precio || '');
        setEditProdStock(p.stock || 0);
        setEditProdTalla(p.talla || 'M');
        setEditProdColor(p.color || 'Multicolor');
        setEditProdCategoria(p.categoria || 'General');
        setEditProdDescripcion(p.descripcion || '');
        setEditProdImagen(p.imagen_url && !p.imagen_url.includes('[object Object]') ? p.imagen_url : '');
        setEditProdTags(p.tags && Array.isArray(p.tags) ? p.tags.join(', ') : '');
        setShowProdModal(true);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0]; 
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setEditProdImagen(String(reader.result));
            reader.readAsDataURL(file); 
        }
    };

    const handleSaveEditProduct = async (e) => {
        e.preventDefault();
        try {
            const tagsArray = editProdTags.split(',').map(t => t.trim()).filter(t => t !== '');
            let imagenAEnviar = editProdImagen;
            if (typeof imagenAEnviar === 'object' || imagenAEnviar.includes('[object Object]')) imagenAEnviar = '';

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
                setAlertMessage(`¡Cambios guardados en "${editProdNombre}"! 📝`);
                setShowProdModal(false);
                cargarDatosAdmin(true); 
            }
        } catch (error) { console.error(error); }
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        if (!nuevoUsername.trim()) return;
        try {
            const response = await fetch('http://34.219.103.28:3000/api/productos/usuarios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({ username: nuevoUsername, rol: nuevoRol, password: nuevoPassword })
            });
            if (response.ok) {
                setAlertMessage(`¡Usuario "${nuevoUsername}" registrado con éxito! 👥`);
                setNuevoUsername(''); setNuevoPassword(''); setNuevoRol('vendedor');
                cargarDatosAdmin(true); 
            }
        } catch (error) { console.error(error); }
    };

    const handleSaveEditUser = async (id) => {
        try {
            const res = await fetch(`http://34.219.103.28:3000/api/productos/usuarios/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'username': usuarioActivo, ...getAuthHeaders() },
                body: JSON.stringify({ username: editUsername, rol: editRol, password: editPassword })
            });
            if (res.ok) {
                setEditandoId(null); setEditPassword(''); setShowPass(false);
                await cargarDatosAdmin(true);
                Swal.fire('¡Actualizado!', 'Credenciales sincronizadas.', 'success');
            }
        } catch (error) { console.error(error); }
    };

    const handleCerrarCaja = async () => {
        Swal.fire({
            title: '¿Estás segura?', text: "¿Deseas realizar el corte y cerrar la caja?", icon: 'warning',
            showCancelButton: true, confirmButtonColor: '#d32f2f', confirmButtonText: 'Sí, cerrar caja 🔒'
        }).then(async (result) => {
            if (result.isConfirmed) {
                const response = await fetch('http://34.219.103.28:3000/api/productos/movimientos-caja/cerrar-caja', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                    body: JSON.stringify({ usuario_id: usuarioId })
                });
                const data = await response.json();
                if (response.ok) {
                    Swal.fire({ title: '¡Caja Cerrada!', html: `💰 <b>Ventas:</b> $${data.ventas_del_dia.toFixed(2)}<br/>💵 <b>Total:</b> $${data.monto_final.toFixed(2)}`, icon: 'success' });
                    cargarDatosAdmin(true);
                }
            }
        });
    };
   
    const handleAbrirCajaDefinitivo = async (e) => {
        e.preventDefault();
        const fondoNum = parseFloat(montoInicialInput);
        if (isNaN(fondoNum) || fondoNum < 0) return;

        try {
            const response = await fetch('http://34.219.103.28:3000/api/productos/movimientos-caja/abrir-caja', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({ usuario_id: usuarioId, monto_inicial: fondoNum })
            });
            if (response.ok) {
                Swal.fire('¡Turno Abierto!', `Fondo de $${fondoNum.toFixed(2)} registrado.`, 'success');
                setShowModalAbrir(false); setMontoInicialInput('');
                cargarDatosAdmin(true);
            }
        } catch (error) { console.error(error); }
    };

    const handleImprimirTicketCorte = async (datosCaja) => {
        try {
            const response = await fetch(`http://34.219.103.28:3000/api/productos/movimientos-caja/detalles-ticket/${datosCaja.id}`, { method: 'GET', headers: getAuthHeaders() });
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
                        body { font-family: 'Courier New', monospace; width: 320px; margin: 0 auto; padding: 20px; font-size: 13px; color: #111; }
                        .text-center { text-align: center; }
                        .fw-bold { font-weight: bold; }
                        .linea-divisoria { border-top: 1px dashed #555; margin: 10px 0; }
                        .flex-justify { display: flex; justify-content: space-between; margin-bottom: 6px; }
                        .grand-total { font-size: 14px; font-weight: bold; margin-top: 12px; }
                    </style>
                </head>
                <body>
                    <div class="text-center">
                        <h2 style="margin:0;">✨ SmartBoutique ✨</h2>
                        <p style="margin:2px 0 8px; font-size:12px;">Corte de Caja</p>
                    </div>
                    <div class="linea-divisoria"></div>
                    <div class="flex-justify"><span>Folio:</span><span>#C-${datosCaja.id}</span></div>
                    <div class="flex-justify"><span>Usuario:</span><span>${usuarioActivo}</span></div>
                    <div class="flex-justify"><span>Estado:</span><span>${datosCaja.estado.toUpperCase()}</span></div>
                    <div class="linea-divisoria"></div>
                    <div class="flex-justify"><span>Fondo Inicial</span><span>$${fondoInicial.toFixed(2)}</span></div>
                    <div class="flex-justify"><span>Ventas Turno</span><span>$${totalVentas.toFixed(2)}</span></div>
                    <div class="linea-divisoria"></div>
                    <div class="grand-total flex-justify"><span>Total Caja</span><span>$${montoFinal.toFixed(2)}</span></div>
                    <div class="linea-divisoria"></div>
                    <div style="text-align:center; font-size:11px; margin-top:10px;">Impreso el ${new Date().toLocaleString('es-MX')}</div>
                    <script>window.print();</script>
                </body>
                </html>
            `);
            ventanaImpresion.document.close();
        } catch (error) { console.error(error); }
    };

    const handleImprimirTicketVenta = () => {
        if (!detallesTicket || detallesTicket.length === 0) return;
        const totalNeto = detallesTicket.reduce((acc, item) => acc + (item.cantidad * parseFloat(item.precio_unitario)), 0).toFixed(2);
        const fecha = new Date().toLocaleString('es-MX');
        const ventanaImpresion = window.open('', '_blank', 'width=520,height=780,scrollbars=yes');
        ventanaImpresion.document.write(`
            <html>
            <head>
                <title>Ticket de Venta - #V-${folioSeleccionado}</title>
                <style>
                    body { font-family: 'Courier New', monospace; width: 360px; margin: 0 auto; padding: 20px; font-size: 13px; color: #111; }
                    .text-center { text-align: center; }
                    .fw-bold { font-weight: bold; }
                    .linea-divisoria { border-top: 1px dashed #555; margin: 10px 0; }
                    .flex-justify { display: flex; justify-content: space-between; margin-bottom: 6px; }
                    .grand-total { font-size: 14px; font-weight: bold; margin-top: 10px; }
                </style>
            </head>
            <body>
                <div class="text-center">
                    <h2 style="margin:0;">✨ SmartBoutique ✨</h2>
                    <p style="margin:4px 0; font-size:12px;">Ticket de Venta</p>
                </div>
                <div class="linea-divisoria"></div>
                <div class="flex-justify"><span>Folio:</span><span>#V-${folioSeleccionado}</span></div>
                <div class="flex-justify"><span>Usuario:</span><span>${usuarioActivo}</span></div>
                <div class="flex-justify"><span>Fecha:</span><span>${fecha}</span></div>
                <div class="linea-divisoria"></div>
                ${detallesTicket.map(item => `<div class="flex-justify"><span>${item.cantidad}x ${item.nombre_prenda}</span><span>$${(item.cantidad * parseFloat(item.precio_unitario)).toFixed(2)}</span></div>`).join('')}
                <div class="linea-divisoria"></div>
                <div class="grand-total flex-justify"><span>Total:</span><span>$${totalNeto}</span></div>
                <div class="linea-divisoria"></div>
                <div style="text-align:center; font-size:11px; margin-top:10px;">Gracias por su compra</div>
                <script>window.print();</script>
            </body>
            </html>
        `);
        ventanaImpresion.document.close();
    };

    const handleDeleteUser = async (id) => {
        try {
            const res = await fetch(`http://34.219.103.28:3000/api/productos/usuarios/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
            if (res.ok) setListaUsuarios(listaUsuarios.filter(u => u.id !== id));
        } catch (error) { console.error(error); }
    };

    const styles = {
        mainContainer: { borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' },
        headerSection: { background: 'linear-gradient(135deg, #c2185b 0%, #ad1457 100%)', padding: '26px', margin: '0', border: 'none' },
        contentArea: { backgroundColor: '#ffffff', padding: '35px', minHeight: '65vh', height: '100%', border: 'none' },
        menuBtn: { fontSize: '1.15rem', textAlign: 'left', fontWeight: 'bold', marginBottom: '6px', borderRadius: '8px', padding: '12px 14px', border: 'none', display: 'block', width: '100%' },
        cardBoutique: { border: '1px solid #f8bbd0', borderRadius: '14px', overflow: 'hidden', transition: 'all 0.2s' }
    };

    return (
        <div className="dashboard-responsive w-100 px-7" style={styles.mainContainer}>

            {/* ==================== BANNER DE BIENVENIDA (HEADER) ==================== */}
            <header style={styles.headerSection}>
                <Row className="align-items-center m-0 w-100 flex-column flex-md-row">
                    <Col className="p-0 text-center text-md-start">
                        <h2 className="fw-bold m-0 text-white" style={{ fontSize: '2.1rem', letterSpacing: '0.5px' }}>
                            Gerencia y administración, {usuarioActivo} 👑
                        </h2>
                    </Col>
                    <Col className="p-0 text-center text-md-end mt-3 mt-md-0" style={{ minWidth: '180px' }}>
                        <Button variant="light" onClick={handleLogout} style={{ borderRadius: '20px', padding: '8px 20px', fontSize: '1.2rem', fontWeight: 'bold', color: '#ad1457' }}>
                            Cerrar Sesión
                        </Button>
                    </Col>
                </Row>
            </header>

            {/* ==================== BARRA DE NAVEGACIÓN COMPACTA ==================== */}
            <nav className="dashboard-menu" style={{ maxWidth: '100%', margin: 0 }}>
                <button type="button" className={`dashboard-menu-button flex-shrink-0 ${vistaActiva === 'inventario' ? 'active' : ''}`} onClick={() => { setProductos([]); setVistaActiva('inventario'); cargarDatosAdmin(true, 1); }}>👗 Prendas</button>
                <button type="button" className={`dashboard-menu-button flex-shrink-0 ${vistaActiva === 'mercancia' ? 'active' : ''}`} onClick={() => { setVistaActiva('mercancia'); }}>🚛 Recepción de Mercancía</button>
                <button type="button" className={`dashboard-menu-button flex-shrink-0 ${vistaActiva === 'usuarios' ? 'active' : ''}`} onClick={() => { setVistaActiva('usuarios'); }}>👥 Empleados</button>
                <button type="button" className={`dashboard-menu-button flex-shrink-0 ${vistaActiva === 'auditoria' ? 'active' : ''}`} onClick={() => { setVistaActiva('auditoria'); }}>📡 Movimientos</button>
                <button type="button" className={`dashboard-menu-button flex-shrink-0 ${vistaActiva === 'devoluciones' ? 'active' : ''}`} onClick={() => { setVistaActiva('devoluciones'); }}>↩️ Devoluciones</button>
                <button type="button" className={`dashboard-menu-button flex-shrink-0 ${vistaActiva === 'ventas' ? 'active' : ''}`} onClick={() => { setVistaActiva('ventas'); }}>🛍️ Ventas</button>
                <button type="button" className={`dashboard-menu-button flex-shrink-0 ${vistaActiva === 'caja' ? 'active' : ''}`} onClick={() => { setVistaActiva('caja'); }}>💵 Control de Caja</button>
            </nav>

            {alertMessage && <Alert variant="success" onClose={() => setAlertMessage(null)} dismissible className="m-0 rounded-0 py-2 fs-5">{alertMessage}</Alert>}

            <Row className="g-0 m-0">
                <Col md={12} className="p-0">
                    <div style={styles.contentArea}>
                        {vistaActiva === 'bienvenida' && (
                            <div className="text-center py-5">
                                <div style={{ fontSize: '5rem' }}>🌸</div>
                                <h3 className="fw-bold mt-3" style={{ color: '#ad1457' }}>¡Área de Trabajo Lista!</h3>
                            </div>
                        )}

                        {/* ==================== SECCIÓN 1: PRENDAS CON BÚSQUEDA Y PAGINACIÓN ==================== */}
                        {vistaActiva === 'inventario' && (
                            <div>
                                <Row className="align-items-center mb-4">
                                    <Col xs={12} md={6}>
                                        <h4 className="fw-bold m-0" style={{ color: '#ad1457' }}>
                                            👗 Prendas en existencia ({productos.length} visibles)
                                        </h4>
                                    </Col>
                                    
                                    {/* 🔍 BARRA DE BÚSQUEDA FLOTANTE EN TIEMPO REAL */}
                                    <Col xs={12} md={6} className="mt-3 mt-md-0">
                                        <InputGroup className="shadow-sm">
                                            <InputGroup.Text className="bg-white border-end-0 text-muted fs-5">🔍</InputGroup.Text>
                                            <Form.Control
                                                type="text"
                                                placeholder="Buscar por nombre, categoría o etiqueta..."
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

                                <Row className="g-4">
                                    {Array.isArray(productos) && productos.map((p, i) => {
                                        const fallbackImg = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'><rect width='100%' height='100%' fill='%23fce4ec'/><text x='50%' y='50%' font-family='sans-serif' font-size='14' fill='%23ad1457' text-anchor='middle'>Prenda SmartBoutique</text></svg>";
                                        const tagsArray = p.tags && Array.isArray(p.tags) ? p.tags : [];
                                        let imagenSrc = fallbackImg; 

                                        if (p.imagen_url && p.imagen_url.trim() !== '' && !p.imagen_url.includes('[object Object]')) {
                                            if (p.imagen_url.startsWith('data:image') || p.imagen_url.includes('http')) {
                                                imagenSrc = p.imagen_url;
                                            } else {
                                                imagenSrc = `data:image/jpeg;base64,${p.imagen_url}`;
                                            }
                                        }

                                        return (
                                            <Col xs={12} sm={6} md={4} lg={3} xl={2} key={i} className="d-flex"> 
                                                <Card style={styles.cardBoutique} className="shadow-sm h-100 overflow-hidden bg-white border-0 w-100">
                                                    <div className="d-flex justify-content-center align-items-center bg-light p-3" style={{ height: '230px', overflow: 'hidden', backgroundColor: '#fffdfd', borderBottom: '1px solid #f8bbd0' }}>
                                                        <Card.Img variant="top" src={imagenSrc} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} onError={(e) => { e.target.src = fallbackImg; }} />
                                                    </div>

                                                    <Card.Body className="d-flex flex-column justify-content-between p-3" style={{ fontSize: '1.05rem' }}>
                                                        <div>
                                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                                <span className="text-muted fw-bold text-uppercase" style={{ fontSize: '0.85rem' }}>{p.categoria || 'Moda'}</span>
                                                                <Badge bg="light" text="dark" className="border">#{p.id}</Badge>
                                                            </div>
                                                            <Card.Title className="fw-bold text-dark fs-5 mb-1 text-truncate">{p.nombre}</Card.Title>
                                                            <Card.Text className="text-muted mb-2 small text-truncate-2" style={{ minHeight: '36px' }}>{p.descripcion || 'Sin descripción.'}</Card.Text>

                                                            <div className="d-flex flex-wrap gap-1 mb-2">
                                                                <Badge bg="dark" className="p-1 small">Talla: {p.talla || 'M'}</Badge>
                                                                <Badge bg={p.stock > 10 ? 'success' : 'danger'} className="p-1 small">Stock: {p.stock} pz</Badge>
                                                            </div>
                                                        </div>

                                                        <div className="mt-2">
                                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                                <div className="d-flex flex-wrap gap-1" style={{ maxWidth: '50%' }}>
                                                                    {tagsArray.slice(0, 2).map((t, idx) => (
                                                                        <Badge key={idx} bg="light" text="secondary" className="border p-1" style={{ fontSize: '0.75rem' }}>#{t}</Badge>
                                                                    ))}
                                                                </div>
                                                                <h4 className="fw-bold text-danger m-0 font-monospace">${parseFloat(p.precio || 0).toFixed(2)}</h4>
                                                            </div>

                                                            <Button size="sm" style={{ backgroundColor: '#ad1457', border: 'none', borderRadius: '8px' }} className="w-100 fw-bold py-2 shadow-sm" onClick={() => abrirFormularioProducto(p)}>
                                                                ⚙️ Actualizar Prenda
                                                            </Button>
                                                        </div>
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                        );
                                    })}
                                </Row>

                                {/* 🎚️ CONTROL DE PAGINACIÓN FLOTANTE / SCROLLING DINÁMICO */}
                                {paginaActual < totalPaginas && (
                                    <div className="text-center mt-5">
                                        <Button 
                                            size="lg" 
                                            variant="outline-secondary" 
                                            className="px-5 py-3 fw-bold shadow-sm" 
                                            style={{ borderRadius: '30px', color: '#ad1457', borderColor: '#ad1457' }}
                                            onClick={handleCargarMasProductos}
                                            disabled={cargandoMas}
                                        >
                                            {cargandoMas ? '⏳ Cargando más tendencias...' : '👇 Cargar más prendas'}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ==================== SECCIÓN 2: RECEPCIÓN DE MERCANCÍA ==================== */}
                        {vistaActiva === 'mercancia' && (
                            <div className="mx-auto" style={{ maxWidth: '900px', background: '#fce4ec', borderRadius: '18px', padding: '35px', border: '1px solid #f8bbd0' }}>
                                <div className="mb-4 text-center pb-2 border-bottom">
                                    <h3 className="fw-bold mb-1" style={{ color: '#ad1457' }}>Agregar Nueva Prenda</h3>
                                </div>
                                <Form onSubmit={handleAddProduct}>
                                    <Row className="g-3 mb-3">
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label className="fw-bold text-muted">Nombre del Artículo</Form.Label>
                                                <Form.Control type="text" value={nombre} onChange={e => setNombre(e.target.value)} required placeholder="Ej: Vestido Gala" className="form-control-lg" />
                                            </Form.Group>
                                        </Col>
                                        <Col md={3}><Form.Group><Form.Label className="fw-bold text-muted">Precio Venta ($)</Form.Label><Form.Control type="number" step="0.01" value={precio} onChange={e => setPrecio(e.target.value)} required className="form-control-lg text-center" /></Form.Group></Col>
                                        <Col md={3}><Form.Group><Form.Label className="fw-bold text-muted">Cantidad Inicial</Form.Label><Form.Control type="number" value={stock} onChange={e => setStock(e.target.value)} required className="form-control-lg text-center" /></Form.Group></Col>
                                    </Row>
                                    <Row className="g-3 mb-3">
                                        <Col md={4}>
                                            <Form.Group>
                                                <Form.Label className="fw-bold text-muted">Talla Base</Form.Label>
                                                <Form.Select value={talla} onChange={e => setTalla(e.target.value)} className="form-select-lg"><option value="S">S</option><option value="M">M</option><option value="L">L</option></Form.Select>
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}><Form.Group><Form.Label className="fw-bold text-muted">Color Temático</Form.Label><Form.Control type="text" value={editProdColor} onChange={e => setEditProdColor(e.target.value)} placeholder="Negro, Arena..." required className="form-control-lg" /></Form.Group></Col>
                                        <Col md={4}><Form.Group><Form.Label className="fw-bold text-muted">Categoría</Form.Label><Form.Control type="text" value={editProdCategoria} onChange={e => setEditProdCategoria(e.target.value)} placeholder="Tops, Vestidos..." required className="form-control-lg" /></Form.Group></Col>
                                    </Row>
                                    <Form.Group className="mb-3">
                                        <Form.Label className="fw-bold text-muted">Fotografía</Form.Label>
                                        <Form.Control type="file" accept="image/*" onChange={handleFileChange} className="form-control-lg" />
                                    </Form.Group>
                                    <Button type="submit" className="w-100 fw-bold py-3 text-white shadow" style={{ backgroundColor: '#ad1457', border: 'none', borderRadius: '10px' }}>📦 Guardar Producto Nuevo</Button>
                                </Form>
                            </div>
                        )}

                        {/* ==================== SECCIÓN 3: EMPLEADOS ==================== */}
                        {vistaActiva === 'usuarios' && (
                            <div>
                                <h4 className="fw-bold mb-3 shadow-sm p-2 text-white rounded" style={{ backgroundColor: '#ad1457' }}>👥 Gestión de Staff</h4>
                                <Form onSubmit={handleAddUser} className="row g-3 mb-4 p-3 bg-light rounded align-items-end m-0 border shadow-sm">
                                    <Col md={3}><Form.Control type="text" placeholder="Usuario" value={nuevoUsername} onChange={e => setNuevoUsername(e.target.value)} className="form-control-lg" required /></Col>
                                    <Col md={3}>
                                        <InputGroup>
                                            <Form.Control type={showNewPass ? "text" : "password"} placeholder="Contraseña" value={nuevoPassword} onChange={e => setNuevoPassword(e.target.value)} className="form-control-lg" required />
                                            <Button variant="outline-secondary" onClick={() => setShowNewPass(!showNewPass)}>{showNewPass ? '🙈' : '👁️'}</Button>
                                        </InputGroup>
                                    </Col>
                                    <Col md={3}>
                                        <Form.Select value={nuevoRol} onChange={e => setNuevoRol(e.target.value)} className="form-select-lg">
                                            <option value="admin">Administrador</option>
                                            <option value="encargado">Encargado</option>
                                            <option value="vendedor">Vendedor</option>
                                        </Form.Select>
                                    </Col>
                                    <Col md={3}><Button type="submit" variant="success" className="w-100 py-2 btn-lg fw-bold shadow-sm">➕ Añadir</Button></Col>
                                </Form>
                                <Table responsive hover className="text-center align-middle border">
                                    <thead className="table-light"><tr><th>ID</th><th>Usuario</th><th>Rol</th><th>Contraseña</th><th>Acciones</th></tr></thead>
                                    <tbody>
                                        {listaUsuarios.map((u, i) => (
                                            <tr key={i}>
                                                <td>{u.id}</td>
                                                <td className="fw-bold">{editandoId === u.id ? <Form.Control type="text" value={editUsername} onChange={e => setEditUsername(e.target.value)} /> : u.username}</td>
                                                <td>{editandoId === u.id ? <Form.Select value={editRol} onChange={e => setEditRol(e.target.value)}><option value="admin">admin</option><option value="vendedor">vendedor</option></Form.Select> : <Badge bg="danger" className="fs-6">{u.rol}</Badge>}</td>
                                                <td>{editandoId === u.id ? <Form.Control type="text" value={editPassword} onChange={e => setEditPassword(e.target.value)} /> : '••••••••'}</td>
                                                <td>
                                                    {/* Columnas de Acciones de Empleados */}
                                                <td>
                                                    {editandoId === u.id ? (
                                                        <>
                                                            <Button variant="primary" className="btn-md fw-bold me-2 px-3 py-1" onClick={() => handleSaveEditUser(u.id)}>Guardar</Button>
                                                            <Button variant="dark" className="btn-md fw-bold px-3 py-1" onClick={() => { setEditandoId(null); setEditPassword(''); setShowPass(false); }}>X</Button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Button 
                                                                variant="outline-secondary" 
                                                                className="btn-sm me-2 px-3 py-1 fw-bold" 
                                                                onClick={() => { 
                                                                    setEditandoId(u.id); 
                                                                    setEditUsername(u.username); 
                                                                    setEditRol(u.rol); 
                                                                    setEditPassword(u.password || ''); 
                                                                    setShowPass(false); 
                                                                }}
                                                            >
                                                                ✏️
                                                            </Button>
                                                            
                                                            {/* 🗑️ BOTÓN DE ELIMINACIÓN CON BOTE DE BASURA CONFIGURADO */}
                                                            <Button 
                                                                variant="outline-danger" 
                                                                className="btn-sm px-3 py-1 fw-bold shadow-sm" 
                                                                onClick={() => { 
                                                                    setUserIdAEliminar(u.id); 
                                                                    setUsernameAEliminar(u.username); 
                                                                    setShowDeleteModal(true); // 🔓 Desbloquea el Modal de Advertencia
                                                                }}
                                                            >
                                                                🗑️
                                                            </Button>
                                                        </>
                                                    )}
                                                </td>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        )}
                        {/* ==================== 🔒 MODAL DE ELIMINACIÓN DE STAFF (BOTE DE BASURA) ==================== */}
                        <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered backdrop="static">
                            <Modal.Header closeButton className="border-0 pb-0">
                                <Modal.Title className="fw-bold fs-4 text-danger">⚠️ Confirmar Baja de Personal</Modal.Title>
                            </Modal.Header>
                            <Modal.Body className="py-3 fs-5">
                                <p className="text-muted">
                                    Estás a punto de eliminar de forma permanente al empleado 
                                    <b className="text-dark"> "{usernameAEliminar}" </b> (ID: #{userIdAEliminar}) del sistema.
                                </p>
                                <div className="alert alert-warning py-2 mb-0 small fw-bold">
                                    ❗ Esta acción desvinculará sus credenciales de acceso de forma inmediata en la base de datos cloud.
                                </div>
                            </Modal.Body>
                            <Modal.Footer className="border-0 pt-0">
                                <Button variant="light" className="fw-bold" onClick={() => setShowDeleteModal(false)}>
                                    Cancelar
                                </Button>
                                <Button 
                                    variant="danger" 
                                    className="fw-bold px-4" 
                                    onClick={async () => {
                                        try {
                                            // Executa el consumo a la API mapeada con DELETE
                                            const res = await fetch(`http://34.219.103.28:3000/api/productos/usuarios/${userIdAEliminar}`, {
                                                method: 'DELETE',
                                                headers: getAuthHeaders()
                                            });

                                            if (res.ok) {
                                                setShowDeleteModal(false);
                                                // Limpieza reactiva en caliente sobre la tabla del frontend
                                                setListaUsuarios(listaUsuarios.filter(u => u.id !== userIdAEliminar));
                                                
                                                Swal.fire({
                                                    title: '¡Eliminado!',
                                                    text: `El operador "${usernameAEliminar}" ha sido removido con éxito de AWS RDS.`,
                                                    icon: 'success',
                                                    confirmButtonColor: '#ad1457'
                                                });
                                            } else {
                                                Swal.fire('❌ Error', 'No se pudo procesar la baja en el servidor.', 'error');
                                            }
                                        } catch (err) {
                                            console.error("Error al borrar usuario:", err);
                                            Swal.fire('❌ Error', 'Fallo de conectividad de red.', 'error');
                                        }
                                    }}
                                >
                                    💥 Confirmar Eliminación
                                </Button>
                            </Modal.Footer>
                        </Modal>

                        {/* ==================== SECCIÓN 4: AUDITORÍA DE MOVIMIENTOS ==================== */}
                        {vistaActiva === 'auditoria' && (
                            <div>
                                <h4 className="fw-bold mb-4" style={{ color: '#ad1457' }}>📡 Historial Global Operativo</h4>
                                {recentActivity && recentActivity.length > 0 ? (
                                    <div className="table-responsive">
                                        <Table responsive hover className="align-middle border mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th style={{ width: '8%' }} className="text-center">ID</th>
                                                    <th style={{ width: '10%' }} className="text-center">Usuario ID</th>
                                                    <th style={{ width: '12%' }} className="text-center">Operador</th>
                                                    <th style={{ width: '8%' }} className="text-center">Rol</th>
                                                    <th style={{ width: '18%' }} className="text-center">Acción Realizada</th>
                                                    <th style={{ width: '28%' }} className="text-start">Detalle Acción</th>
                                                    <th style={{ width: '16%' }} className="text-center">Fecha y Hora</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {recentActivity.map((log, i) => (
                                                    <tr key={i}>
                                                        <td className="text-center fw-bold small">{log.id}</td>
                                                        <td className="text-center fw-bold small">{log.usuario_id || '---'}</td>
                                                        <td className="text-center fw-bold">{log.usuario || log.username || '---'}</td>
                                                        <td className="text-center"><Badge bg="danger">{log.rol || 'N/A'}</Badge></td>
                                                        <td className="text-center fw-bold text-secondary small">{log.accion_realizada}</td>
                                                        <td className="text-start text-muted small ps-3">{log.detalle_accion}</td>
                                                        <td className="text-center font-monospace small">{log.fecha ? new Date(log.fecha).toLocaleString('es-MX') : '---'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </div>
                                ) : (
                                    <div className="alert alert-info text-center fw-bold">
                                        <i className="bi bi-info-circle me-2"></i>
                                        No hay movimientos registrados en la base de datos.
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ==================== SECCIÓN 5: VENTAS EXPRESS ==================== */}
                        {vistaActiva === 'ventas' && (
                            <div>
                                <h4 className="fw-bold mb-3" style={{ color: '#ad1457' }}>🛒 Terminal de Cobro Express</h4>
                                <Form onSubmit={handleCompraDirecta} className="row g-3 mb-5 p-3 bg-light rounded align-items-end m-0 border shadow-sm">
                                    <Col md={2}><Form.Label className="fw-bold text-muted">ID Artículo</Form.Label><Form.Control type="number" value={idProductoVenta} onChange={e => setIdProductoVenta(e.target.value)} className="form-control-lg text-center" required /></Col>
                                    <Col md={2}><Form.Label className="fw-bold text-muted">Cantidad</Form.Label><Form.Control type="number" value={cantidadVenta} onChange={e => setCantidadVenta(e.target.value)} className="form-control-lg text-center" required /></Col>
                                    <Col md={5}>
                                        <Form.Label className="fw-bold text-muted">Descuento</Form.Label>
                                        <Form.Select value={descuentoSeleccionado} onChange={e => setDescuentoSeleccionado(e.target.value)} className="form-select-lg">
                                            <option value="0">Sin Descuento (0%)</option>
                                            <option value="10">Temporada (10%)</option>
                                            <option value="50">Gran Outlet (50%)</option>
                                        </Form.Select>
                                    </Col>
                                    <Col md={3}><Button type="submit" className="w-100 fw-bold py-2 btn-lg text-white" style={{ backgroundColor: '#ad1457' }}>💰 Cobrar</Button></Col>
                                </Form>
                                <Table responsive hover className="text-center align-middle border">
                                    <thead className="table-light"><tr><th>Folio</th><th>Vendedor</th><th>Total Cobrado</th><th>Acciones</th></tr></thead>
                                    <tbody>
                                        {ventasData.map((v, i) => (
                                            <tr key={i}>
                                                <td className="fw-bold">V-{v.id}</td>
                                                <td>{v.username || v.usuario_id}</td>
                                                <td className="fw-bold text-success">${parseFloat(v.total).toFixed(2)}</td>
                                                <td><Button variant="outline-secondary" size="sm" onClick={() => handleVerDetallesTicket(v.id)}>👁️ Ver Detalle</Button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        )}

                        {/* ==================== SECCIÓN 6: FINANCIAL BOX ==================== */}
                         {vistaActiva === 'caja' && (
                    <div className="p-2" style={{ fontSize: '1.05rem' }}>
                        <h4 className="fw-bold mb-4" style={{ color: '#c2185b' }}>💵 Control Financiero y Arqueos de Turno Local</h4>
                        <div className="row g-3 justify-content-center text-center mb-5">
                            <div className="col-12 col-md-3">
                                <div className="p-3 shadow-sm rounded-4 border bg-white d-flex flex-column justify-content-center align-items-center" style={{ height: '100%', minHeight: '140px' }}>
                                    <span className="text-muted fw-bold text-uppercase small">Fondo Apertura</span>
                                    <h2 className="fw-black my-2 text-primary" style={{ fontSize: '1.8rem' }}>${cajaActiva?.estado === 'abierta' ? parseFloat(cajaActiva.monto_inicial).toFixed(2) : '0.00'}</h2>
                                    <Badge bg={cajaActiva?.estado === 'abierta' ? 'success' : 'secondary'} className="px-3 py-2 fs-7">{cajaActiva?.estado === 'abierta' ? 'Turno Activo' : 'Turno Cerrado'}</Badge>
                                </div>
                            </div>
                            <div className="col-12 col-md-4">
                                {cajaActiva?.estado === 'abierta' ? (
                                    <button onClick={handleCerrarCaja} className="w-100 p-4 shadow border rounded-4 text-white h-100 d-flex flex-column justify-content-center align-items-center" style={{ background: 'linear-gradient(135deg, #d32f2f, #c2185b)', cursor: 'pointer' }}>
                                        <div className="fs-2 mb-1">🔓</div><span className="fw-bold text-uppercase text-white-50 small">Arqueo de Turno</span><h3 className="fw-bold m-0 mt-1" style={{ fontSize: '1.45rem' }}>Realizar Corte de Caja</h3>
                                    </button>
                                ) : (
                                    <button onClick={() => setShowModalAbrir(true)} className="w-100 p-4 shadow border rounded-4 text-white h-100 d-flex flex-column justify-content-center align-items-center" style={{ background: 'linear-gradient(135deg, #2e7d32, #1b5e20)', cursor: 'pointer' }}>
                                        <div className="fs-2 mb-1">💵</div><span className="fw-bold text-uppercase text-white-50 small">Turno Inactivo</span><h3 className="fw-bold m-0 mt-1" style={{ fontSize: '1.45rem' }}>Abrir Turno</h3>
                                    </button>
                                )}
                            </div>
                            <div className="col-12 col-md-3">
                                <button onClick={() => { if(cajaActiva) { handleImprimirTicketCorte(cajaActiva); } }} className="w-100 p-3 shadow-sm border rounded-4 bg-white h-100 d-flex flex-column justify-content-center align-items-center">
                                    <span className="text-muted fw-bold text-uppercase small">Total en Caja</span>
                                    <h2 className="fw-black my-2 text-success" style={{ fontSize: '1.8rem' }}>${cajaActiva ? (parseFloat(cajaActiva.monto_final || cajaActiva.monto_inicial) - parseFloat(cajaActiva.monto_inicial)).toFixed(2) : '0.00'}</h2>
                                    <span className="badge bg-dark rounded-pill py-2 px-3 text-uppercase font-monospace fs-7">📄 Imprimir Reporte</span>
                                </button>
                            </div>
                        </div>

                        <div className="bg-white rounded-4 p-3 shadow-sm border">
                            <h6 className="fw-bold text-secondary mb-3 fs-5">📋 Historial General de Arqueos locales</h6>
                            <Table responsive hover className="text-center align-middle mb-0 table-borderless">
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

                        {/* ==================== SECCIÓN 7: DEVOLUCIONES ==================== */}
                        {vistaActiva === 'devoluciones' && (
                            <div>
                                <h4 className="fw-bold mb-4" style={{ color: '#ad1457' }}>↩️ Devoluciones Globales</h4>
                                <Card className="mb-4 shadow-sm border-0" style={{ borderRadius: '14px', backgroundColor: '#fce4ec', border: '1px solid #f8bbd0' }}>
                                    <Card.Body className="p-4">
                                        <Form onSubmit={handleRegistroDevolucion}>
                                            <Row className="g-3 align-items-end">
                                                <Col md={2}><Form.Group><Form.Label className="fw-bold text-muted">TicketOrig.</Form.Label><Form.Control type="number" name="venta_id" className="form-control-lg text-center" required /></Form.Group></Col>
                                                <Col md={4}><Form.Group><Form.Label className="fw-bold text-muted">Artículo Devuelto</Form.Label><Form.Control type="text" name="producto_detalle" className="form-control-lg" required /></Form.Group></Col>
                                                <Col md={2}><Form.Group><Form.Label className="fw-bold text-muted">Cantidad</Form.Label><Form.Control type="number" name="cantidad" className="form-control-lg text-center" required /></Form.Group></Col>
                                                <Col md={2}><Form.Group><Form.Label className="fw-bold text-muted">Reembolso ($)</Form.Label><Form.Control type="number" step="0.01" name="monto_reembolsado" className="form-control-lg text-center" required /></Form.Group></Col>
                                                <Col md={2}><Form.Group><Form.Label className="fw-bold text-muted">Método</Form.Label><Form.Select name="tipo_reembolso" className="form-select-lg"><option value="Efectivo">💵 Efectivo</option><option value="Nota de Crédito">🎟️ Nota de Crédito</option></Form.Select></Form.Group></Col>
                                                <Col md={12}><Form.Group><Form.Label className="fw-bold text-muted">Motivo del Cambio</Form.Label><Form.Control type="text" name="motivo_devolucion" className="form-control-lg" required /></Form.Group></Col>
                                                <Col md={12} className="text-end mt-3"><Button type="submit" className="fw-bold px-4 py-2 btn-lg text-white shadow" style={{ backgroundColor: '#ad1457', borderColor: '#ad1457' }}>↩️ Aplicar Reembolso</Button></Col>
                                            </Row>
                                        </Form>
                                    </Card.Body>
                                </Card>
                                <Table responsive hover className="text-center align-middle border">
                                    <thead className="table-light"><tr><th>ID DEV</th><th>Ticket</th><th>Artículo</th><th>Reembolso</th></tr></thead>
                                    <tbody>
                                        {devolucionesData.map((d, i) => (
                                            <tr key={i}>
                                                <td className="fw-bold">#DEV-{d.id}</td>
                                                <td>#V-{d.venta_id}</td>
                                                <td className="fw-bold">{d.producto_detalle}</td>
                                                <td className="text-danger fw-bold">${parseFloat(d.monto_reembolsado).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        )}

                    </div>
                </Col>
            </Row>

            {/* ==================== MODALES FLOTANTES (TICKETS Y ACTUALIZACIONES) ==================== */}
            <Modal show={showTicketModal} onHide={() => setShowTicketModal(false)} centered size="sm">
                <Modal.Body className="p-4" style={{ fontFamily: 'Courier New, monospace', backgroundColor: '#ffffff', fontSize: '1.05rem' }}>
                    <div className="d-flex gap-2 justify-content-center mb-4 d-print-none">
                        <Button variant="success" size="md" className="fw-bold px-4 shadow-sm border-0" style={{ backgroundColor: '#2e7d32' }} onClick={handleImprimirTicketVenta}>🖨️ Imprimir</Button>
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
                        <div className="d-flex justify-content-between fw-bold mb-3" style={{ fontSize: '0.95rem' }}><span>TOTAL COBRADO:</span><span className="text-success">${detallesTicket.reduce((acc, item) => acc + (item.cantidad * parseFloat(item.precio_unitario)), 0).toFixed(2)}</span></div>
                    </div>
                </Modal.Body>
            </Modal>

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

            <Modal show={showModalAbrir} onHide={() => setShowModalAbrir(false)} centered backdrop="static">
                <Modal.Header closeButton><Modal.Title className="fw-bold" style={{ color: '#ad1457' }}>🔑 Apertura de Caja</Modal.Title></Modal.Header>
                <form onSubmit={handleAbrirCajaDefinitivo}>
                    <Modal.Body>
                        <Form.Control type="number" step="0.01" min="0" placeholder="0.00" className="text-center fw-bold fs-2 text-primary" value={montoInicialInput} onChange={(e) => setMontoInicialInput(e.target.value)} autoFocus required />
                    </Modal.Body>
                    <Modal.Footer><Button type="submit" variant="success" className="fw-bold w-100">Confirmar Apertura</Button></Modal.Footer>
                </form>
            </Modal>

            <footer className="dashboard-footer">
                <div className="dashboard-footer-title">© 2026 SmartBoutique</div>
                <div className="dashboard-footer-subtitle">Panel administrativo premium • Gestión integral</div>
                <div className="dashboard-footer-legal">AWS RDS PostgreSQL Server • Conexión Cifrada Activa</div>
            </footer>
        </div>
    );
};

export default AdminDashboard;