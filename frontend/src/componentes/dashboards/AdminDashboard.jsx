import React, { useState, useEffect } from 'react';
import { Row, Col, Table, Badge, Form, Alert, Button, Card, Modal, InputGroup } from 'react-bootstrap';
import Swal from 'sweetalert2';

const AdminDashboard = () => {
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

    // 📡 Mantenemos tus llamadas exactamente a la dirección original de tu API
    
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
        
            const token = localStorage.getItem('token'); // Recupera el token local
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
                'username': usuarioActivo, // Enviamos tu cabecera para el bypass de seguridad
                ...authHeaders 
            }
        });
        if (resVentas.ok) {
            const datosVentas = await resVentas.json();
            setVentasData(datosVentas); // Guarda las ventas en el estado
        }
        const resDevoluciones = await fetch('http://34.219.103.28:3000/api/productos/devoluciones', {
            method: 'GET',
            headers: { 
                'Content-Type': 'application/json', 
                'username': usuarioActivo, // Bypass para admin_sofi
                ...authHeaders 
            }
        });
        if (resDevoluciones.ok) {
            const datosDevoluciones = await resDevoluciones.json();
            setDevolucionesData(datosDevoluciones); // Guarda las devoluciones en el estado
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
    const handleVerDetalleVenta = async (ventaId) => {
    try {
        const authHeaders = getAuthHeaders();
        // Cambia este fetch según el endpoint real que tengas para los detalles de la venta
        const response = await fetch(`http://34.219.103.28:3000/api/productos/ventas/${ventaId}`, {
            method: 'GET',
            headers: authHeaders
        });
        const datosVenta = await response.json();

        const ventana = window.open('', '_blank', 'width=420,height=600,scrollbars=yes');
        ventana.document.write(`
            <html>
            <head>
                <title>Ticket de Venta #V-${ventaId}</title>
                <style>
                    body { font-family: 'Courier New', monospace; width: 300px; margin: 0 auto; padding: 20px 10px; }
                    .text-center { text-align: center; }
                    .linea-divisoria { border-top: 1px dashed #000; margin: 8px 0; }
                    .flex-justify { display: flex; justify-content: space-between; }
                    
                    /* 🔘 ZONA DE BOTONES INTERACTIVOS */
                    .botones-container { display: flex; gap: 10px; justify-content: center; margin-bottom: 20px; }
                    .btn-ticket { border: none; padding: 6px 12px; font-size: 11px; font-weight: bold; border-radius: 4px; cursor: pointer; font-family: Arial, sans-serif; }
                    .btn-print { background-color: #2e7d32; color: white; }
                    .btn-close { background-color: #757575; color: white; }
                    
                    @media print { .botones-container { display: none !important; } }
                </style>
            </head>
            <body>
                <div class="botones-container">
                    <button class="btn-ticket btn-print" onclick="window.print()">🖨️ Imprimir</button>
                    <button class="btn-ticket btn-close" onclick="window.close()">❌ Cerrar</button>
                </div>

                <div class="text-center">
                    <h3 style="margin:0;">✨ SmartBoutique ✨</h3>
                    <p style="margin:2px 0; font-size:11px;">TICKET DE VENTA #V-${ventaId}</p>
                </div>
                <div class="linea-divisoria"></div>
                <div class="flex-justify"><span>TOTAL COBRADO:</span><b>$${parseFloat(datosVenta.total || 0).toFixed(2)}</b></div>
                <div class="linea-divisoria"></div>
                <div class="text-center" style="font-size: 10px;">¡Gracias por tu compra!</div>
            </body>
            </html>
        `);
        ventana.document.close();
    } catch (error) {
        console.error("Error al generar ticket de venta:", error);
    }
};
        // 1. Agregar un artículo al carrito temporal
    const handleAgregarAlCarrito = (e) => {
        e.preventDefault();
        
        // Buscamos si el producto existe en tu lista local de prendas para jalar su nombre y precio
        const productoExiste = prendasData.find(p => p.id === parseInt(idProductoVenta));
        
        if (!productoExiste) {
            alert("⚠️ El ID del producto no existe en el catálogo.");
            return;
        }
        
        if (parseInt(cantidadVenta) > productoExiste.stock) {
            alert(`⚠️ Stock insuficiente. Solo quedan ${productoExiste.stock} pz.`);
            return;
        }

        const nuevoItem = {
            producto_id: productoExiste.id,
            nombre_prenda: productoExiste.nombre, // o productoExiste.nombre_prenda según tu objeto
            cantidad: parseInt(cantidadVenta),
            precio_unitario: parseFloat(productoExiste.precio)
        };

        setCarrito([...carrito, nuevoItem]);
        setIdProductoVenta('');
        setCantidadVenta('');
    };

        const handleCompraDirecta = async (e) => {
        e.preventDefault();

        // 1. Validamos que el producto exista en tu lista de prendas local
        const productoExiste = productos.find(p => p.id === parseInt(idProductoVenta));
        
        if (!productoExiste) {
            alert("⚠️ El ID del producto no existe en el catálogo.");
            return;
        }
        
        // 2. Validamos si hay suficiente stock en AWS
        if (parseInt(cantidadVenta) > productoExiste.stock) {
            alert(`⚠️ Stock insuficiente. Solo quedan ${productoExiste.stock} pz.`);
            return;
        }

        // 3. 🎯 LÓGICA DE DESCUENTOS ESTABLECIDOS
        const precioCatalogo = parseFloat(productoExiste.precio);
        const porcentajeDescuento = parseFloat(descuentoSeleccionado); // Ej: 10 o 20
        
        // Calculamos cuánto se le va a restar por cada pieza
        const descuentoPorPieza = precioCatalogo * (porcentajeDescuento / 100);
        const precioConDescuento = precioCatalogo - descuentoPorPieza;
        
        // Calculamos los totales globales de la transacción
        const totalCobradoFinal = parseInt(cantidadVenta) * precioConDescuento;
        const totalDineroDescontado = parseInt(cantidadVenta) * descuentoPorPieza;

        // 4. Estructuramos el cuerpo asegurando el ID correcto del operador activo
        const usuarioIdReal = localStorage.getItem('userId') ? parseInt(localStorage.getItem('userId')) : 1;

        const datosVenta = {
            total: totalCobradoFinal,
            descuento_aplicado: totalDineroDescontado, // ──> 🟢 Ahora mandamos los pesos reales ahorrados a la BD
            usuario_id: usuarioIdReal,
            carrito: [
                {
                    producto_id: productoExiste.id,
                    cantidad: parseInt(cantidadVenta),
                    precio_unitario: precioConDescuento // ──> 🟢 Se registra con el precio rebajado en detalle_ventas
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
                
                // Limpiamos los campos de la caja registradora
                setIdProductoVenta('');
                setCantidadVenta('');
                setDescuentoSeleccionado('0'); // Resetea el menú de descuentos a "Sin Descuento"
                
                // Forzamos la actualización del historial en segundo plano
                await cargarDatosAdmin(); 
                
                // Damos un breve tiempo para pintar el historial antes de abrir el ticket
                setTimeout(() => {
                    handleVerDetallesTicket(data.venta_id);
                }, 300);

            } else {
                alert("Error al registrar la venta en el servidor.");
            }
        } catch (error) {
            console.error("Error en la transacción exprés:", error);
        }
    };

    useEffect(() => { 
        cargarDatosAdmin(); 
    }, []);

    useEffect(() => {
        if (vistaActiva === 'mercancia') {
            // LIMPIAR FORMULARIO NUEVA MERCANCÍA AL CAMBIAR DE VISTA
            setNombre('');
            setPrecio('');
            setStock('');
            setTalla('M');
            setEditProdColor('');
            setEditProdCategoria('');
            setEditProdDescripcion('');
            setEditProdImagen('');
            setEditProdTags('');
        }
    }, [vistaActiva]);

    const handleAddProduct = async (e) => {
        e.preventDefault();
        try {
            const tagsArray = typeof editProdTags === 'string'
                ? editProdTags.split(',').map(tag => tag.trim()).filter(tag => tag !== '')
                : Array.isArray(editProdTags)
                    ? editProdTags
                    : [];

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

    // ✏️ FUNCIÓN PARA ACTIVAR EL MODAL Y PRECARGAR LOS DATOS DESDE LA CARD
    const abrirFormularioProducto = (p) => {
        setSelectedProd(p);
        setEditProdNombre(p.nombre || '');
        setEditProdPrecio(p.precio || '');
        setEditProdStock(p.stock || 0);
        setEditProdTalla(p.talla || 'M');
        setEditProdColor(p.color || 'Multicolor');
        setEditProdCategoria(p.categoria || 'General');
        setEditProdDescripcion(p.descripcion || '');
        
        // Blindaje contra objetos rotos de la BD al abrir el formulario
        const currentImg = p.imagen_url || '';
        setEditProdImagen(currentImg.includes('[object Object]') ? '' : currentImg);
        
        setEditProdTags(p.tags && Array.isArray(p.tags) ? p.tags.join(', ') : '');
        setShowProdModal(true);
    };

    // 🔄 Función para transformar archivos físicos a string Base64 automáticamente
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

    // 💾 MANEJADOR DEL ENVÍO DEL FORMULARIO DE EDICIÓN AVANZADA
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
            // Armamos el cuerpo básico
            const datosAEnviar = {
                username: editUsername,
                rol: editRol
            };

            // 🟢 Si la administradora escribió una contraseña nueva, la anexamos al JSON
            if (editPassword && editPassword.trim() !== '') {
                datosAEnviar.password = editPassword;
            }

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
                cargarDatosAdmin(); // Recarga la tabla de inmediato
            }
        } catch (error) {
            console.error("Error al actualizar usuario:", error);
        }
    };
        const handleCerrarCaja = async () => {
        // 🔔 Confirmación estilizada con SweetAlert2
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
                        // 🎉 Cuadro de Éxito Bonito
                        Swal.fire({
                            title: '¡Caja Cerrada!',
                            html: `
                                <div style="text-align: left; font-size: 14px; margin-top: 10px;">
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
                // 🎉 Cuadro de Éxito Bonito para la Apertura
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
                    body { font-family: 'Courier New', monospace; width: 300px; margin: 0 auto; padding: 20px 10px; font-size: 12px; color: #000; }
                    .text-center { text-align: center; }
                    .fw-bold { font-weight: bold; }
                    .linea-divisoria { border-top: 1px dashed #000; margin: 8px 0; }
                    .flex-justify { display: flex; justify-content: space-between; }
                    .grand-total { font-size: 13px; font-weight: bold; margin-top: 4px; }
                    .tabla-prendas { width: 100%; margin: 6px 0; font-size: 11px; border-collapse: collapse; }
                    .tabla-prendas th { text-align: left; border-bottom: 1px dashed #000; padding-bottom: 3px; }
                    
                    /* 🔘 ACCIONES INTERACTIVAS DEL TICKET DE CORTE */
                    .botones-container { display: flex; gap: 10px; justify-content: center; margin-bottom: 25px; }
                    .btn-action { border: none; padding: 8px 14px; font-size: 12px; font-weight: bold; border-radius: 6px; cursor: pointer; font-family: Arial, sans-serif; }
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
                    <p style="margin:2px 0; font-size:10px;">SISTEMA DE AUDITORÍA CLOUD</p>
                </div>
                
                <div class="linea-divisoria"></div>
                <div class="text-center fw-bold">📜 REPORTE X - CORTE DE CAJA 📜</div>
                <div style="margin-top: 6px; font-size:11px;">
                    <div><b>Corte Folio:</b> #C-${datosCaja.id}</div>
                    <div><b>Usuario:</b> admin_sofi</div>
                    <div><b>Estado:</b> ${datosCaja.estado.toUpperCase()}</div>
                    <div><b>Apertura:</b> ${datosCaja.fecha_apertura ? new Date(datosCaja.fecha_apertura).toLocaleString('es-MX') : '---'}</div>
                    <div><b>Cierre:</b>   ${datosCaja.fecha_cierre ? new Date(datosCaja.fecha_cierre).toLocaleString('es-MX') : '---'}</div>
                </div>
                
                <div class="linea-divisoria"></div>
                <div class="fw-bold text-center" style="font-size: 11px;">👕 DESGLOSE DE PRENDAS VENDIDAS</div>
                <table class="tabla-prendas">
                    <thead>
                        <tr>
                            <th>Cant. / Articulo</th>
                            <th style="text-align: right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${articulosVendidos.length === 0 ? `
                            <tr><td colSpan="2" class="text-center" style="padding: 10px 0;">No hubo ventas.</td></tr>
                        ` : articulosVendidos.map(art => `
                            <tr>
                                <td>${art.cantidad}x ${art.prenda}</td>
                                <td style="text-align: right;">$${parseFloat(art.subtotal).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div class="linea-divisoria"></div>
                <div class="flex-justify"><span>(+) FONDO INICIAL:</span><span>$${fondoInicial.toFixed(2)}</span></div>
                <div class="flex-justify"><span>(+) VENTAS TURNO:</span><span class="fw-bold text-success">$${totalVentas.toFixed(2)}</span></div>
                <div class="linea-divisoria"></div>
                <div class="flex-justify grand-total" style="border: 1px solid #000; padding: 4px;">
                    <span>(=) TOTAL EN CAJA:</span><span>$${montoFinal > 0 ? montoFinal.toFixed(2) : fondoInicial.toFixed(2)}</span>
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
            // Actualizas tu lista local para quitarlo de pantalla
            setListaUsuarios(listaUsuarios.filter(u => u.id !== id));
        }
    } catch (error) {
        console.error("Error al borrar usuario:", error);
    }
};

    const styles = {
        mainContainer: { borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' },
        headerSection: { background: 'linear-gradient(135deg, #ad1457 0%, #c2185b 100%)', padding: '22px', margin: '0', border: 'none' },
        sidebar: { backgroundColor: '#fce4ec', padding: '20px 15px', minHeight: '65vh', height: '100%', border: 'none' },
        contentArea: { backgroundColor: '#ffffff', padding: '30px', minHeight: '65vh', height: '100%', border: 'none' },
        menuBtn: { textAlign: 'left', fontWeight: 'bold', marginBottom: '6px', borderRadius: '8px', padding: '10px 12px', border: 'none', display: 'block', width: '100%' },
        footer: { padding: '15px', marginTop: '20px', borderTop: '1px solid #f8bbd0' },
        cardBoutique: { border: '1px solid #f8bbd0', borderRadius: '14px', overflow: 'hidden', transition: 'all 0.2s' }
    };

    return (
        <div className="w-100 px-1" style={styles.mainContainer}>
            {/* ==================== 1. BANNER DE BIENVENIDA (HEADER) ==================== */}
            <header style={styles.headerSection}>
                <Row className="text-center align-items-center m-0 w-100">
                    <Col className="p-0">
                        <h2 className="fw-bold m-0 text-white" style={{ fontSize: '1.7rem' }}>
                            Bienvenida a tu panel de Gerencia y administración, {usuarioActivo} 👑
                        </h2>
                    </Col>
                </Row>
            </header>

            <nav className="d-flex justify-content-center align-items-center gap-2 my-3 p-2 bg-light rounded shadow-sm mx-auto" style={{ maxWidth: '95%' }}>                
                <button 
                    style={{ ...styles.menuBtn, width: 'auto', padding: '6px 16px', margin: 0, backgroundColor: vistaActiva === 'inventario' ? '#ad1457' : '#fff', color: vistaActiva === 'inventario' ? '#ffffff' : '#ad1457' }} 
                    onClick={() => { setVistaActiva('inventario'); cargarDatosAdmin(); }}
                >
                    👗 Prendas
                </button>
                
                <button 
                    style={{ ...styles.menuBtn, width: 'auto', padding: '6px 16px', margin: 0, backgroundColor: vistaActiva === 'mercancia' ? '#ad1457' : '#fff', color: vistaActiva === 'mercancia' ? '#fff' : '#ad1457' }} 
                    onClick={() => { setVistaActiva('mercancia'); cargarDatosAdmin(); }}
                >
                    🚛 Recepción de Mercancía
                </button>
                
                <button 
                    style={{ ...styles.menuBtn, width: 'auto', padding: '6px 16px', margin: 0, backgroundColor: vistaActiva === 'usuarios' ? '#ad1457' : '#fff', color: vistaActiva === 'usuarios' ? '#fff' : '#ad1457' }} 
                    onClick={() => { setVistaActiva('usuarios'); cargarDatosAdmin(); }}
                >
                    👥 Empleados
                </button>
                
                <button 
                    style={{ ...styles.menuBtn, width: 'auto', padding: '6px 16px', margin: 0, backgroundColor: vistaActiva === 'auditoria' ? '#ad1457' : '#fff', color: vistaActiva === 'auditoria' ? '#fff' : '#ad1457' }} 
                    onClick={() => { setVistaActiva('auditoria'); cargarDatosAdmin(); }}
                >
                    📡 Movimientos
                </button>
                
                <button 
                    style={{ ...styles.menuBtn, width: 'auto', padding: '6px 16px', margin: 0, backgroundColor: vistaActiva === 'devoluciones' ? '#ad1457' : '#fff', color: vistaActiva === 'devoluciones' ? '#fff' : '#ad1457' }} 
                    onClick={() => { setVistaActiva('devoluciones'); cargarDatosAdmin(); }}
                >
                    ↩️ Devoluciones
                </button>
                <button 
                    style={{ ...styles.menuBtn, width: 'auto', padding: '6px 16px', margin: 0, backgroundColor: vistaActiva === 'ventas' ? '#ad1457' : '#fff', color: vistaActiva === 'ventas' ? '#fff' : '#ad1457' }} 
                    onClick={() => { setVistaActiva('ventas'); cargarDatosAdmin(); }}
                >
                    🛍️ Ventas
                </button>
                <button 
                    style={{ 
                        ...styles.menuBtn, 
                        width: 'auto', 
                        padding: '6px 16px', 
                        margin: 0, 
                        backgroundColor: vistaActiva === 'caja' ? '#ad1457' : '#fff', 
                        color: vistaActiva === 'caja' ? '#fff' : '#ad1457' 
                    }} 
                    onClick={() => { setVistaActiva('caja'); cargarDatosAdmin(); }}
                >
                    💵 Control de Caja
                </button>
            </nav>

            {alertMessage && <Alert variant="success" onClose={() => setAlertMessage(null)} dismissible className="m-0 rounded-0 py-2">{alertMessage}</Alert>}

            <Row className="g-0 m-0">
                

                <Col md={12} className="p-0">
                    <div style={styles.contentArea}>
                        {vistaActiva === 'bienvenida' && (
                            <div className="text-center py-5">
                                <div style={{ fontSize: '4rem' }}>🌸</div>
                                <h4 className="fw-bold mt-3" style={{ color: '#ad1457' }}>¡Área de Trabajo Lista!</h4>
                            </div>
                        )}

                        {vistaActiva === 'inventario' && (
                            <div>
                                <h5 className="fw-bold mb-4" style={{ color: '#ad1457' }}>👗 Prendas en existencia</h5>
                                <Row className="g-3">
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
                                            <Col md={4} key={i}>
                                                <Card style={styles.cardBoutique} className="shadow-sm h-100">
                                                    {/* 🖼️ CONTENEDOR FLEXIBLE ADAPTATIVO A LA ORIENTACIÓN */}
                                                    <div 
                                                        className="d-flex justify-content-center align-items-center bg-light p-2" 
                                                        style={{ 
                                                            height: '240px', 
                                                            overflow: 'hidden',
                                                            borderBottom: '1px solid #f8bbd0',
                                                            backgroundColor: '#fffdfd'
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
                                                            onError={(e) => { 
                                                                e.target.src = fallbackImg; 
                                                            }}
                                                        />
                                                    </div>

                                                    <Card.Body className="d-flex flex-column justify-content-between p-3">
                                                        <div>
                                                            <div className="d-flex justify-content-between align-items-center mb-1">
                                                                <span className="text-muted small fw-bold text-uppercase">{p.categoria || 'Moda'}</span>
                                                                <Badge bg="light" text="dark" className="border">ID: #{p.id}</Badge>
                                                            </div>
                                                            <Card.Title className="fw-bold text-dark fs-5 mb-1">{p.nombre}</Card.Title>
                                                            <Card.Text className="text-muted small mb-2 text-truncate-2" style={{ fontSize: '0.82rem', height: '36px', overflow: 'hidden' }}>
                                                                {p.descripcion || 'Sin descripción asignada todavía.'}
                                                            </Card.Text>
                                                            
                                                            <div className="mb-2">
                                                                <Badge bg="dark" className="me-1">Talla: {p.talla || 'M'}</Badge>
                                                                <Badge bg="secondary" className="me-1">Color: {p.color || 'Unicolor'}</Badge>
                                                                <Badge bg={p.stock > 10 ? 'success' : 'danger'}>Stock: {p.stock} pz</Badge>
                                                            </div>

                                                            <div className="mb-3">
                                                                {tagsArray.map((t, idx) => (
                                                                    <Badge key={idx} bg="light" text="secondary" className="border me-1 small">#{t}</Badge>
                                                                ))}
                                                                {tagsArray.length === 0 && <Badge bg="light" text="secondary" className="border small">#prenda</Badge>}
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <h4 className="fw-bold text-danger mb-3">${parseFloat(p.precio || 0).toFixed(2)}</h4>
                                                            <Button 
                                                                size="sm" 
                                                                style={{ backgroundColor: '#ad1457', border: 'none' }} 
                                                                className="w-100 fw-bold py-2 shadow-sm"
                                                                onClick={() => abrirFormularioProducto(p)}
                                                            >
                                                                ⚙️ Actualizar prenda
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

                        {/* 🚛 RECEPCIÓN DE MERCANCÍA PREMIUM COMPLETA */}
                        {vistaActiva === 'mercancia' && (
                            <div
                                className="mx-auto animate__animated animate__fadeIn"
                                style={{
                                    maxWidth: '900px',
                                    background: '#fffdfd',
                                    borderRadius: '18px',
                                    padding: '30px',
                                    border: '1px solid #f8bbd0',
                                    boxShadow: '0 4px 18px rgba(0,0,0,0.05)'
                                }}
                            >
                                <div className="mb-4 text-center pb-2 border-bottom">
                                    <h3 className="fw-bold mb-1" style={{ color: '#ad1457' }}>🚛 Agrega una nueva prenda</h3>
                                </div>

                                <Form onSubmit={handleAddProduct}>
                                    <Row className="g-3 mb-3">
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label className="small fw-bold text-muted">Nombre del Artículo</Form.Label>
                                                <Form.Control type="text" value={nombre} onChange={e => setNombre(e.target.value)} required placeholder="Ej: Vestido Gala Satinado" />
                                            </Form.Group>
                                        </Col>
                                        <Col md={3}><Form.Group><Form.Label className="small fw-bold text-muted">Precio Venta ($)</Form.Label><Form.Control type="number" step="0.01" value={precio} onChange={e => setPrecio(e.target.value)} required /></Form.Group></Col>
                                        <Col md={3}><Form.Group><Form.Label className="small fw-bold text-muted">Cantidad Inicial</Form.Label><Form.Control type="number" value={stock} onChange={e => setStock(e.target.value)} required /></Form.Group></Col>
                                    </Row>

                                    <Row className="g-3 mb-3">
                                        <Col md={4}>
                                            <Form.Group>
                                                <Form.Label className="small fw-bold text-muted">Talla Base</Form.Label>
                                                <Form.Select value={talla} onChange={e => setTalla(e.target.value)}><option value="S">S</option><option value="M">M</option><option value="L">L</option></Form.Select>
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}><Form.Group><Form.Label className="small fw-bold text-muted">Color Temático</Form.Label><Form.Control type="text" value={editProdColor} onChange={e => setEditProdColor(e.target.value)} placeholder="Negro, Arena..." required /></Form.Group></Col>
                                        <Col md={4}><Form.Group><Form.Label className="small fw-bold text-muted">Categoría en Tienda</Form.Label><Form.Control type="text" value={editProdCategoria} onChange={e => setEditProdCategoria(e.target.value)} placeholder="Pantalones, Tops..." required /></Form.Group></Col>
                                    </Row>

                                    <Form.Group className="mb-3">
                                        <Form.Label className="small fw-bold text-muted">Fotografía de la Prenda (Conversión automática)</Form.Label>
                                        <Form.Control type="file" accept="image/*" onChange={handleFileChange} />
                                        {editProdImagen && editProdImagen.trim() !== '' && (
                                            <div className="mt-3 text-center bg-light p-2 rounded border">
                                                <img src={editProdImagen} alt="Vista previa" style={{ height: '120px', borderRadius: '8px', objectFit: 'contain' }} />
                                            </div>
                                        )}
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label className="small fw-bold text-muted">Etiquetas (`tags` - Separados por comas)</Form.Label>
                                        <Form.Control type="text" value={editProdTags} onChange={e => setEditProdTags(e.target.value)} placeholder="lino, fresco, playa" />
                                    </Form.Group>

                                    <Form.Group className="mb-4">
                                        <Form.Label className="small fw-bold text-muted">Descripción Corta</Form.Label>
                                        <Form.Control as="textarea" rows={2} value={editProdDescripcion} onChange={e => setEditProdDescripcion(e.target.value)} placeholder="Detalles de composición o corte..." />
                                    </Form.Group>

                                    <Button type="submit" className="w-100 fw-bold py-3 text-white shadow-sm" style={{ backgroundColor: '#ad1457', border: 'none', borderRadius: '10px' }}>
                                        Guardar Nuevo Producto.
                                    </Button>
                                </Form>
                            </div>
                        )}

                        {/* 👥 CONTROL DE USUARIOS */}
                        {vistaActiva === 'usuarios' && (
                            <div>
                                <h3 className="fw-bold mb-3 small" style={{ color: '#ad1457' }}>👥 Administración de empleados.</h3>
                                <Form onSubmit={handleAddUser} autoComplete="off" className="row g-2 mb-4 p-2 bg-light rounded align-items-end m-0">
                                    {/* Input de Nombre */}
                                    <Col md={3}>
                                        <Form.Control 
                                            type="text" 
                                            placeholder="Nuevo usuario" 
                                            value={nuevoUsername} 
                                            onChange={e => setNuevoUsername(e.target.value)} 
                                            size="sm" 
                                            autoComplete="new-username"
                                            required 
                                        />
                                    </Col>
                                    
                                 
                                    <Col md={3}>
                                        <InputGroup size="sm">
                                            <Form.Control 
                                                type={showNewPass ? "text" : "password"}
                                                placeholder="Contraseña" 
                                                value={nuevoPassword} 
                                                onChange={e => setNuevoPassword(e.target.value)} 
                                                required 
                                            />
                                            <Button 
                                                variant="outline-secondary"
                                                style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                                                onClick={() => setShowNewPass(!showNewPass)}
                                            >
                                                {showNewPass ? '🙈' : '👁️'}
                                            </Button>
                                        </InputGroup>
                                    </Col>

                                    {/* Select de Rol */}
                                    <Col md={3}>
                                        <Form.Select value={nuevoRol} onChange={e => setNuevoRol(e.target.value)} size="sm">
                                            <option value="admin">Administrador</option>
                                            <option value="encargado">Encargado</option>
                                            <option value="vendedor">Vendedor</option>
                                            <option value="cliente">Cliente</option>
                                        </Form.Select>
                                    </Col>
                                    
                                    {/* Botón Añadir */}
                                    <Col md={3}>
                                        <Button type="submit" variant="success" className="w-100 btn-sm" style={{ height: '31px' }}>
                                            ➕ Añadir
                                        </Button>
                                    </Col>
                                </Form>

                                <Table responsive hover size="sm" className="small text-center align-middle mb-0 table-borderless">
                                    <thead className="table-light"><tr><th>ID</th><th>Usuario</th><th>Rol</th><th>Contraseña</th><th>Acciones</th></tr></thead>
                                    <tbody>
                                        {listaUsuarios.map((u, i) => (
                                            <tr key={i} className="border-bottom">
                                                <td>{u.id}</td>
                                                
                                                {/* Columna Usuario */}
                                                <td className="text-start">
                                                    {editandoId === u.id ? (
                                                        <Form.Control 
                                                            type="text" 
                                                            value={editUsername} 
                                                            onChange={e => setEditUsername(e.target.value)} 
                                                            size="sm" 
                                                        />
                                                    ) : (
                                                        <span className="fw-bold">{u.username}</span>
                                                    )}
                                                </td>
                                                
                                                {/* Columna Rol */}
                                                <td>
                                                    {editandoId === u.id ? (
                                                        <Form.Select value={editRol} onChange={e => setEditRol(e.target.value)} size="sm">
                                                            <option value="admin">admin</option>
                                                            <option value="encargado">encargado</option>
                                                            <option value="vendedor">vendedor</option>
                                                            <option value="cliente">cliente</option>
                                                        </Form.Select>
                                                    ) : (
                                                        <Badge bg="danger">{u.rol}</Badge>
                                                    )}
                                                </td>

                                                {/* 🟢 NUEVA SECCIÓN: Campo temporal de contraseña solo visible al editar */}
                                                <td>
                                                        {editandoId === u.id ? (
                                                            <InputGroup size="sm">
                                                                <Form.Control 
                                                                    type={showPass ? "text" : "password"}
                                                                    placeholder="Nueva contraseña (opcional)" 
                                                                    value={editPassword || ''} 
                                                                    onChange={e => setEditPassword(e.target.value)} 
                                                                    style={{ fontSize: '0.75rem' }}
                                                                />
                                                                {/* 🟢 BOTÓN DEL OJO INTEGRADO */}
                                                                <Button 
                                                                    variant="outline-secondary"
                                                                    style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                                                                    onClick={() => setShowPass(!showPass)}
                                                                >
                                                                    {showPass ? '🙈' : '👁️'}
                                                                </Button>
                                                            </InputGroup>
                                                        ) : (
                                                            <span className="text-muted small">
                                                                👤 ••••••••
                                                            </span>
                                                        )}
                                                    </td>
                                                
                                                {/* Columna Acciones */}
                                                <td>
                                                    {editandoId === u.id ? (
                                                        <>
                                                            <Button variant="primary" className="btn-sm py-0 me-1" style={{ fontSize: '0.75rem' }} onClick={() => handleSaveEditUser(u.id)}>Guardar</Button>
                                                            <Button variant="dark" className="btn-sm py-0" style={{ fontSize: '0.75rem' }} onClick={() => { setEditandoId(null); setEditPassword(''); setShowPass(false); }}>X</Button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Button variant="outline-secondary" className="btn-sm py-0 me-1" onClick={() => { setEditandoId(u.id); setEditUsername(u.username); setEditRol(u.rol); setEditPassword(''); setShowPass(false); }}>✏️</Button>
                                                            <Button variant="outline-danger" className="btn-sm py-0" onClick={() => { setUserIdAEliminar(u.id); setUsernameAEliminar(u.username); setShowDeleteModal(true); }}>🗑️</Button>
                                                        </>
                                                    )}
                                                </td>
                                                
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                                {/* ====== MODAL DE CONFIRMACIÓN DE ELIMINACIÓN ====== */}
                                <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered size="sm">
                                    <Modal.Header closeButton className="border-0 pb-0">
                                        <Modal.Title className="fw-bold text-danger h6">⚠️ Confirmar Acción</Modal.Title>
                                    </Modal.Header>
                                    <Modal.Body className="text-center py-3">
                                        <p className="m-0 small">
                                            ¿Estás segura de eliminar al usuario <strong className="text-dark">"{usernameAEliminar}"</strong>?
                                        </p>
                                    </Modal.Body>
                                    <Modal.Footer className="border-0 pt-0 d-flex justify-content-center gap-2">
                                        <Button 
                                            variant="light" 
                                            className="btn-sm px-3" 
                                            onClick={() => setShowDeleteModal(false)}
                                        >
                                            Cancelar
                                        </Button>
                                        <Button 
                                            variant="danger" 
                                            className="btn-sm px-3" 
                                            onClick={() => {
                                                // Aquí ejecutas tu lógica real de borrado (Fetch a tu API)
                                                handleDeleteUser(userIdAEliminar); 
                                                setShowDeleteModal(false); // Cierra al terminar
                                            }}
                                        >
                                            Eliminar
                                        </Button>
                                    </Modal.Footer>
                                </Modal>
                            </div>
                        )}

                        {/* 📡 AUDITORÍA */}
                        {vistaActiva === 'auditoria' && (
                            <div>
                                <h5 className="fw-bold mb-3 small" style={{ color: '#ad1457' }}>📡 Movimientos en el sistema.</h5>
                                <Table responsive hover size="sm" className="small text-center align-middle mb-0 table-borderless">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Operador</th>
                                            <th>Rol</th>
                                            <th>Acción</th>
                                            <th>Detalle</th>
                                            <th>Fecha</th> {/* 🟢 1. AGREGAMOS EL ENCABEZADO */}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentActivity.map((log, i) => (
                                            <tr key={i} className="border-bottom">
                                                <td>{log.username || log.usuario || 'admin_sofi'}</td>
                                                <td><Badge bg="danger">{log.rol || 'admin'}</Badge></td>
                                                <td>{log.accion_realizada}</td>
                                                <td className="text-muted text-start">{log.detalle_accion}</td>
                                                
                                                <td className="text-muted small">
                                                    {log.fecha ? new Date(log.fecha).toLocaleString('es-MX') : '---'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        )}
                        {/* ====== AGREGA ESTA VISTA EN AdminDashboard.jsx ====== */}
                    {vistaActiva === 'ventas' && (
                        <div className="animate__animated animate__fadeIn">
                            
                            {/* 🛒 FORMULARIO DE COMPRA EXPRÉS */}
                            <h5 className="fw-bold mb-3 small" style={{ color: '#ad1457' }}>🛒 Registrar Nueva Venta.</h5>
                            {/* 🛒 FORMULARIO DE COMPRA EXPRÉS CON MENÚ DE DESCUENTOS */}

                            <Form onSubmit={handleCompraDirecta} className="row g-2 mb-4 p-2 bg-light rounded align-items-end m-0 border">
                                {/* Input ID Producto */}
                                <Col md={3}>
                                    <Form.Label className="small fw-bold text-muted mb-1">ID Producto</Form.Label>
                                    <Form.Control 
                                        type="number" 
                                        placeholder="Ej: 3" 
                                        value={idProductoVenta} 
                                        onChange={e => setIdProductoVenta(e.target.value)} 
                                        size="sm" 
                                        required 
                                    />
                                </Col>
                                
                                {/* Input Cantidad */}
                                <Col md={3}>
                                    <Form.Label className="small fw-bold text-muted mb-1">Cantidad</Form.Label>
                                    <Form.Control 
                                        type="number" 
                                        placeholder="Piezas" 
                                        value={cantidadVenta} 
                                        onChange={e => setCantidadVenta(e.target.value)} 
                                        size="sm" 
                                        required 
                                    />
                                </Col>

                                {/* 🟢 NUEVO MENÚ DESPLEGABLE: Opciones fijas de descuento */}
                                <Col md={3}>
                                    <Form.Label className="small fw-bold text-muted mb-1">Descuento Especial</Form.Label>
                                    <Form.Select 
                                        value={descuentoSeleccionado} 
                                        onChange={e => setDescuentoSeleccionado(e.target.value)} 
                                        size="sm"
                                    >
                                        <option value="0">Sin Descuento (0%)</option>
                                        <option value="10">Descuento de Temporada (10%)</option>
                                        <option value="15">Venta Especial (15%)</option>
                                        <option value="20">Liquidación (20%)</option>
                                        <option value="50">⚠️ Gran Outlet (50%)</option>
                                    </Form.Select>
                                </Col>
                                
                                {/* Botón Realizar Compra */}
                                <Col md={3}>
                                    <Button type="submit" variant="danger" className="w-100 btn-sm" style={{ height: '31px', backgroundColor: '#ad1457', borderColor: '#ad1457' }}>
                                        💰 Realizar Compra.
                                    </Button>
                                </Col>
                            </Form>
                                                        
                            

                            <hr className="my-4 text-muted" />

                            {/* 📊 HISTORIAL DE VENTAS */}
                            <h5 className="fw-bold mb-3 small" style={{ color: '#ad1457' }}>💰 Historial de Ventas Ejecutadas</h5>
                            <Table responsive hover size="sm" className="small text-center align-middle mb-0 table-borderless">
                                <thead className="table-light">
                                    <tr>
                                        <th>Folio</th>
                                        <th>Vendedor</th>
                                        <th>Rol</th>
                                        <th>Descuento</th>
                                        <th>Total Cobrado</th>
                                        <th>Fecha y Hora</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ventasData.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="text-muted py-3">No hay ventas registradas todavía.</td>
                                        </tr>
                                    ) : (
                                        ventasData.map((venta, i) => (
                                            <tr key={i} className="border-bottom">
                                                <td className="fw-bold text-secondary">#V-{venta.id}</td>
                                                <td>{venta.vendedor_name || 'Desconocido'}</td>
                                                <td>
                                                    <Badge bg={venta.rol === 'admin' ? 'danger' : 'secondary'}>
                                                        {venta.rol || 'vendedor'}
                                                    </Badge>
                                                </td>
                                                <td className="text-muted">
                                                    ${parseFloat(venta.descuento_aplicado || 0).toFixed(2)}
                                                </td>
                                                <td className="fw-bold text-success">
                                                    ${parseFloat(venta.total).toFixed(2)}
                                                </td>
                                                <td className="text-muted">
                                                    {venta.fecha_venta ? new Date(venta.fecha_venta).toLocaleString('es-MX') : '---'}
                                                </td>
                                                <td>
                                                    <Button 
                                                        variant="outline-secondary" 
                                                        className="btn-sm py-0 px-2"
                                                        style={{ fontSize: '0.72rem', height: '24px' }}
                                                        onClick={() => handleVerDetallesTicket(venta.id)}
                                                    >
                                                        👁️ Ver Detalle
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </Table>
                        </div>
                    )}
                    {/* ====== MODAL INTERACTIVO: DESGLOSE DE TICKET COMPLETO CON DESCUENTOS ====== */}
                    <Modal show={showTicketModal} onHide={() => setShowTicketModal(false)} centered size="sm">
                        <Modal.Body className="p-4" style={{ fontFamily: 'Courier New, Courier, monospace', backgroundColor: '#ffffff' }}>
                            
                            {/* Encabezado del Ticket */}
                            <div className="text-center mb-3">
                                <h5 className="fw-bold m-0" style={{ color: '#ad1457', letterSpacing: '1px' }}>✨ SMART BOUTIQUE ✨</h5>
                                <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Instituto Tecnológico Superior de Apatzingán</small>
                                <small className="text-muted d-block" style={{ fontSize: '0.7rem' }}>Soporte de Sistemas</small>
                                <div className="my-2" style={{ borderTop: '1px dashed #ced4da' }}></div>
                                <span className="fw-bold d-block small">COMPROBANTE DE VENTA</span>
                                <span className="text-secondary small">Folio: #V-{folioSeleccionado}</span>
                            </div>

                            {/* Cuerpo del Desglose de Artículos */}
                            <div className="mb-3">
                                <div className="d-flex justify-content-between fw-bold text-secondary" style={{ fontSize: '0.75rem' }}>
                                    <span>DESCRIPCIÓN</span>
                                    <span>CANT x PRECIO</span>
                                </div>
                                <div className="my-1" style={{ borderTop: '1px dashed #ced4da' }}></div>

                                {/* Mapeo dinámico de los artículos que vienen desde AWS */}
                                {detallesTicket.map((item, i) => (
                                    <div key={i} className="mb-2" style={{ fontSize: '0.75rem', lineHeight: '1.2' }}>
                                        <div className="fw-bold text-dark text-uppercase">{item.nombre_prenda}</div>
                                        <div className="d-flex justify-content-between text-muted ps-2">
                                            <span>{item.cantidad} pza(s) x ${parseFloat(item.precio_unitario).toFixed(2)}</span>
                                            <span className="fw-bold text-dark">
                                                ${(item.cantidad * parseFloat(item.precio_unitario)).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Totales de Operación Desglosados */}
                            <div className="my-2" style={{ borderTop: '1px dashed #ced4da' }}></div>
                            <div style={{ fontSize: '0.75rem', lineHeight: '1.4' }}>
                                
                                {/* 1. Cálculo del precio real original de catálogo (Subtotal) */}
                                <div className="d-flex justify-content-between text-muted">
                                    <span>PRECIO REAL (SUBTOTAL):</span>
                                    <span>
                                        ${detallesTicket.reduce((acc, item) => {
                                            const prodOriginal = productos.find(p => p.id === item.producto_id);
                                            const precioOriginal = prodOriginal ? parseFloat(prodOriginal.precio) : parseFloat(item.precio_unitario);
                                            return acc + (item.cantidad * precioOriginal);
                                        }, 0).toFixed(2)}
                                    </span>
                                </div>

                                {/* 2. Dinero total que se ahorró el cliente (Solo visible si hubo un descuento real) */}
                                {detallesTicket.reduce((acc, item) => {
                                    const prodOriginal = productos.find(p => p.id === item.producto_id);
                                    const precioOriginal = prodOriginal ? parseFloat(prodOriginal.precio) : parseFloat(item.precio_unitario);
                                    return acc + ((precioOriginal - parseFloat(item.precio_unitario)) * item.cantidad);
                                }, 0) > 0 && (
                                    <div className="d-flex justify-content-between text-danger fw-bold">
                                        <span>DESCUENTO APLICADO:</span>
                                        <span>
                                            -${detallesTicket.reduce((acc, item) => {
                                                const prodOriginal = productos.find(p => p.id === item.producto_id);
                                                const precioOriginal = prodOriginal ? parseFloat(prodOriginal.precio) : parseFloat(item.precio_unitario);
                                                return acc + ((precioOriginal - parseFloat(item.precio_unitario)) * item.cantidad);
                                            }, 0).toFixed(2)}
                                        </span>
                                    </div>
                                )}

                                <div className="my-1" style={{ borderTop: '1px dashed #ced4da' }}></div>

                                {/* 3. Total Neto Final de la Transacción */}
                                <div className="d-flex justify-content-between fw-bold mb-3" style={{ fontSize: '0.85rem' }}>
                                    <span>TOTAL COBRADO:</span>
                                    <span className="text-success">
                                        ${detallesTicket.reduce((acc, item) => acc + (item.cantidad * parseFloat(item.precio_unitario)), 0).toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            {/* Pie de Ticket */}
                            <div className="text-center mt-4">
                                <p className="m-0 small fw-bold text-muted" style={{ fontSize: '0.7rem' }}>¡Gracias por tu compra! 👑</p>
                                <small className="text-muted" style={{ fontSize: '0.6rem' }}>SmartBoutique POS v5.0 - Cloud Infrastructure</small>
                                
                                <Button 
                                    variant="dark" 
                                    size="sm" 
                                    className="w-100 mt-3 btn-sm border-0" 
                                    style={{ backgroundColor: '#ad1457', fontSize: '0.75rem' }}
                                    onClick={() => setShowTicketModal(false)}
                                >
                                    Cerrar Ticket
                                </Button>
                            </div>

                        </Modal.Body>
                    </Modal>
                    {/* ==================== MÓDULO DE MOVIMIENTOS DE CAJA COMPLETO ==================== */}
                        {vistaActiva === 'caja' && (
                            <div className="animate__animated animate__fadeIn p-2">
                                <h5 className="fw-bold mb-4 small" style={{ color: '#ad1457' }}>
                                    💵 Panel de Control Financiero y Arqueos de Turno
                                </h5>

                                {/* 🎛️ SECCIÓN DE TRES BOTONES / TARJETAS GRANDES EN EL CENTRO */}
                                <div className="row g-3 justify-content-center text-center mb-5">
                                    
                                    {/* Tarjeta 1: Fondo de Apertura */}
                                    <div className="col-12 col-md-3">
                                        <div className="p-3 shadow-sm rounded-4 border-0 h-100 bg-white d-flex flex-column justify-content-center align-items-center">
                                            <span className="text-muted small fw-bold text-uppercase tracking-wider">Fondo de Apertura</span>
                                            <h2 className="fw-black my-2" style={{ color: '#0288d1' }}>
                                                ${movimientosCajaData[0]?.estado === 'abierta' ? parseFloat(movimientosCajaData[0].monto_inicial).toFixed(2) : '0.00'}
                                            </h2>
                                            <Badge bg={movimientosCajaData[0]?.estado === 'abierta' ? 'success' : 'secondary'} className="px-2 py-1">
                                                {movimientosCajaData[0]?.estado === 'abierta' ? 'Caja Activa' : 'Caja Cerrada'}
                                            </Badge>
                                        </div>
                                    </div>

                                   {/* Tarjeta 2: BOTÓN CENTRAL DINÁMICO (ABRIR / CERRAR) */}
                                    <div className="col-12 col-md-4">
                                        {movimientosCajaData[0]?.estado === 'abierta' ? (
                                            /* SI ESTÁ ABIERTA: Muestra el botón de realizar corte que ya tenías */
                                            <button 
                                                onClick={handleCerrarCaja}
                                                className="w-100 p-4 shadow border-0 rounded-4 text-white btn-danger h-100 d-flex flex-column justify-content-center align-items-center"
                                                style={{ 
                                                    background: 'linear-gradient(135deg, #d32f2f, #c2185b)',
                                                    transition: 'transform 0.2s',
                                                    cursor: 'pointer'
                                                }}
                                                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
                                                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                                            >
                                                <div className="fs-1 mb-1">🔓</div>
                                                <span className="fw-bold text-uppercase tracking-wide small text-white-50">Acción de Arqueo</span>
                                                <h4 className="fw-black m-0 mt-1">Realizar Corte de Caja</h4>
                                                <small className="text-white-50 mt-2">Suma las ventas del día y cierra el turno</small>
                                            </button>
                                        ) : (
                                            /* SI ESTÁ CERRADA: Se convierte en el disparador para abrir un nuevo turno */
                                            <button 
                                                onClick={() => setShowModalAbrir(true)}
                                                className="w-100 p-4 shadow border-0 rounded-4 text-white h-100 d-flex flex-column justify-content-center align-items-center"
                                                style={{ 
                                                    background: 'linear-gradient(135deg, #2e7d32, #1b5e20)',
                                                    transition: 'transform 0.2s',
                                                    cursor: 'pointer'
                                                }}
                                                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
                                                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                                            >
                                                <div className="fs-1 mb-1">💵</div>
                                                <span className="fw-bold text-uppercase tracking-wide small text-white-50">Caja Inactiva</span>
                                                <h4 className="fw-black m-0 mt-1">Abrir Nuevo Turno</h4>
                                                <small className="text-white-50 mt-2">Ingresa el fondo inicial para operar</small>
                                            </button>
                                        )}
                                    </div>

                                    {/* Tarjeta 3: Total Vendido + Historial Imprimible */}
                                    <div className="col-12 col-md-3">
                                        <button 
                                            onClick={() => {
                                                if(movimientosCajaData.length > 0) {
                                                    handleImprimirTicketCorte(movimientosCajaData[0]);
                                                } else {
                                                    alert("No hay ningún corte registrado.");
                                                }
                                            }}
                                            className="w-100 p-3 shadow-sm border-0 rounded-4 bg-white h-100 d-flex flex-column justify-content-center align-items-center"
                                            style={{ transition: 'transform 0.2s' }}
                                            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
                                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                        >
                                            <span className="text-muted small fw-bold text-uppercase tracking-wider">Total Vendido Hoy</span>
                                            <h2 className="fw-black my-2" style={{ color: '#2e7d32' }}>
                                                ${
                                                    movimientosCajaData[0]
                                                    ? (parseFloat(movimientosCajaData[0].monto_final || movimientosCajaData[0].monto_inicial) - parseFloat(movimientosCajaData[0].monto_inicial)).toFixed(2)
                                                    : '0.00'
                                                }
                                            </h2>
                                            <span className="badge bg-dark rounded-pill py-1 px-2 text-uppercase font-monospace small">
                                                📄 Ver Ticket de Corte
                                            </span>
                                        </button>
                                    </div>

                                </div>

                                {/* 📊 TABLA HISTÓRICA */}
                                <div className="bg-white rounded-4 p-3 shadow-sm">
                                    <h6 className="fw-bold text-secondary mb-3 small">📋 Historial General de Movimientos</h6>
                                    <Table responsive hover size="sm" className="small text-center align-middle mb-0 table-borderless">
                                        <thead className="table-light">
                                            <tr>
                                                <th>ID Corte</th>
                                                <th>Operador</th>
                                                <th>F. Apertura</th>
                                                <th>Monto Inicial</th>
                                                <th>F. Cierre</th>
                                                <th>Monto Final</th>
                                                <th>Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {movimientosCajaData.map((caja, i) => (
                                                <tr key={i} className="border-bottom">
                                                    <td className="fw-bold text-secondary">#C-{caja.id}</td>
                                                    <td><Badge bg="dark">ID: {caja.usuario_id}</Badge></td>
                                                    <td className="text-muted">{caja.fecha_apertura ? new Date(caja.fecha_apertura).toLocaleString('es-MX') : '---'}</td>
                                                    <td className="fw-bold text-primary">${parseFloat(caja.monto_inicial).toFixed(2)}</td>
                                                    <td className="text-muted">{caja.fecha_cierre ? new Date(caja.fecha_cierre).toLocaleString('es-MX') : '---'}</td>
                                                    <td className="fw-bold text-success">
                                                        {caja.monto_final ? `$${parseFloat(caja.monto_final).toFixed(2)}` : '---'}
                                                    </td>
                                                    <td>
                                                        <Badge bg={caja.estado === 'abierta' ? 'success' : 'secondary'}>
                                                            {caja.estado.toUpperCase()}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </div>
                            </div>
                        )}
                        {/* ==================== MODAL DE APERTURA DE TURNO NUEVO ==================== */}
                        <Modal show={showModalAbrir} onHide={() => setShowModalAbrir(false)} centered backdrop="static">
                            <Modal.Header closeButton className="border-0 pb-0">
                                <Modal.Title className="fw-bold fs-6" style={{ color: '#ad1457' }}>
                                    🔑 Apertura de Caja - SmartBoutique
                                </Modal.Title>
                            </Modal.Header>
                            <form onSubmit={handleAbrirCajaDefinitivo}>
                                <Modal.Body className="py-3">
                                    <p className="text-muted small">
                                        Para iniciar el turno de ventas, por favor ingresa la cantidad de dinero en efectivo que se dejará en caja como fondo inicial (cambio).
                                    </p>
                                    <div className="form-group">
                                        <label className="small fw-bold text-secondary mb-1">Monto Inicial en Efectivo ($):</label>
                                        <input 
                                            type="number" 
                                            step="0.01"
                                            min="0"
                                            className="form-control form-control-sm text-center fw-bold text-primary fs-5"
                                            placeholder="0.00"
                                            required
                                            value={montoInicialInput}
                                            onChange={(e) => setMontoInicialInput(e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                </Modal.Body>
                                <Modal.Footer className="border-0 pt-0">
                                    <Button variant="secondary" size="sm" onClick={() => setShowModalAbrir(false)}>
                                        Cancelar
                                    </Button>
                                    <Button variant="success" size="sm" type="submit" className="fw-bold">
                                        🚀 Confirmar y Abrir Turno
                                    </Button>
                                </Modal.Footer>
                            </form>
                        </Modal>
                       
                        {vistaActiva === 'devoluciones' && (
                            <div className="animate__animated animate__fadeIn">
                                <h5 className="fw-bold mb-3 small" style={{ color: '#ad1457' }}>↩️ Control de Devoluciones</h5>
                                <Table responsive hover size="sm" className="small text-center align-middle mb-0 table-borderless">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Folio Devolución</th>
                                            <th>Ticket Orig.</th>
                                            <th>Prenda / Artículo</th>
                                            <th>Cant.</th>
                                            <th>Motivo</th>
                                            <th>Total Reembolsado</th>
                                            <th>Método</th>
                                            <th>Autorizó</th>
                                            <th>Fecha y Hora</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {devolucionesData.length === 0 ? (
                                            <tr>
                                                <td colSpan="9" className="text-muted py-3">No hay devoluciones registradas hoy.</td>
                                            </tr>
                                        ) : (
                                            devolucionesData.map((dev, i) => (
                                                <tr key={i} className="border-bottom">
                                                    <td className="fw-bold text-secondary">#DEV-{dev.id}</td>
                                                    <td className="text-muted">#V-{dev.venta_id}</td>
                                                    <td className="text-start">{dev.producto_detalle}</td>
                                                    <td>{dev.cantidad}</td>
                                                    <td className="text-muted text-start" style={{ fontSize: '0.8rem' }}>{dev.motivo_devolucion}</td>
                                                    <td className="fw-bold text-danger">-${parseFloat(dev.monto_reembolsado).toFixed(2)}</td>
                                                    <td>
                                                        <Badge bg={dev.tipo_reembolso === 'Nota de Crédito' ? 'purple' : 'dark'} style={{ backgroundColor: dev.tipo_reembolso === 'Nota de Crédito' ? '#7b1fa2' : '#616161' }}>
                                                            {dev.tipo_reembolso}
                                                        </Badge>
                                                    </td>
                                                    <td><Badge bg="secondary">{dev.operador_name || 'admin'}</Badge></td>
                                                    <td className="text-muted" style={{ fontSize: '0.8rem' }}>
                                                        {dev.fecha_devolucion ? new Date(dev.fecha_devolucion).toLocaleString('es-MX') : '---'}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </Table>
                            </div>
                        )}
                    </div>
                </Col>
            </Row>

            {/* 🛠️ CONSOLA MODAL CON VISTA PREVIA CORTADA EXCLUSIVAMENTE EN EL COMPONENTE */}
            <Modal show={showProdModal} onHide={() => setShowProdModal(false)} centered size="lg">
                <Modal.Header closeButton style={{ borderBottom: '1px solid #f8bbd0' }}>
                    <Modal.Title className="fw-bold" style={{ color: '#ad1457' }}>⚙️ Actualizar Prenda</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ backgroundColor: '#fffdfd' }}>
                    <Form onSubmit={handleSaveEditProduct}>
                        <Row className="g-3 mb-2">
                            <Col md={6}>
                                <Form.Group><Form.Label className="small fw-bold text-muted">Nombre del Producto</Form.Label><Form.Control type="text" value={editProdNombre} onChange={e => setEditProdNombre(e.target.value)} required /></Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group><Form.Label className="small fw-bold text-muted">Precio ($ MXN)</Form.Label><Form.Control type="number" step="0.01" value={editProdPrecio} onChange={e => setEditProdPrecio(e.target.value)} required /></Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group><Form.Label className="small fw-bold text-muted">Stock Físico</Form.Label><Form.Control type="number" value={editProdStock} onChange={e => setEditProdStock(e.target.value)} required /></Form.Group>
                            </Col>
                        </Row>

                        <Row className="g-3 mb-2">
                            <Col md={4}>
                                <Form.Group><Form.Label className="small fw-bold text-muted">Talla Base</Form.Label><Form.Select value={editProdTalla} onChange={e => setEditProdTalla(e.target.value)}><option value="S">S</option><option value="M">M</option><option value="L">L</option></Form.Select></Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group><Form.Label className="small fw-bold text-muted">Color Temático</Form.Label><Form.Control type="text" value={editProdColor} onChange={e => setEditProdColor(e.target.value)} required /></Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group><Form.Label className="small fw-bold text-muted">Categoría en Tienda</Form.Label><Form.Control type="text" value={editProdCategoria} onChange={e => setEditProdCategoria(e.target.value)} required /></Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-2">
                            <Form.Label className="small fw-bold text-muted">Selector de Fotografía (Cambio Automático)</Form.Label>
                            <Form.Control type="file" accept="image/*" onChange={handleFileChange} />
                        </Form.Group>

                        {/* MUESTRA LA CADENA RECORTADA VISUALMENTE EN EL CAMPO DE TEXTO INFORMATIVO */}
                        <Form.Group className="mb-2">
                            <Form.Label className="small fw-bold text-muted">Cadena Hash Binaria (`imagen_url` persistido)</Form.Label>
                            <Form.Control 
                                type="text" 
                                readOnly 
                                disabled
                                value={editProdImagen && editProdImagen.length > 60 ? `${editProdImagen.substring(0, 60)}...` : editProdImagen} 
                            />
                        </Form.Group>

                        {editProdImagen && editProdImagen.trim() !== '' && !editProdImagen.includes('[object Object]') && (
                            <div className="mt-2 text-center bg-light p-2 rounded border">
                                <span className="small text-success d-block mb-1 fw-bold">✓ Vista previa de la prenda a guardar:</span>
                                <img 
                                    src={editProdImagen.startsWith('data:image') || editProdImagen.includes('http') ? editProdImagen : `data:image/jpeg;base64,${editProdImagen}`} 
                                    alt="Vista previa" 
                                    style={{ height: '140px', borderRadius: '8px', objectFit: 'contain', border: '1px solid #f8bbd0' }} 
                                />
                            </div>
                        )}

                        <Form.Group className="mb-2">
                            <Form.Label className="small fw-bold text-muted">Etiquetas (`tags` - Separados por comas)</Form.Label>
                            <Form.Control type="text" value={editProdTags} onChange={e => setEditProdTags(e.target.value)} placeholder="casual, oficina, algodon" />
                        </Form.Group>

                        <Form.Group className="mb-4">
                            <Form.Label className="small fw-bold text-muted">Descripción del Producto</Form.Label><Form.Control as="textarea" rows={2} value={editProdDescripcion} onChange={e => setEditProdDescripcion(e.target.value)} />
                        </Form.Group>

                        <Button type="submit" style={{ backgroundColor: '#ad1457', border: 'none' }} className="w-100 fw-bold py-2 text-white shadow-sm">
                            Aplicar Cambios.
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default AdminDashboard;