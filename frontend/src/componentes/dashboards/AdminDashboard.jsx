import React, { useState, useEffect } from 'react';
import { Row, Col, Table, Badge, Form, Alert, Button } from 'react-bootstrap';

const AdminDashboard = () => {
    const [recentActivity, setRecentActivity] = useState([]);
    const [listaUsuarios, setListaUsuarios] = useState([]);
    const [productos, setProductos] = useState([]);
    const [alertMessage, setAlertMessage] = useState(null);
    
    const [vistaActiva, setVistaActiva] = useState('bienvenida'); 

    // Formulario de Productos
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

    const usuarioActivo = localStorage.getItem('username') || 'admin_sofi';
    const rolActivo = localStorage.getItem('userRole') || 'admin';

    const cargarDatosAdmin = async () => {
        try {
            // URL Corregida apuntando directamente a /productos
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

    const iniciarEdicion = (usuario) => {
        setEditandoId(usuario.id);
        setEditUsername(usuario.username);
        setEditRol(usuario.rol);
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
        footer: { padding: '15px', marginTop: '20px', borderTop: '1px solid #f8bbd0' }
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
                                <h5 className="fw-bold mb-3 small" style={{ color: '#ad1457' }}>👗 Stock Actual en Nube</h5>
                                <Table responsive hover size="sm" className="small text-center align-middle mb-0 table-borderless">
                                    <thead className="table-light">
                                        <tr><th>ID</th><th>Nombre</th><th>Talla</th><th>Precio</th><th>Stock</th></tr>
                                    </thead>
                                    <tbody>
                                        {productos.map((p, i) => (
                                            <tr key={i} className="border-bottom">
                                                <td>{p.id}</td>
                                                <td className="fw-bold text-start">{p.nombre}</td>
                                                <td><Badge bg="secondary">{p.talla}</Badge></td>
                                                <td className="text-danger fw-bold">${p.precio}</td>
                                                <td><b>{p.stock} pzas</b></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        )}

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
                                                        <><Button variant="outline-secondary" className="btn-sm py-0 me-1" onClick={() => iniciarEdicion(u)}>✏️</Button><Button variant="outline-danger" className="btn-sm py-0" onClick={() => handleDeleteUser(u.id, u.username)}>🗑️</Button></>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        )}

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
        </div>
    );
};

export default AdminDashboard;