import React, { useState, useEffect } from 'react';
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
    // Control de lienzo dinámico central
    const [vistaActiva, setVistaActiva] = useState('bienvenida');
    const [showTicketModal, setShowTicketModal] = useState(false);
    const [detallesTicket, setDetallesTicket] = useState([]);
    const [folioSeleccionado, setFolioSeleccionado] = useState('');
    // ====== ESTADOS PARA EL MÓDULO DE VENTAS ======
    const [idProductoVenta, setIdProductoVenta] = useState('');
    const [cantidadVenta, setCantidadVenta] = useState('');
    const [descuentoSeleccionado, setDescuentoSeleccionado] = useState('0'); // Guarda el porcentaje como String (0, 10, 20, etc.)
    const [movimientosCajaData, setMovimientosCajaData] = useState([]); // ──> Guardará las aperturas y cierres
    const [showModalAbrir, setShowModalAbrir] = useState(false); // Controla el modal flotante
    const [montoInicialInput, setMontoInicialInput] = useState(''); // Guarda la cantidad ingresada

    // Formulario de Productos (Inserción rápida y extendida)
    const [nombre, setNombre] = useState('');
    const [precio, setPrecio] = useState('');
    const [stock, setStock] = useState('');
    const [talla, setTalla] = useState('M');

    // 👥 Agregar Usuarios
    const [nuevoUsername, setNuevoUsername] = useState('');
    const [nuevoRol, setNuevoRol] = useState('vendedor');

    // ✏️ Editar Usuarios
    const [editandoId, setEditandoId] = useState(null); 
    const [editUsername, setEditUsername] = useState('');
    const [editRol, setEditRol] = useState('vendedor');

    // 👗 ESTADOS EXCLUSIVOS PARA EL FORMULARIO FLOTANTE (MODAL DE PRODUCTOS)
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

    const cargarDatosAdmin = async () => {
        try {
            const authHeaders = getAuthHeaders();
            const resAudit = await fetch('http://34.219.103.28:3000/api/productos/auditoria');
            if (resAudit.ok) setRecentActivity(await resAudit.json());

            const resProd = await fetch('http://34.219.103.28:3000/api/productos');
            if (resProd.ok) setProductos(await resProd.json());
        
            const resUser = await fetch('http://34.219.103.28:3000/api/productos/usuarios', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json', 
                    'username': usuarioActivo,
                    ...authHeaders }
            });
            if (resUser.ok) {
                const datosUsuarios = await resUser.json();
                setListaUsuarios(datosUsuarios);
            }
            const resVentas = await fetch('http://34.219.103.28:3000/api/productos/ventas', {
                method: 'GET',
                headers: { 
                    'Content-Type': 'application/json', 
                    'username': usuarioActivo,
                    ...authHeaders 
                }
            });
            if (resVentas.ok) {
                const datosVentas = await resVentas.json();
                setVentasData(datosVentas);
            }
            const resDevoluciones = await fetch('http://34.219.103.28:3000/api/productos/devoluciones', {
                method: 'GET',
                headers: { 
                    'Content-Type': 'application/json', 
                    'username': usuarioActivo,
                    ...authHeaders 
                }
            });
            if (resDevoluciones.ok) {
                const datosDevoluciones = await resDevoluciones.json();
                setDevolucionesData(datosDevoluciones);
            }
            const resCaja = await fetch('http://34.219.103.28:3000/api/productos/movimientos-caja', {
                method: 'GET',
                headers: { 
                    'Content-Type': 'application/json', 
                    'username': usuarioActivo,
                    ...authHeaders 
                }
            });
            if (resCaja.ok) {
                setMovimientosCajaData(await resCaja.json());
            }

        } catch (error) {
            console.error("Error de conectividad AWS RDS:", error);
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
                const data = await res.json();
                setDetallesTicket(data); 
                setShowTicketModal(true);
            }
        } catch (error) {
            console.error("Error cargando detalles:", error);
        }
    };

    const handleCompraDirecta = async (e) => {
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

        const usuarioIdReal = localStorage.getItem('userId') ? parseInt(localStorage.getItem('userId')) : 1;

        const datosVenta = {
            total: totalCobradoFinal,
            descuento_aplicado: totalDineroDescontado, 
            usuario_id: usuarioIdReal,
            carrito: [
                {
                    producto_id: productoExiste.id,
                    container: parseInt(cantidadVenta),
                    cantidad: parseInt(cantidadVenta),
                    precio_unitario: precioConDescuento 
                }
            ]
        };

        try {
            const res = await fetch('http://34.219.103.28:3000/api/productos/registrar-venta', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                body: JSON.stringify(datosVenta)
            });

            if (res.ok) {
                const data = await res.json();
                setIdProductoVenta('');
                setCantidadVenta('');
                setDescuentoSeleccionado('0'); 
                await cargarDatosAdmin(); 
                
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: `Venta registrada con éxito (Folio #V-${data.venta_id})`,
                    showConfirmButton: false,
                    timer: 2000,
                    timerProgressBar: true
                });
            } else {
                Swal.fire('❌ Error', 'Error al registrar la venta en el servidor.', 'error');
            }
        } catch (error) {
            console.error("Error en la transacción exprés:", error);
            Swal.fire('❌ Error', 'Error de comunicación con el servidor.', 'error');
        }
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();
        try {
            const tagsArray = typeof editProdTags === 'string'
                ? editProdTags.split(',').map(tag => tag.trim()).filter(tag => tag !== '')
                : Array.isArray(editProdTags) ? editProdTags : [];

            const response = await fetch('http://34.219.103.28:3000/api/productos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre,
                    precio: parseFloat(precio),
                    stock: parseInt(stock),
                    talla,
                    color: editProdColor,
                    categoria: editProdCategoria,
                    descripcion: editProdDescripcion,
                    imagen_url: editProdImagen,
                    tags: tagsArray.length > 0 ? tagsArray : ['nueva_temporada'],
                    usuario: usuarioActivo,
                    rol: rolActivo
                })
            });
            if (response.ok) {
                setAlertMessage(`¡Prenda "${nombre}" inyectada con éxito! ✨`);
                setNombre(''); setPrecio(''); setStock(''); setTalla('M');
                setEditProdColor(''); setEditProdCategoria(''); setEditProdDescripcion('');
                setEditProdImagen(''); setEditProdTags('');
                setVistaActiva('inventario');
                cargarDatosAdmin();
            }
        } catch (error) {
            setAlertMessage('Error de comunicación con el servidor.');
        }
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
        
        const currentImg = p.imagen_url || '';
        setEditProdImagen(currentImg.includes('[object Object]') ? '' : currentImg);
        setEditProdTags(p.tags && Array.isArray(p.tags) ? p.tags.join(', ') : '');
        setShowProdModal(true);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0]; 
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditProdImagen(String(reader.result)); 
            };
            reader.readAsDataURL(file); 
        }
    };

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
                    nombre: editProdNombre,
                    precio: parseFloat(editProdPrecio),
                    stock: parseInt(editProdStock),
                    talla: editProdTalla,
                    color: editProdColor,
                    categoria: editProdCategoria,
                    descripcion: editProdDescripcion,
                    imagen_url: imagenAEnviar, 
                    tags: tagsArray
                })
            });

            if (response.ok) {
                setAlertMessage(`¡Cambios guardados en "${editProdNombre}" exitosamente! 📝`);
                setShowProdModal(false);
                cargarDatosAdmin(); 
            } else {
                alert("Error al actualizar la prenda.");
            }
        } catch (error) {
            console.error("Error al conectar con la API:", error);
        }
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        if (!nuevoUsername.trim()) return;
        try {
            const response = await fetch('http://34.219.103.28:3000/api/productos/usuarios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({ username: nuevoUsername, rol: nuevoRol })
            });
            if (response.ok) {
                setAlertMessage(`¡Usuario "${nuevoUsername}" registrado con éxito! 👥`);
                setNuevoUsername(''); setNuevoRol('vendedor');
                cargarDatosAdmin(); 
            }
        } catch (error) { console.error(error); }
    };

    const handleSaveEditUser = async (id) => {
        try {
            const datosAEnviar = {
                username: editUsername,
                rol: editRol,
                password: editPassword // Mandamos el valor actual del input (modificado o no)
            };

            const res = await fetch(`http://34.219.103.28:3000/api/productos/usuarios/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'username': usuarioActivo,
                    ...getAuthHeaders()
                },
                body: JSON.stringify(datosAEnviar)
            });

            if (res.ok) {
                setEditandoId(null);
                setEditPassword('');
                setShowPass(false);
                await cargarDatosAdmin(); // Recarga la tabla de inmediato
                Swal.fire('¡Actualizado!', 'Credenciales del empleado sincronizadas en AWS.', 'success');
            }
        } catch (error) {
            console.error("Error al actualizar usuario:", error);
        }
    };

    const handleCerrarCaja = async () => {
        Swal.fire({
            title: '¿Estás segura?',
            text: "¿Deseas realizar el corte y cerrar la caja por hoy?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d32f2f',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, cerrar caja 🔒',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const authHeaders = getAuthHeaders();
                    const response = await fetch('http://34.219.103.28:3000/api/productos/movimientos-caja/cerrar-caja', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', ...authHeaders },
                        body: JSON.stringify({ usuario_id: 1 }) 
                    });

                    const data = await response.json();

                    if (response.ok) {
                        Swal.fire({
                            title: '¡Caja Cerrada!',
                            html: `
                                <div style="text-align: left; font-size: 16px; margin-top: 10px;">
                                    💰 <b>Ventas del turno:</b> $${data.ventas_del_dia.toFixed(2)}<br/>
                                    💵 <b>Efectivo total entregado:</b> $${data.monto_final.toFixed(2)}
                                </div>
                            `,
                            icon: 'success',
                            confirmButtonColor: '#ad1457'
                        });
                        cargarDatosAdmin(); 
                        if (typeof cargarVentas === 'function') cargarVentas(); 
                    } else {
                        Swal.fire('⚠️ Error', data.error, 'error');
                    }
                } catch (error) {
                    console.error(error);
                    Swal.fire('❌ Error', 'Error de comunicación con el servidor.', 'error');
                }
            }
        });
    };
   
    const handleAbrirCajaDefinitivo = async (e) => {
        e.preventDefault();
        const fondoNum = parseFloat(montoInicialInput);

        if (isNaN(fondoNum) || fondoNum < 0) {
            Swal.fire('⚠️ Atención', 'Por favor, ingresa una cantidad válida igual o mayor a $0.00', 'info');
            return;
        }

        try {
            const authHeaders = getAuthHeaders();
            const response = await fetch('http://34.219.103.28:3000/api/productos/movimientos-caja/abrir-caja', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders },
                body: JSON.stringify({ usuario_id: 1, monto_inicial: fondoNum })
            });

            const data = await response.json();

            if (response.ok) {
                Swal.fire({
                    title: '¡Turno Abierto con Éxito!',
                    text: `El fondo inicial de $${fondoNum.toFixed(2)} ha sido registrado.`,
                    icon: 'success',
                    confirmButtonColor: '#2e7d32'
                });

                setShowModalAbrir(false);
                setMontoInicialInput('');
                cargarDatosAdmin(); 
            } else {
                Swal.fire('⚠️ Error', data.error, 'error');
            }
        } catch (error) {
            console.error(error);
            Swal.fire('❌ Error', 'Error de comunicación con el servidor.', 'error');
        }
    };

    const handleImprimirTicketCorte = async (datosCaja) => {
        try {
            const authHeaders = getAuthHeaders();
            const response = await fetch(`http://34.219.103.28:3000/api/productos/movimientos-caja/detalles-ticket/${datosCaja.id}`, {
                method: 'GET',
                headers: authHeaders
            });

            if (!response.ok) throw new Error("No se pudo obtener el desglose.");
            const articulosVendidos = await response.json();

            const fondoInicial = parseFloat(datosCaja.monto_inicial) || 0;
            const montoFinal = parseFloat(datosCaja.monto_final) || 0;
            const totalVentas = montoFinal > 0 ? (montoFinal - fondoInicial) : 0;

            const ventanaImpresion = window.open('', '_blank', 'width=420,height=700,scrollbars=yes');
            ventanaImpresion.document.write(`
                <html>
                <head>
                    <title>Ticket de Corte de Caja - #C-${datosCaja.id}</title>
                    <style>
                        body { font-family: 'Courier New', monospace; width: 300px; margin: 0 auto; padding: 20px 10px; font-size: 13px; color: #000; }
                        .text-center { text-align: center; }
                        .fw-bold { font-weight: bold; }
                        .linea-divisoria { border-top: 1px dashed #000; margin: 8px 0; }
                        .flex-justify { display: flex; justify-content: space-between; }
                        .grand-total { font-size: 14px; font-weight: bold; margin-top: 4px; }
                        .tabla-prendas { width: 100%; margin: 6px 0; font-size: 12px; border-collapse: collapse; }
                        .tabla-prendas th { text-align: left; border-bottom: 1px dashed #000; padding-bottom: 3px; }
                        
                        .botones-container { display: flex; gap: 10px; justify-content: center; margin-bottom: 25px; }
                        .btn-action { border: none; padding: 8px 14px; font-size: 13px; font-weight: bold; border-radius: 6px; cursor: pointer; font-family: Arial, sans-serif; }
                        .btn-download { background-color: #2e7d32; color: white; }
                        .btn-close { background-color: #c2185b; color: white; }

                        @media print {
                            .botones-container { display: none !important; }
                            body { margin: 0; padding: 10px; }
                        }
                    </style>
                </head>
                <body>
                    <div class="botones-container">
                        <button class="btn-action btn-download" onclick="window.print()">🖨️ Imprimir / Guardar</button>
                        <button class="btn-action btn-close" onclick="window.close()">❌ Cerrar Vista</button>
                    </div>
                    <div class="text-center">
                        <h3 style="margin:0; text-transform: uppercase;">✨ SmartBoutique ✨</h3>
                        <p style="margin:2px 0; font-size:11px;">SISTEMA DE AUDITORÍA CLOUD</p>
                    </div>
                    <div class="linea-divisoria"></div>
                    <div class="text-center fw-bold">📜 REPORTE X - CORTE DE CAJA 📜</div>
                    <div style="margin-top: 6px; font-size:12px;">
                        <div><b>Corte Folio:</b> #C-${datosCaja.id}</div>
                        <div><b>Usuario:</b> admin_sofi</div>
                        <div><b>Estado:</b> ${datosCaja.estado.toUpperCase()}</div>
                        <div><b>Apertura:</b> ${datosCaja.fecha_apertura ? new Date(datosCaja.fecha_apertura).toLocaleString('es-MX') : '---'}</div>
                        <div><b>Cierre:</b>   ${datosCaja.fecha_cierre ? new Date(datosCaja.fecha_cierre).toLocaleString('es-MX') : '---'}</div>
                    </div>
                    <div class="linea-divisoria"></div>
                    <div class="fw-bold text-center" style="font-size: 12px;">👕 DESGLOSE DE PRENDAS VENDIDAS</div>
                    <table class="tabla-prendas">
                        <thead>
                            <tr>
                                <th>Cant. / Articulo</th>
                                <th style="text-align: right;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            \${articulosVendidos.length === 0 ? \`
                                <tr><td colSpan="2" class="text-center" style="padding: 10px 0;">No hubo ventas.</td></tr>
                            \` : articulosVendidos.map(art => \`
                                <tr>
                                    <td>\${art.cantidad}x \${art.prenda}</td>
                                    <td style="text-align: right;">\$\${parseFloat(art.subtotal).toFixed(2)}</td>
                                </tr>
                            \`).join('')}
                        </tbody>
                    </table>
                    <div class="linea-divisoria"></div>
                    <div class="flex-justify"><span>(+) FONDO INICIAL:</span><span>\$\${fondoInicial.toFixed(2)}</span></div>
                    <div class="flex-justify"><span>(+) VENTAS TURNO:</span><span class="fw-bold text-success">\$\${totalVentas.toFixed(2)}</span></div>
                    <div class="linea-divisoria"></div>
                    <div class="flex-justify grand-total" style="border: 1px solid #000; padding: 4px;">
                        <span>(=) TOTAL EN CAJA:</span><span>\$\${montoFinal > 0 ? montoFinal.toFixed(2) : fondoInicial.toFixed(2)}</span>
                    </div>
                </body>
                </html>
            `);
            ventanaImpresion.document.close();
        } catch (error) {
            console.error(error);
            Swal.fire('❌ Error', 'No se pudo generar el ticket de corte.', 'error');
        }
    };

    const handleDeleteUser = async (id) => {
        try {
            const res = await fetch(`http://34.219.103.28:3000/api/productos/usuarios/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (res.ok) {
                setListaUsuarios(listaUsuarios.filter(u => u.id !== id));
            }
        } catch (error) {
            console.error("Error al borrar usuario:", error);
        }
    };

    const styles = {
        mainContainer: { borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' },
        headerSection: { background: 'linear-gradient(135deg, #c2185b 0%, #ad1457 100%)', padding: '26px', margin: '0', border: 'none' },
        sidebar: { backgroundColor: '#fce4ec', padding: '20px 15px', minHeight: '65vh', height: '100%', border: 'none' },
        contentArea: { backgroundColor: '#ffffff', padding: '35px', minHeight: '65vh', height: '100%', border: 'none' },
        menuBtn: { fontSize: '1.15rem', textAlign: 'left', fontWeight: 'bold', marginBottom: '6px', borderRadius: '8px', padding: '12px 14px', border: 'none', display: 'block', width: '100%' },
        footer: { background: 'linear-gradient(135deg, #c2185b 0%, #ad1457 100%)', color: '#ffffff', padding: '18px 24px', marginTop: '20px', textAlign: 'center' },
        cardBoutique: { border: '1px solid #f8bbd0', borderRadius: '14px', overflow: 'hidden', transition: 'all 0.2s' }
    };

    return (
        <div className="dashboard-responsive w-100 px-7" style={styles.mainContainer}>

            {/* ==================== 1. BANNER DE BIENVENIDA (HEADER) ==================== */}
            <header style={styles.headerSection}>
                <Row className="align-items-center m-0 w-100 flex-column flex-md-row">
                    <Col className="p-0 text-center text-md-start">
                        <h2 className="fw-bold m-0 text-white" style={{ fontSize: '2.1rem', letterSpacing: '0.5px' }}>
                            Gerencia y administración, {usuarioActivo} 👑
                        </h2>
                    </Col>
                    <Col className="p-0 text-center text-md-end mt-3 mt-md-0" style={{ minWidth: '180px' }}>
                        <Button 
                            variant="light" 
                            onClick={handleLogout}
                            style={{ 
                                borderRadius: '20px', 
                                padding: '8px 20px',
                                paddingTop: '6px', 
                                fontSize: '1.2rem', // 💡 Nota: 2.1rem lo hace del tamaño del título. Si quieres forzar los 2.1rem cámbialo aquí.
                                fontWeight: 'bold',
                                color: '#ad1457' // Hace juego con el fondo guinda
                            }}
                        >
                            Cerrar Sesión
                        </Button>
                    </Col>
                </Row>
            </header>

            <nav className="dashboard-menu" style={{ maxWidth: '100%', margin: 0 }}>
                <button type="button" className={`dashboard-menu-button flex-shrink-0 ${vistaActiva === 'inventario' ? 'active' : ''}`} onClick={() => { setVistaActiva('inventario'); cargarDatosAdmin(); }}>
                    👗 Prendas
                </button>
                <button type="button" className={`dashboard-menu-button flex-shrink-0 ${vistaActiva === 'mercancia' ? 'active' : ''}`} onClick={() => { setVistaActiva('mercancia'); cargarDatosAdmin(); }}>
                    🚛 Recepción de Mercancía
                </button>
                <button type="button" className={`dashboard-menu-button flex-shrink-0 ${vistaActiva === 'usuarios' ? 'active' : ''}`} onClick={() => { setVistaActiva('usuarios'); cargarDatosAdmin(); }}>
                    👥 Empleados
                </button>
                <button type="button" className={`dashboard-menu-button flex-shrink-0 ${vistaActiva === 'auditoria' ? 'active' : ''}`} onClick={() => { setVistaActiva('auditoria'); cargarDatosAdmin(); }}>
                    📡 Movimientos
                </button>
                <button type="button" className={`dashboard-menu-button flex-shrink-0 ${vistaActiva === 'devoluciones' ? 'active' : ''}`} onClick={() => { setVistaActiva('devoluciones'); cargarDatosAdmin(); }}>
                    ↩️ Devoluciones
                </button>
                <button type="button" className={`dashboard-menu-button flex-shrink-0 ${vistaActiva === 'ventas' ? 'active' : ''}`} onClick={() => { setVistaActiva('ventas'); cargarDatosAdmin(); }}>
                    🛍️ Ventas
                </button>
                <button type="button" className={`dashboard-menu-button flex-shrink-0 ${vistaActiva === 'caja' ? 'active' : ''}`} onClick={() => { setVistaActiva('caja'); cargarDatosAdmin(); }}>
                    💵 Control de Caja
                </button>
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

                        {vistaActiva === 'inventario' && (
                            <div>
                                <h4 className="fw-bold mb-4" style={{ color: '#ad1457' }}>👗 Prendas en existencia</h4>
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
                                            <Col xs={12} md={12} lg={2} key={i} className="d-flex"> 
                                                <Card style={styles.cardBoutique} className="shadow-sm h-100 overflow-hidden bg-white border-0">
                                                    
                                                    {/* 🖼️ IMAGEN ARRIBA (Alineación Vertical Completa) */}
                                                    <div 
                                                        className="d-flex justify-content-center align-items-center bg-light p-3" 
                                                        style={{ 
                                                            height: '260px', 
                                                            overflow: 'hidden',
                                                            backgroundColor: '#fffdfd',
                                                            borderBottom: '1px solid #f8bbd0'
                                                        }}
                                                    >
                                                        <Card.Img 
                                                            variant="top" 
                                                            src={imagenSrc} 
                                                            style={{ 
                                                                maxHeight: '100%', 
                                                                maxWidth: '100%', 
                                                                width: 'auto', 
                                                                height: 'auto', 
                                                                objectFit: 'contain' 
                                                            }} 
                                                            onError={(e) => { e.target.src = fallbackImg; }}
                                                        />
                                                    </div>

                                                    {/* 📝 DETALLES Y ACCIONES ABAJO */}
                                                    <Card.Body className="d-flex flex-column justify-content-between p-3" style={{ fontSize: '1.05rem' }}>
                                                        <div>
                                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                                <span className="text-muted fw-bold text-uppercase" style={{ fontSize: '0.95rem' }}>
                                                                    {p.categoria || 'Moda'}
                                                                </span>
                                                                <Badge bg="light" text="dark" className="border fs-6">ID: #{p.id}</Badge>
                                                            </div>
                                                            
                                                            <Card.Title className="fw-bold text-dark fs-4 mb-2">
                                                                {p.nombre}
                                                            </Card.Title>
                                                            
                                                            <Card.Text className="text-muted mb-3" style={{ fontSize: '1rem', minHeight: '44px', lineHeight: '1.4' }}>
                                                                {p.descripcion || 'Sin descripción asignada todavía.'}
                                                            </Card.Text>

                                                            {/* Especificaciones Técnicas (Badges Agrandados) */}
                                                            <div className="d-flex flex-wrap gap-2 mb-2">
                                                                <Badge bg="dark" className="p-2 fs-6">Talla: {p.talla || 'M'}</Badge>
                                                                <Badge bg="secondary" className="p-2 fs-6">Color: {p.color || 'Unicolor'}</Badge>
                                                                <Badge bg={p.stock > 10 ? 'success' : 'danger'} className="p-2 fs-6">Stock: {p.stock} pz</Badge>
                                                            </div>
                                                        </div>

                                                        {/* Bloque Inferior: Etiquetas, Precio y Botón de Ajustes */}
                                                        <div className="mt-3">
                                                            <div className="d-flex justify-content-between align-items-end mb-3">
                                                                {/* Tags */}
                                                                <div className="d-flex flex-wrap gap-1" style={{ maxWidth: '60%' }}>
                                                                    {tagsArray.map((t, idx) => (
                                                                        <Badge key={idx} bg="light" text="secondary" className="border p-1" style={{ fontSize: '0.85rem' }}>#{t}</Badge>
                                                                    ))}
                                                                </div>
                                                                {/* Control de Precio */}
                                                                <div className="text-end">
                                                                    <span className="d-block text-muted fw-bold" style={{ fontSize: '0.75rem' }}>PRECIO PISO</span>
                                                                    <h3 className="fw-bold text-danger m-0 font-monospace" style={{ fontSize: '1.8rem' }}>
                                                                        ${parseFloat(p.precio || 0).toFixed(2)}
                                                                    </h3>
                                                                </div>
                                                            </div>

                                                            {/* ⚙️ BOTÓN ACTUALIZAR INTEGRADO AL ESTILO VERTICAL COMPACTO */}
                                                            <Button 
                                                                size="md" 
                                                                style={{ backgroundColor: '#ad1457', border: 'none', borderRadius: '10px' }} 
                                                                className="w-100 fw-bold py-2 shadow-sm"
                                                                onClick={() => abrirFormularioProducto(p)}
                                                            >
                                                                ⚙️ Actualizar Prenda
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

                                <Form onSubmit={handleAddProduct}>
                                    <Row className="g-3 mb-3">
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label className="fw-bold text-muted">Nombre del Artículo</Form.Label>
                                                <Form.Control type="text" value={nombre} onChange={e => setNombre(e.target.value)} required placeholder="Ej: Vestido Gala Satinado" className="form-control-lg" />
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
                                        <Col md={4}><Form.Group><Form.Label className="fw-bold text-muted">Categoría en Tienda</Form.Label><Form.Control type="text" value={editProdCategoria} onChange={e => setEditProdCategoria(e.target.value)} placeholder="Pantalones, Tops..." required className="form-control-lg" /></Form.Group></Col>
                                    </Row>

                                    <Form.Group className="mb-3">
                                        <Form.Label className="fw-bold text-muted">Fotografía de la Prenda (Conversión automática)</Form.Label>
                                        <Form.Control type="file" accept="image/*" onChange={handleFileChange} className="form-control-lg" />
                                        {editProdImagen && editProdImagen.trim() !== '' && (
                                            <div className="mt-3 text-center bg-light p-2 rounded border">
                                                <img src={editProdImagen} alt="Vista previa" style={{ height: '140px', borderRadius: '8px', objectFit: 'contain' }} />
                                            </div>
                                        )}
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label className="fw-bold text-muted">Etiquetas (`tags` - Separados por comas)</Form.Label>
                                        <Form.Control type="text" value={editProdTags} onChange={e => setEditProdTags(e.target.value)} placeholder="lino, fresco, playa" className="form-control-lg" />
                                    </Form.Group>

                                    <Form.Group className="mb-4">
                                        <Form.Label className="fw-bold text-muted">Descripción Corta</Form.Label>
                                        <Form.Control as="textarea" rows={2} value={editProdDescripcion} onChange={e => setEditProdDescripcion(e.target.value)} placeholder="Detalles de composición o corte..." className="form-control-lg" />
                                    </Form.Group>

                                    <Button type="submit" className="w-100 fw-bold py-3 text-white shadow" style={{ backgroundColor: '#ad1457', border: 'none', borderRadius: '10px', fontSize: '1.15rem' }}>
                                        📦 Guardar Nuevo Producto.
                                    </Button>
                                </Form>
                            </div>
                        )}
                        {vistaActiva === 'usuarios' && (
    <div>
        <h4 className="fw-bold mb-3 shadow-sm p-2 text-white rounded" style={{ backgroundColor: '#ad1457', fontSize: '1.25rem' }}>
            👥 Administración de empleados y credenciales
        </h4>
        
        {/* Formulario de inserción de arriba se mantiene idéntico... */}
        <Form onSubmit={handleAddUser} autoComplete="off" className="row g-3 mb-4 p-3 bg-light rounded align-items-end m-0 border shadow-sm" style={{ fontSize: '1.05rem' }}>
            <Col md={3}>
                <Form.Control type="text" placeholder="Nuevo usuario" value={nuevoUsername} onChange={e => setNuevoUsername(e.target.value)} className="form-control-lg" autoComplete="new-username" required />
            </Col>
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
                    <option value="cliente">Cliente</option>
                </Form.Select>
            </Col>
            <Col md={3}>
                <Button type="submit" variant="success" className="w-100 py-2 btn-lg fw-bold shadow-sm">➕ Añadir</Button>
            </Col>
        </Form>

        {/* 📊 TABLA DE EMPLEADOS CON TIPOGRAFÍA GRANDE Y REVELACIÓN EN FILA */}
        <Table responsive hover className="text-center align-middle border" style={{ fontSize: '1.1rem' }}>
            <thead className="table-light">
                <tr style={{ fontSize: '1.15rem' }}>
                    <th>ID</th>
                    <th>Usuario</th>
                    <th>Rol</th>
                    <th>Contraseña</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                {listaUsuarios.map((u, i) => (
                    <tr key={i} className="border-bottom" style={{ height: '55px' }}>
                        <td>{u.id}</td>
                        
                        {/* Columna Usuario */}
                        <td className="text-start fw-bold">
                            {editandoId === u.id ? (
                                <Form.Control 
                                    type="text" 
                                    value={editUsername} 
                                    onChange={e => setEditUsername(e.target.value)} 
                                    className="form-control-lg" 
                                />
                            ) : (
                                u.username
                            )}
                        </td>
                        
                        {/* Columna Rol */}
                        <td>
                            {editandoId === u.id ? (
                                <Form.Select value={editRol} onChange={e => setEditRol(e.target.value)} className="form-select-lg">
                                    <option value="admin">admin</option>
                                    <option value="encargado">encargado</option>
                                    <option value="vendedor">vendedor</option>
                                    <option value="cliente">cliente</option>
                                </Form.Select>
                            ) : (
                                <Badge bg="danger" className="fs-6 px-3 py-2">{u.rol}</Badge>
                            )}
                        </td>
                        
                        {/* 🔒 COLUMNA CRÍTICA: CAMBIA DE PUNTITOS A TEXTO REAL AL DAR CLIC EN EL LÁPIZ */}
                        <td>
                            {editandoId === u.id ? (
                                <InputGroup style={{ maxWidth: '280px', margin: '0 auto' }}>
                                    <Form.Control 
                                        type={showPass ? "text" : "password"} 
                                        placeholder="Nueva contraseña" 
                                        value={editPassword} 
                                        onChange={e => setEditPassword(e.target.value)} 
                                        className="form-control-lg fw-bold text-danger text-center" 
                                    />
                                    <Button variant="outline-secondary" onClick={() => setShowPass(!showPass)}>
                                        {showPass ? '🙈' : '👁️'}
                                    </Button>
                                </InputGroup>
                            ) : (
                                <span className="text-muted fw-bold" style={{ letterSpacing: '2px' }}>
                                    👤 ••••••••
                                </span>
                            )}
                        </td>
                        
                        {/* Columnas de Acciones */}
                        <td>
                            {editandoId === u.id ? (
                                <>
                                    <Button variant="primary" className="btn-md fw-bold me-2 px-3 py-1" onClick={() => handleSaveEditUser(u.id)}>Guardar</Button>
                                    <Button variant="dark" className="btn-md fw-bold px-3 py-1" onClick={() => { setEditandoId(null); setEditPassword(''); setShowPass(false); }}>X</Button>
                                </>
                            ) : (
                                <>
                                    {/* ✏️ AL DAR CLIC AQUÍ JALAMOS LA CONTRASEÑA REAL DIRECTO DE LA BD AL COMPONENTE */}
                                    <Button 
                                        variant="outline-secondary" 
                                        className="btn-sm me-2 px-3 py-1 fw-bold" 
                                        onClick={() => { 
                                            setEditandoId(u.id); 
                                            setEditUsername(u.username); 
                                            setEditRol(u.rol); 
                                            setEditPassword(u.password || ''); // 👈 Inyección forzada en el Input de React
                                            setShowPass(false); // Inicia oculto, listo para picarle al ojito
                                        }}
                                    >
                                        ✏️
                                    </Button>
                                    <Button variant="outline-danger" className="btn-sm px-3 py-1 fw-bold" onClick={() => { setUserIdAEliminar(u.id); setUsernameAEliminar(u.username); setShowDeleteModal(true); }}>🗑️</Button>
                                </>
                            )}
                        </td>
                    </tr>
                ))}
            </tbody>
        </Table>
        
        {/* Modal de confirmación de borrado se mantiene abajo... */}
    </div>
)}
                       

                        {vistaActiva === 'auditoria' && (
                            <div>
                                <h4 className="fw-bold mb-4" style={{ color: '#ad1457' }}>📡 Movimientos</h4>
                                <Table responsive hover className="text-center align-middle border" style={{ fontSize: '1.05rem' }}>
                                    <thead className="table-light"><tr style={{ fontSize: '1.15rem' }}><th>Operador</th><th>Rol</th><th>Acción</th><th>Detalle de Operación</th><th>Fecha y Hora</th></tr></thead>
                                    <tbody>
                                        {recentActivity.map((log, i) => (
                                            <tr key={i} className="border-bottom" style={{ height: '44px' }}>
                                                <td className="fw-bold text-dark">{log.username || log.usuario || 'admin_sofi'}</td>
                                                <td><Badge bg="danger" className="fs-6 px-2 py-1">{log.rol || 'admin'}</Badge></td>
                                                <td className="fw-bold text-secondary">{log.accion_realizada}</td>
                                                <td className="text-muted text-start ps-3" style={{ fontSize: '1rem' }}>{log.detalle_accion}</td>
                                                <td className="text-muted font-monospace">{log.fecha ? new Date(log.fecha).toLocaleString('es-MX') : '---'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        )}

                        {vistaActiva === 'ventas' && (
                            <div className="animate__animated animate__fadeIn" style={{ fontSize: '1.05rem' }}>
                                <h4 className="fw-bold mb-3" style={{ color: '#ad1457' }}>🛒 Terminal de Cobro Express</h4>
                                <Form onSubmit={handleCompraDirecta} className="row g-3 mb-5 p-3 bg-light rounded align-items-end m-0 border shadow-sm">
                                    <Col md={2}>
                                        <Form.Label className="fw-bold text-muted mb-1">ID Producto</Form.Label>
                                        <Form.Control type="number" placeholder="Ej: 3" value={idProductoVenta} onChange={e => setIdProductoVenta(e.target.value)} className="form-control-lg text-center fw-bold" required />
                                    </Col>
                                    <Col md={2}>
                                        <Form.Label className="fw-bold text-muted mb-1">Cantidad</Form.Label>
                                        <Form.Control type="number" placeholder="Pzs" value={cantidadVenta} onChange={e => setCantidadVenta(e.target.value)} className="form-control-lg text-center fw-bold" required />
                                    </Col>
                                    <Col md={5}>
                                        <Form.Label className="fw-bold text-muted mb-1">Descuento Especial</Form.Label>
                                        <Form.Select value={descuentoSeleccionado} onChange={e => setDescuentoSeleccionado(e.target.value)} className="form-select-lg fw-bold text-secondary">
                                            <option value="0">Sin Descuento (0%)</option>
                                            <option value="10">Descuento de Temporada (10%)</option>
                                            <option value="15">Venta Especial (15%)</option>
                                            <option value="20">Liquidación (20%)</option>
                                            <option value="50">⚠️ Gran Outlet (50%)</option>
                                        </Form.Select>
                                    </Col>
                                    <Col md={3}>
                                        <Button type="submit" className="w-100 fw-bold py-2 btn-lg text-white shadow" style={{ backgroundColor: '#ad1457', borderColor: '#ad1457', fontSize: '1.15rem' }}>
                                            💰 Realizar Compra.
                                        </Button>
                                    </Col>
                                </Form>

                                <hr className="my-4 text-muted" />

                                <h4 className="fw-bold mb-3 mt-4" style={{ color: '#ad1457' }}>💰 Historial de Ventas Ejecutadas</h4>
                                <Table responsive hover className="text-center align-middle mb-0 table-borderless border" style={{ fontSize: '1.1rem' }}>
                                    <thead className="table-light">
                                        <tr style={{ height: '42px', fontSize: '1.15rem' }}><th>Folio</th><th>Vendedor</th><th>Rol</th><th>Descuento</th><th>Total Cobrado</th><th>Fecha y Hora</th><th>Acciones</th></tr>
                                    </thead>
                                    <tbody>
                                        {ventasData.length === 0 ? (
                                            <tr><td colSpan="7" className="text-muted py-4 fs-5">No hay ventas registradas en este turno de caja.</td></tr>
                                        ) : (
                                            ventasData.map((venta, i) => (
                                                <tr key={i} className="border-bottom" style={{ height: '46px' }}>
                                                    <td className="fw-bold text-secondary">V-{venta.id}</td>
                                                    <td className="fw-bold">{venta.username || `Asesor: ${venta.usuario_id}`}</td>
                                                    <td><Badge bg={venta.rol === 'admin' ? 'danger' : 'secondary'} className="fs-6">{venta.rol || 'vendedor'}</Badge></td>
                                                    <td className="text-muted">${venta.descuento_aplicado ? parseFloat(venta.descuento_aplicado).toFixed(2) : '0.00'}</td>
                                                    <td className="fw-bold text-success fs-5">${parseFloat(venta.total).toFixed(2)}</td>
                                                    <td className="text-muted">{venta.fecha_venta ? new Date(venta.fecha_venta).toLocaleString('es-MX') : '---'}</td>
                                                    <td>
                                                        <Button variant="outline-secondary" className="btn-sm py-1 px-3 fw-bold shadow-sm ms-2" onClick={() => handleVerDetallesTicket(venta.id)}>👁️ Ver Detalle</Button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </Table>
                            </div>
                        )}

                        <Modal show={showTicketModal} onHide={() => setShowTicketModal(false)} centered size="sm">
                            <Modal.Body className="p-4" style={{ fontFamily: 'Courier New, Courier, monospace', backgroundColor: '#ffffff', fontSize: '1.05rem' }}>
                                <div className="d-flex gap-2 justify-content-center mb-4 d-print-none">
                                    <Button variant="success" size="md" className="fw-bold px-4 shadow-sm border-0 btn-md" style={{ backgroundColor: '#2e7d32' }} onClick={() => window.print()}>🖨️ Imprimir</Button>
                                    <Button variant="secondary" size="md" className="fw-bold px-4 shadow-sm border-0 btn-md" style={{ backgroundColor: '#757575' }} onClick={() => setShowTicketModal(false)}>❌ Cerrar</Button>
                                </div>
                                <div className="text-center mb-3">
                                    <h4 className="fw-bold m-0" style={{ color: '#ad1457', letterSpacing: '1px' }}>✨ SMART BOUTIQUE ✨</h4>
                                    <small className="text-muted d-block" style={{ fontSize: '0.8rem' }}>Instituto Tecnológico Superior de Apatzingán</small>
                                    <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Soporte de Sistemas</small>
                                    <div className="my-2" style={{ borderTop: '1px dashed #ced4da' }}></div>
                                    <span className="fw-bold d-block">COMPROBANTE DE VENTA</span>
                                    <span className="text-secondary">Folio: #V-{folioSeleccionado}</span>
                                </div>
                                <div className="mb-3">
                                    <div className="d-flex justify-content-between fw-bold text-secondary" style={{ fontSize: '0.85rem' }}><span>DESCRIPCIÓN</span><span>CANT x PRECIO</span></div>
                                    <div className="my-1" style={{ borderTop: '1px dashed #ced4da' }}></div>
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
                                    <div className="d-flex justify-content-between text-muted">
                                        <span>PRECIO REAL (SUBTOTAL):</span>
                                        <span>${detallesTicket.reduce((acc, item) => {
                                            const prodOriginal = productos.find(p => p.id === item.producto_id);
                                            const precioOriginal = prodOriginal ? parseFloat(prodOriginal.precio) : parseFloat(item.precio_unitario);
                                            return acc + (item.cantidad * precioOriginal);
                                        }, 0).toFixed(2)}</span>
                                    </div>
                                    {detallesTicket.reduce((acc, item) => {
                                        const prodOriginal = productos.find(p => p.id === item.producto_id);
                                        const precioOriginal = prodOriginal ? parseFloat(prodOriginal.precio) : parseFloat(item.precio_unitario);
                                        return acc + ((precioOriginal - parseFloat(item.precio_unitario)) * item.cantidad);
                                    }, 0) > 0 && (
                                        <div className="d-flex justify-content-between text-danger fw-bold">
                                            <span>DESCUENTO APLICADO:</span>
                                            <span>${detallesTicket.reduce((acc, item) => {
                                                const prodOriginal = productos.find(p => p.id === item.producto_id);
                                                const precioOriginal = prodOriginal ? parseFloat(prodOriginal.precio) : parseFloat(item.precio_unitario);
                                                return acc + ((precioOriginal - parseFloat(item.precio_unitario)) * item.cantidad);
                                            }, 0).toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="my-1" style={{ borderTop: '1px dashed #ced4da' }}></div>
                                    <div className="d-flex justify-content-between fw-bold mb-3" style={{ fontSize: '0.95rem' }}>
                                        <span>TOTAL COBRADO:</span>
                                        <span className="text-success">${detallesTicket.reduce((acc, item) => acc + (item.cantidad * parseFloat(item.precio_unitario)), 0).toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="text-center mt-4">
                                    <p className="m-0 fw-bold text-muted" style={{ fontSize: '0.8rem' }}>¡Gracias por tu compra! 👑</p>
                                    <small className="text-muted" style={{ fontSize: '0.7rem' }}>SmartBoutique POS v5.0 - Cloud Infrastructure</small>
                                </div>
                            </Modal.Body>
                        </Modal>

                        {vistaActiva === 'caja' && (
                            <div className="animate__animated animate__fadeIn p-2" style={{ fontSize: '1.05rem' }}>
                                <h4 className="fw-bold mb-4" style={{ color: '#ad1457' }}>💵 Control Financiero</h4>
                                <div className="row g-3 justify-content-center text-center mb-5">
                                    <div className="col-12 col-md-3">
                                        <div className="p-3 shadow-sm rounded-4 border bg-white d-flex flex-column justify-content-center align-items-center" style={{ height: '100%', minHeight: '140px' }}>
                                            <span className="text-muted fw-bold text-uppercase small">Fondo Inicial</span>
                                            <h2 className="fw-black my-2 text-primary" style={{ fontSize: '1.8rem' }}>${movimientosCajaData[0]?.estado === 'abierta' ? parseFloat(movimientosCajaData[0].monto_inicial).toFixed(2) : '0.00'}</h2>
                                            <Badge bg={movimientosCajaData[0]?.estado === 'abierta' ? 'success' : 'secondary'} className="px-3 py-2 fs-7">{movimientosCajaData[0]?.estado === 'abierta' ? 'Caja Activa' : 'Caja Cerrada'}</Badge>
                                        </div>
                                    </div>

                                    <div className="col-12 col-md-4">
                                        {movimientosCajaData[0]?.estado === 'abierta' ? (
                                            <button onClick={handleCerrarCaja} className="w-100 p-4 shadow border rounded-4 text-white h-100 d-flex flex-column justify-content-center align-items-center" style={{ background: 'linear-gradient(135deg, #d32f2f, #c2185b)', cursor: 'pointer' }}>
                                                <div className="fs-2 mb-1">🔓</div>
                                                <span className="fw-bold text-uppercase text-white-50 small">Arqueo de Turno</span>
                                                <h3 className="fw-bold m-0 mt-1" style={{ fontSize: '1.45rem' }}>Realizar Corte de Caja</h3>
                                            </button>
                                        ) : (
                                            <button onClick={() => setShowModalAbrir(true)} className="w-100 p-4 shadow border rounded-4 text-white h-100 d-flex flex-column justify-content-center align-items-center" style={{ background: 'linear-gradient(135deg, #2e7d32, #1b5e20)', cursor: 'pointer' }}>
                                                <div className="fs-2 mb-1">💵</div>
                                                <span className="fw-bold text-uppercase text-white-50 small">Caja Inactiva</span>
                                                <h3 className="fw-bold m-0 mt-1" style={{ fontSize: '1.45rem' }}>Abrir Nuevo Turno</h3>
                                            </button>
                                        )}
                                    </div>

                                    <div className="col-12 col-md-3">
                                        <button onClick={() => { if(movimientosCajaData.length > 0) { handleImprimirTicketCorte(movimientosCajaData[0]); } else { Swal.fire('📋 Nota', 'No hay ningún corte registrado.', 'info'); } }} className="w-100 p-3 shadow-sm border rounded-4 bg-white h-100 d-flex flex-column justify-content-center align-items-center">
                                            <span className="text-muted fw-bold text-uppercase small">Vendido en Turno</span>
                                            <h2 className="fw-black my-2 text-success" style={{ fontSize: '1.8rem' }}>${movimientosCajaData[0] ? (parseFloat(movimientosCajaData[0].monto_final || movimientosCajaData[0].monto_inicial) - parseFloat(movimientosCajaData[0].monto_inicial)).toFixed(2) : '0.00'}</h2>
                                            <span className="badge bg-dark rounded-pill py-2 px-3 text-uppercase font-monospace fs-7">📄 Generar Reporte</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-white rounded-4 p-3 shadow-sm border">
                                    <h6 className="fw-bold text-secondary mb-3 fs-5">📋 Historial General</h6>
                                    <Table responsive hover className="text-center align-middle mb-0 table-borderless" style={{ fontSize: '1.05rem' }}>
                                        <thead className="table-light"><tr style={{ fontSize: '1.12rem' }}><th>ID Corte</th><th>Operador ID</th><th>F. Apertura</th><th>Monto Inicial</th><th>F. Cierre</th><th>Monto Final</th><th>Estado</th></tr></thead>
                                        <tbody>
                                            {movimientosCajaData.map((caja, i) => (
                                                <tr key={i} className="border-bottom" style={{ height: '46px' }}>
                                                    <td className="fw-bold text-secondary">#C-{caja.id}</td>
                                                    <td><Badge bg="dark" className="fs-6 px-2 py-1">User ID: {caja.usuario_id}</Badge></td>
                                                    <td className="text-muted">{caja.fecha_apertura ? new Date(caja.fecha_apertura).toLocaleString('es-MX') : '---'}</td>
                                                    <td className="fw-bold text-primary fs-5">${parseFloat(caja.monto_inicial).toFixed(2)}</td>
                                                    <td className="text-muted">{caja.fecha_cierre ? new Date(caja.fecha_cierre).toLocaleString('es-MX') : '---'}</td>
                                                    <td className="fw-bold text-success fs-5">{caja.monto_final ? `${parseFloat(caja.monto_final).toFixed(2)}` : '---'}</td>
                                                    <td><Badge bg={caja.estado === 'abierta' ? 'success' : 'secondary'} className="fs-6 px-2 py-1">{caja.estado.toUpperCase()}</Badge></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </div>
                            </div>
                        )}

                        <Modal show={showModalAbrir} onHide={() => setShowModalAbrir(false)} centered backdrop="static">
                            <Modal.Header closeButton className="border-0 pb-0"><Modal.Title className="fw-bold fs-5" style={{ color: '#ad1457' }}>🔑 Apertura de Caja - SmartBoutique</Modal.Title></Modal.Header>
                            <form onSubmit={handleAbrirCajaDefinitivo}>
                                <Modal.Body className="py-3 fs-5">
                                    <p className="text-muted">Ingresa el monto de efectivo que se dejará en caja como fondo inicial (cambio).</p>
                                    <Form.Group>
                                        <Form.Label className="fw-bold text-secondary mb-2">Monto Inicial en Efectivo ($):</Form.Label>
                                        <Form.Control type="number" step="0.01" min="0" placeholder="0.00" className="text-center fw-bold text-primary fs-3 py-2 shadow-sm" value={montoInicialInput} onChange={(e) => setMontoInicialInput(e.target.value)} autoFocus required />
                                    </Form.Group>
                                </Modal.Body>
                                <Modal.Footer className="border-0 pt-0">
                                    <Button variant="secondary" className="fw-bold" onClick={() => setShowModalAbrir(false)}>Cancelar</Button>
                                    <Button variant="success" type="submit" className="fw-bold px-3">🚀 Confirmar Apertura</Button>
                                </Modal.Footer>
                            </form>
                        </Modal>

                        {vistaActiva === 'devoluciones' && (
                            <div className="animate__animated animate__fadeIn" style={{ fontSize: '1.05rem' }}>
                                <h5 className="fw-bold mb-3 d-flex align-items-center" style={{ color: '#ad1457' }}>↩️ Registro de Devoluciones</h5>

                                <Card className="mb-4 shadow-sm border-0" style={{ borderRadius: '14px', backgroundColor: '#f1b2d2', border: '1px solid #f8bbd0' }}>
                                    <Card.Body className="p-4">
                                        <Form onSubmit={async (e) => {
                                            e.preventDefault();
                                            const form = e.target;
                                            const datosDevolucion = {
                                                venta_id: parseInt(form.venta_id.value),
                                                producto_detalle: form.producto_detalle.value,
                                                cantidad: parseInt(form.cantidad.value),
                                                motivo_devolucion: form.motivo_devolucion.value,
                                                monto_reembolsado: parseFloat(form.monto_reembolsado.value),
                                                tipo_reembolso: form.tipo_reembolso.value,
                                                usuario_id: 1
                                            };
                                            try {
                                                const response = await fetch('http://34.219.103.28:3000/api/productos/devoluciones', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                                                    body: JSON.stringify(datosDevolucion)
                                                });
                                                if (response.ok) {
                                                    Swal.fire({ title: '¡Devolución Procesada!', text: 'El movimiento fue guardado y el stock restaurado.', icon: 'success', confirmButtonColor: '#ad1457' });
                                                    form.reset();
                                                    cargarDatosAdmin();
                                                } else {
                                                    Swal.fire('⚠️ Error', 'No se pudo registrar la devolución.', 'error');
                                                }
                                            } catch (error) { Swal.fire('❌ Error', 'Error de comunicación con AWS RDS.', 'error'); }
                                        }}>
                                            <Row className="g-3">
                                                <Col md={2}><Form.Group><Form.Label className="fw-bold text-muted">Ticket (#V)</Form.Label><Form.Control type="number" name="venta_id" className="form-control-lg text-center" required /></Form.Group></Col>
                                                <Col md={4}><Form.Group><Form.Label className="fw-bold text-muted">Prenda / Artículo</Form.Label><Form.Control type="text" name="producto_detalle" placeholder="Ej: VESTIDO MIDI" className="form-control-lg" required /></Form.Group></Col>
                                                <Col md={2}><Form.Group><Form.Label className="fw-bold text-muted">Cantidad</Form.Label><Form.Control type="number" name="cantidad" min="1" className="form-control-lg text-center" required /></Form.Group></Col>
                                                <Col md={2}><Form.Group><Form.Label className="fw-bold text-muted">Reembolso ($)</Form.Label><Form.Control type="number" step="0.01" name="monto_reembolsado" className="form-control-lg text-center" required /></Form.Group></Col>
                                                <Col md={2}>
                                                    <Form.Group>
                                                        <Form.Label className="fw-bold text-muted">Método</Form.Label>
                                                        <Form.Select name="tipo_reembolso" className="form-select-lg"><option value="Efectivo">💵 Efectivo</option><option value="Nota de Crédito">🎟️ Nota de Crédito</option></Form.Select>
                                                    </Form.Group>
                                                </Col>
                                                <Col md={12}><Form.Group><Form.Label className="fw-bold text-muted">Motivo Detallado</Form.Label><Form.Control type="text" name="motivo_devolucion" placeholder="Ej: Defecto de fábrica en costuras laterales" className="form-control-lg" required /></Form.Group></Col>
                                                <Col md={12} className="text-end mt-3"><Button type="submit" className="fw-bold px-4 py-2 btn-lg text-white shadow" style={{ backgroundColor: '#ad1457', borderColor: '#ad1457' }}>↩️ Procesar Reembolso</Button></Col>
                                            </Row>
                                        </Form>
                                    </Card.Body>
                                </Card>

                                <div className="bg-white rounded-4 p-3 shadow-sm border">
                                    <h6 className="fw-bold text-secondary mb-3 fs-5">📋 Historial de Devoluciones</h6>
                                    <Table responsive hover className="text-center align-middle mb-0 table-borderless" style={{ fontSize: '1.05rem' }}>
                                        <thead className="table-light"><tr style={{ fontSize: '1.12rem' }}><th>Folio Devolución</th><th>Ticket Orig.</th><th>Prenda / Artículo</th><th>Cant.</th><th>Motivo</th><th>Total Reembolsado</th><th>Método</th><th>Autorizó</th><th>Fecha y Hora</th></tr></thead>
                                        <tbody>
                                            {devolucionesData.length === 0 ? (
                                                <tr><td colSpan="9" className="text-muted py-4 fs-5">No hay devoluciones registradas en el sistema todavía.</td></tr>
                                            ) : (
                                                devolucionesData.map((dev, i) => (
                                                    <tr key={i} className="border-bottom" style={{ height: '46px' }}>
                                                        <td className="fw-bold text-secondary">#DEV-{dev.id}</td>
                                                        <td className="text-muted">#V-{dev.venta_id}</td>
                                                        <td className="text-start text-uppercase fw-bold">{dev.producto_detalle}</td>
                                                        <td>{dev.cantidad} pz</td>
                                                        <td className="text-muted text-start" style={{ fontSize: '1rem' }}>{dev.motivo_devolucion}</td>
                                                        <td className="fw-bold text-danger fs-5">${parseFloat(dev.monto_reembolsado).toFixed(2)}</td>
                                                        <td><Badge bg={dev.tipo_reembolso === 'Nota de Crédito' ? 'purple' : 'dark'} className="fs-6 px-2 py-1" style={{ backgroundColor: dev.tipo_reembolso === 'Nota de Crédito' ? '#7b1fa2' : '#616161' }}>{dev.tipo_reembolso}</Badge></td>
                                                        <td><Badge bg="secondary" className="fs-6">admin_sofi</Badge></td>
                                                        <td className="text-muted">{dev.fecha_devolucion ? new Date(dev.fecha_devolucion).toLocaleString('es-MX') : '---'}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </Table>
                                </div>
                            </div>
                        )}
                    </div>
                </Col>
            </Row>

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
                            <Col md={4}>
                                <Form.Group><Form.Label className="fw-bold text-muted">Talla Base</Form.Label><Form.Select value={editProdTalla} onChange={e => setEditProdTalla(e.target.value)} className="form-select-lg"><option value="S">S</option><option value="M">M</option><option value="L">L</option></Form.Select></Form.Group>
                            </Col>
                            <Col md={4}><Form.Group><Form.Label className="fw-bold text-muted">Color Temático</Form.Label><Form.Control type="text" value={editProdColor} onChange={e => setEditProdColor(e.target.value)} required className="form-control-lg" /></Form.Group></Col>
                            <Col md={4}><Form.Group><Form.Label className="fw-bold text-muted">Categoría en Tienda</Form.Label><Form.Control type="text" value={editProdCategoria} onChange={e => setEditProdCategoria(e.target.value)} required className="form-control-lg" /></Form.Group></Col>
                        </Row>
                        <Form.Group className="mb-2"><Form.Label className="fw-bold text-muted">Selector de Fotografía</Form.Label><Form.Control type="file" accept="image/*" onChange={handleFileChange} className="form-control-lg" /></Form.Group>
                        <Form.Group className="mb-2"><Form.Label className="fw-bold text-muted">Cadena Hash Binaria</Form.Label><Form.Control type="text" readOnly disabled value={editProdImagen && editProdImagen.length > 60 ? `${editProdImagen.substring(0, 60)}...` : editProdImagen} className="form-control-lg" /></Form.Group>
                        {editProdImagen && editProdImagen.trim() !== '' && !editProdImagen.includes('[object Object]') && (
                            <div className="mt-2 text-center bg-light p-2 rounded border">
                                <span className="small text-success d-block mb-1 fw-bold">✓ Vista previa de la prenda a guardar:</span>
                                <img src={editProdImagen.startsWith('data:image') || editProdImagen.includes('http') ? editProdImagen : `data:image/jpeg;base64,${editProdImagen}`} alt="Vista previa" style={{ height: '160px', borderRadius: '8px', objectFit: 'contain', border: '1px solid #f8bbd0' }} />
                            </div>
                        )}
                        <Form.Group className="mb-2"><Form.Label className="fw-bold text-muted">Etiquetas (`tags`)</Form.Label><Form.Control type="text" value={editProdTags} onChange={e => setEditProdTags(e.target.value)} className="form-control-lg" /></Form.Group>
                        <Form.Group className="mb-4"><Form.Label className="fw-bold text-muted">Descripción del Producto</Form.Label><Form.Control as="textarea" rows={2} value={editProdDescripcion} onChange={e => setEditProdDescripcion(e.target.value)} className="form-control-lg" /></Form.Group>
                        <Button type="submit" style={{ backgroundColor: '#ad1457', border: 'none' }} className="w-100 fw-bold py-3 text-white shadow btn-lg">Aplicar Cambios.</Button>
                    </Form>
                </Modal.Body>
            </Modal>
            <footer className="dashboard-footer">
                <div className="dashboard-footer-title">© 2026 SmartBoutique</div>
                <div className="dashboard-footer-subtitle">Panel administrativo premium • Gestión integral</div>
                <div className="dashboard-footer-legal">Infraestructura Global Conectada a AWS RDS Postgres v15 • Sistema en Línea Activo</div>
            </footer>
        </div>
    );
};

export default AdminDashboard;