import React, { useState, useEffect } from 'react';
import { Row, Col, Table, Badge, Form, Alert, Button, Card, Modal } from 'react-bootstrap';

const AdminDashboard = () => {
    const [recentActivity, setRecentActivity] = useState([]);
    const [listaUsuarios, setListaUsuarios] = useState([]);
    const [productos, setProductos] = useState([]);
    const [alertMessage, setAlertMessage] = useState(null);
    
    // Control de lienzo dinámico central
    const [vistaActiva, setVistaActiva] = useState('bienvenida'); 

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
        } catch (error) {
            console.error("Error de conectividad AWS RDS:", error);
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
            const response = await fetch(`http://34.219.103.28:3000/api/productos/usuarios/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({ username: editUsername, rol: editRol })
            });
            if (response.ok) {
                setAlertMessage('¡Usuario actualizado correctamente! 📝');
                setEditandoId(null); 
                cargarDatosAdmin(); 
            }
        } catch (error) { console.error(error); }
    };

    const handleDeleteUser = async (id, username) => {
        if (window.confirm(`¿Estás segura de eliminar al usuario "${username}"?`)) {
            try {
                const response = await fetch(`http://34.219.103.28:3000/api/productos/usuarios/${id}`, {
                    method: 'DELETE',
                    headers: getAuthHeaders()
                });
                if (response.ok) {
                    setAlertMessage(`El usuario "${username}" ha sido removido.`);
                    cargarDatosAdmin(); 
                }
            } catch (error) { console.error(error); }
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
            <header style={styles.headerSection}>
                <Row className="text-center align-items-center m-0">
                    <Col className="p-0">
                        <h2 className="fw-bold m-0 text-white" style={{ fontSize: '1.7rem' }}>
                            Bienvenida a tu panel de Gerencia y administración, {usuarioActivo} 👑
                        </h2>
                    </Col>
                </Row>
            </header>

            {alertMessage && <Alert variant="success" onClose={() => setAlertMessage(null)} dismissible className="m-0 rounded-0 py-2">{alertMessage}</Alert>}

            <Row className="g-0 m-0">
                <Col md={3} className="p-0">
                    <div style={styles.sidebar} className="d-flex flex-column justify-content-between">
                        <div>
                            <h6 className="fw-bold uppercase mb-3 text-center pb-2" style={{ color: '#ad1457', borderBottom: '1px solid #f8bbd0', fontSize: '0.85rem' }}>📋 MENÚ OPERATIVO</h6>
                            <button style={{ ...styles.menuBtn, backgroundColor: vistaActiva === 'inventario' ? '#ad1457' : '#fff', color: vistaActiva === 'inventario' ? '#fff' : '#ad1457' }} onClick={() => { setVistaActiva('inventario'); cargarDatosAdmin(); }}>
                                👗 Prendas
                            </button>
                            <button style={{ ...styles.menuBtn, backgroundColor: vistaActiva === 'mercancia' ? '#ad1457' : '#fff', color: vistaActiva === 'mercancia' ? '#fff' : '#ad1457' }} onClick={() => { setVistaActiva('mercancia'); cargarDatosAdmin(); }}>
                                🚛 Recepción de Mercancía
                            </button>
                            <button style={{ ...styles.menuBtn, backgroundColor: vistaActiva === 'usuarios' ? '#ad1457' : '#fff', color: vistaActiva === 'usuarios' ? '#fff' : '#ad1457' }} onClick={() => { setVistaActiva('usuarios'); cargarDatosAdmin(); }}>
                                👥 Empleados
                            </button>
                            <button style={{ ...styles.menuBtn, backgroundColor: vistaActiva === 'auditoria' ? '#ad1457' : '#fff', color: vistaActiva === 'auditoria' ? '#fff' : '#ad1457' }} onClick={() => { setVistaActiva('auditoria'); cargarDatosAdmin(); }}>
                                📡 Movimientos
                            </button>
                            <button style={{ ...styles.menuBtn, backgroundColor: vistaActiva === 'auditoria' ? '#ad1457' : '#fff', color: vistaActiva === 'auditoria' ? '#fff' : '#ad1457' }} onClick={() => { setVistaActiva('auditoria'); cargarDatosAdmin(); }}>
                                📡 Devoluciones
                            </button>
                        </div>
                        <div className="text-center pt-2 border-top small fw-bold" style={{ color: '#ad1457', borderColor: '#f8bbd0', fontSize: '0.8rem' }}>🟢 AWS RDS Connected 🖥️</div>
                    </div>
                </Col>

                <Col md={9} className="p-0">
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
                                    <h3 className="fw-bold mb-1" style={{ color: '#ad1457' }}>🚛 Entrada de Nueva Mercancía</h3>
                                    <span className="text-muted small">Inyección directa de prendas hacia el clúster transaccional AWS RDS</span>
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
                                        Guardar Nueva Mercancía en AWS RDS 🚀
                                    </Button>
                                </Form>
                            </div>
                        )}

                        {/* 👥 CONTROL DE USUARIOS */}
                        {vistaActiva === 'usuarios' && (
                            <div>
                                <h5 className="fw-bold mb-3 small" style={{ color: '#ad1457' }}>👥 Personal de la Boutique</h5>
                                <Form onSubmit={handleAddUser} className="row g-2 mb-4 p-2 bg-light rounded align-items-end m-0">
                                    <Col md={5}><Form.Control type="text" placeholder="Username" value={nuevoUsername} onChange={e => setNuevoUsername(e.target.value)} size="sm" required /></Col>
                                    <Col md={4}>
                                        <Form.Select value={nuevoRol} onChange={e => setNuevoRol(e.target.value)} size="sm">
                                            <option value="admin">Administrador</option><option value="encargado">Encargado</option><option value="vendedor">Vendedor</option><option value="cliente">Cliente</option>
                                        </Form.Select>
                                    </Col>
                                    <Col md={3}><Button type="submit" variant="success" className="w-100 btn-sm" style={{ height: '31px' }}>➕ Añadir</Button></Col>
                                </Form>

                                <Table responsive hover size="sm" className="small text-center align-middle mb-0 table-borderless">
                                    <thead className="table-light"><tr><th>ID</th><th>Usuario</th><th>Rol</th><th>Acciones</th></tr></thead>
                                    <tbody>
                                        {listaUsuarios.map((u, i) => (
                                            <tr key={i} className="border-bottom">
                                                <td>{u.id}</td>
                                                <td className="text-start">
                                                    {editandoId === u.id ? <Form.Control type="text" value={editUsername} onChange={e => setEditUsername(e.target.value)} size="sm" /> : <span className="fw-bold">{u.username}</span>}
                                                </td>
                                                <td>
                                                    {editandoId === u.id ? (
                                                        <Form.Select value={editRol} onChange={e => setEditRol(e.target.value)} size="sm">
                                                            <option value="admin">admin</option><option value="encargado">encargado</option><option value="vendedor">vendedor</option><option value="cliente">cliente</option>
                                                        </Form.Select>
                                                    ) : <Badge bg="danger">{u.rol}</Badge>}
                                                </td>
                                                <td>
                                                    {editandoId === u.id ? (
                                                        <><Button variant="primary" className="btn-sm py-0 me-1" onClick={() => handleSaveEditUser(u.id)}>Guardar</Button><Button variant="dark" className="btn-sm py-0" onClick={() => setEditandoId(null)}>X</Button></>
                                                    ) : (
                                                        <><Button variant="outline-secondary" className="btn-sm py-0 me-1" onClick={() => setEditandoId(u.id)}>✏️</Button><Button variant="outline-danger" className="btn-sm py-0" onClick={() => handleDeleteUser(u.id, u.username)}>🗑️</Button></>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        )}

                        {/* 📡 AUDITORÍA */}
                        {vistaActiva === 'auditoria' && (
                            <div>
                                <h5 className="fw-bold mb-3 small" style={{ color: '#ad1457' }}>📡 Bitácora Transaccional</h5>
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
                                                
                                                {/* 🟢 2. PINTAMOS LA FECHA FORMATEADA */}
                                                <td className="text-muted small">
                                                    {log.fecha ? new Date(log.fecha).toLocaleString('es-MX') : '---'}
                                                </td>
                                            </tr>
                                        ))}
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
                    <Modal.Title className="fw-bold" style={{ color: '#ad1457' }}>⚙️ Modificación Completa de Prenda</Modal.Title>
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
                            Aplicar Cambios en AWS RDS 🚀
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default AdminDashboard;