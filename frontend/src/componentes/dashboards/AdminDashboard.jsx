import React, { useState, useEffect } from 'react';
import { Row, Col, Table, Badge, Form, Alert, Button, Card, Modal } from 'react-bootstrap';

const AdminDashboard = () => {
    const [recentActivity, setRecentActivity] = useState([]);
    const [listaUsuarios, setListaUsuarios] = useState([]);
    const [productos, setProductos] = useState([]);
    const [alertMessage, setAlertMessage] = useState(null);
    
    // Control de lienzo dinámico central
    const [vistaActiva, setVistaActiva] = useState('bienvenida'); 

    // Formulario de Productos (Inserción rápida)
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
    const cargarDatosAdmin = async () => {
        try {
            const resAudit = await fetch('http://34.219.103.28:3000/productos/auditoria');
            if (resAudit.ok) setRecentActivity(await resAudit.json());

            const resProd = await fetch('http://34.219.103.28:3000/productos');
            if (resProd.ok) setProductos(await resProd.json());

            const resUser = await fetch('http://34.219.103.28:3000/productos/usuarios');
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

    const handleAddProduct = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://34.219.103.28:3000/productos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, precio: parseFloat(precio), stock: parseInt(stock), talla, usuario: usuarioActivo, rol: rolActivo })
            });
            if (response.ok) {
                setAlertMessage(`¡Prenda "${nombre}" inyectada con éxito! ✨`);
                setNombre(''); setPrecio(''); setStock('');
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
                // Forzamos explícitamente a que guarde el resultado como string plano
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
            
            // Verificación final de seguridad: Si la imagen por error se volvió a hacer objeto, la limpiamos a string vacio
            let imagenAEnviar = editProdImagen;
            if (typeof imagenAEnviar === 'object' || imagenAEnviar.includes('[object Object]')) {
                imagenAEnviar = '';
            }

            const response = await fetch(`http://34.219.103.28:3000/productos/${selectedProd.id}`, {
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
            const response = await fetch('http://34.219.103.28:3000/productos/usuarios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
            const response = await fetch(`http://34.219.103.28:3000/productos/usuarios/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
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
                const response = await fetch(`http://34.219.103.28:3000/productos/usuarios/${id}`, {
                    method: 'DELETE'
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
                                👗 Inventario Completo
                            </button>
                            <button style={{ ...styles.menuBtn, backgroundColor: vistaActiva === 'mercancia' ? '#ad1457' : '#fff', color: vistaActiva === 'mercancia' ? '#fff' : '#ad1457' }} onClick={() => { setVistaActiva('mercancia'); cargarDatosAdmin(); }}>
                                🚛 Recibir Mercancía
                            </button>
                            <button style={{ ...styles.menuBtn, backgroundColor: vistaActiva === 'usuarios' ? '#ad1457' : '#fff', color: vistaActiva === 'usuarios' ? '#fff' : '#ad1457' }} onClick={() => { setVistaActiva('usuarios'); cargarDatosAdmin(); }}>
                                👥 Control de Usuarios
                            </button>
                            <button style={{ ...styles.menuBtn, backgroundColor: vistaActiva === 'auditoria' ? '#ad1457' : '#fff', color: vistaActiva === 'auditoria' ? '#fff' : '#ad1457' }} onClick={() => { setVistaActiva('auditoria'); cargarDatosAdmin(); }}>
                                📡 Tabla de Auditoría
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
                                <h5 className="fw-bold mb-4" style={{ color: '#ad1457' }}>👗 Catálogo de Tendencias en Nube (Cards con Persistencia RDS)</h5>
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
                                                    <Card.Img 
                                                        variant="top" 
                                                        src={imagenSrc} 
                                                        style={{ height: '180px', objectFit: 'cover' }} 
                                                        onError={(e) => { 
                                                            e.target.src = fallbackImg; 
                                                        }}
                                                    />
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
                                                                ⚙️ Ajustar Prenda & Almacén
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

                        {/* 🚛 RECIBIR MERCANCÍA */}
                        {vistaActiva === 'mercancia' && (
                            <div style={{ maxWidth: '440px' }} className="mx-auto py-1">
                                <h5 className="fw-bold mb-3 text-center" style={{ color: '#ad1457' }}>Formulario Entrada de Mercancía</h5>
                                <Form onSubmit={handleAddProduct}>
                                    <Form.Group className="mb-2">
                                        <Form.Label className="small mb-1">Nombre</Form.Label>
                                        <Form.Control type="text" value={nombre} onChange={e => setNombre(e.target.value)} required size="sm" />
                                    </Form.Group>
                                    <Row className="g-2">
                                        <Col><Form.Group className="mb-2"><Form.Label className="small mb-1">Precio</Form.Label><Form.Control type="number" step="0.01" value={precio} onChange={e => setPrecio(e.target.value)} required size="sm" /></Form.Group></Col>
                                        <Col><Form.Group className="mb-2"><Form.Label className="small mb-1">Cantidad</Form.Label><Form.Control type="number" value={stock} onChange={e => setStock(e.target.value)} required size="sm" /></Form.Group></Col>
                                    </Row>
                                    <Form.Group className="mb-3">
                                        <Form.Label className="small mb-1">Talla</Form.Label>
                                        <Form.Select value={talla} onChange={e => setTalla(e.target.value)} size="sm">
                                            <option value="S">S</option><option value="M">M</option><option value="L">L</option>
                                        </Form.Select>
                                    </Form.Group>
                                    <Button type="submit" style={{ backgroundColor: '#ad1457', border: 'none' }} className="w-100 fw-bold py-2 text-white">Guardar Producto</Button>
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
                                    <thead className="table-light"><tr><th>Operador</th><th>Rol</th><th>Acción</th><th>Detalle</th></tr></thead>
                                    <tbody>
                                        {recentActivity.map((log, i) => (
                                            <tr key={i} className="border-bottom"><td>{log.usuario}</td><td><Badge bg="danger">{log.rol}</Badge></td><td>{log.accion}</td><td className="text-muted text-start">{log.detalle}</td></tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        )}
                    </div>
                </Col>
            </Row>

            {/* 🛠️ CONSOLA MODAL CON COMPROBACIÓN ANTE OBJETOS */}
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

                        {/* 📸 CARGADOR AUTOMÁTICO DE ARCHIVOS A BASE64 */}
                        <Form.Group className="mb-2">
                            <Form.Label className="small fw-bold text-muted">Seleccionar Foto de la Prenda (Automático a Base64)</Form.Label>
                            <Form.Control 
                                type="file" 
                                accept="image/*" 
                                onChange={handleFileChange} 
                            />
                            {/* Evita renderizar textos corruptos u objetos rotos dentro del modal */}
                            {editProdImagen && editProdImagen.trim() !== '' && !editProdImagen.includes('[object Object]') && (
                                <div className="mt-2 text-center bg-light p-2 rounded border">
                                    <span className="small text-success d-block mb-1 fw-bold">✓ Vista previa de la prenda a guardar:</span>
                                    <img 
                                        src={editProdImagen.startsWith('data:image') || editProdImagen.includes('http') ? editProdImagen : `data:image/jpeg;base64,${editProdImagen}`} 
                                        alt="Vista previa" 
                                        style={{ height: '90px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #f8bbd0' }} 
                                    />
                                </div>
                            )}
                        </Form.Group>

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