import React from 'react';
import { Row, Col, Card, Button, Form } from 'react-bootstrap';

const ClienteDashboard = () => {
    return (
        <div>
            <Row className="text-center mb-4">
                <Col>
                    <h2 style={{ color: '#ad1457' }} className="fw-bold">Tu Espacio de Moda ✨</h2>
                    <p className="text-muted">Explora colecciones exclusivas, arma tus outfits favoritos y solicita ayuda en tiempo real.</p>
                </Col>
            </Row>

            <Row className="g-4">
                {/* Recomendador tipo Pinterest */}
                <Col md={8}>
                    <Card className="border-0 shadow-sm p-4" style={{ borderRadius: '15px' }}>
                        <h4 className="fw-bold text-start mb-3" style={{ color: '#c2185b' }}>📌 Inspiración de Outfits (Tendencias)</h4>
                        <Row className="g-3">
                            <Col xs={6} md={4}>
                                <Card className="bg-dark text-white border-0 text-start" style={{ borderRadius: '10px', height: '220px', backgroundImage: 'url("https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400")', backgroundSize: 'cover', backgroundPosition: 'center' }}>
                                    <Card.ImgOverlay className="d-flex flex-column justify-content-end bg-gradient-dark">
                                        <Card.Title className="fw-bold mb-0 small">Estilo Aesthetic Urbano</Card.Title>
                                    </Card.ImgOverlay>
                                </Card>
                            </Col>
                            <Col xs={6} md={4}>
                                <Card className="bg-dark text-white border-0 text-start" style={{ borderRadius: '10px', height: '150px', backgroundImage: 'url("https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400")', backgroundSize: 'cover', backgroundPosition: 'center' }}>
                                    <Card.ImgOverlay className="d-flex flex-column justify-content-end bg-gradient-dark">
                                        <Card.Title className="fw-bold mb-0 small">Casual Chic</Card.Title>
                                    </Card.ImgOverlay>
                                </Card>
                            </Col>
                            <Col xs={6} md={4}>
                                <Card className="bg-dark text-white border-0 text-start" style={{ borderRadius: '10px', height: '220px', backgroundImage: 'url("https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=400")', backgroundSize: 'cover', backgroundPosition: 'center' }}>
                                    <Card.ImgOverlay className="d-flex flex-column justify-content-end bg-gradient-dark">
                                        <Card.Title className="fw-bold mb-0 small">Gala & Noche</Card.Title>
                                    </Card.ImgOverlay>
                                </Card>
                            </Col>
                        </Row>
                    </Card>
                </Col>

                {/* Subir foto para recomendación por Inteligencia Artificial */}
                <Col md={4}>
                    <Card className="border-0 shadow-sm text-center p-4 h-100" style={{ borderRadius: '15px', backgroundColor: '#fff5f7' }}>
                        <div style={{ fontSize: '3rem' }}>📸</div>
                        <h5 className="fw-bold mt-2">Buscar Outfit por Imagen</h5>
                        <p className="text-muted small">Sube la foto de la prenda que viste en internet y nuestro sistema buscará combinaciones en nuestra tienda.</p>
                        <Form.Group className="mb-3">
                            <Form.Control type="file" size="sm" accept="image/*" />
                        </Form.Group>
                        <Button style={{ backgroundColor: '#ff85a2', border: 'none' }} className="w-100 fw-bold">Escanear con IA</Button>
                    </Card>
                </Col>

                {/* Botón de pánico/asistencia en probadores */}
                <Col md={6}>
                    <Card className="border-0 shadow-sm p-4 text-center text-white" style={{ backgroundColor: '#ff5c8a', borderRadius: '15px' }}>
                        <div style={{ fontSize: '2.5rem' }}>🛎️</div>
                        <h4 className="fw-bold">Botón de Asistencia en Probador</h4>
                        <p className="small">¿Te estás probando algo y necesitas otra talla o color? Presiona el botón y un vendedor irá en camino.</p>
                        <Button variant="light" className="fw-bold text-danger w-100 py-2" onClick={() => alert("Asistencia solicitada. Un asesor acudirá a tu probador en breve. 🌸")}>
                            Solicitar Talla / Asistencia
                        </Button>
                    </Card>
                </Col>

                {/* Lista de deseos y catálogo */}
                <Col md={6}>
                    <Card className="border-0 shadow-sm p-4" style={{ borderRadius: '15px' }}>
                        <h5 className="fw-bold text-start mb-3">❤️ Mi Lista de Deseos (Wishlist)</h5>
                        <ul className="text-start list-unstyled">
                            <li className="border-bottom py-2 d-flex justify-content-between align-items-center">
                                <span>👗 Blusa Satinada Rosa (Talla S)</span>
                                <Button size="sm" variant="success">Comprar</Button>
                            </li>
                            <li className="py-2 d-flex justify-content-between align-items-center">
                                <span>🧥 Saco Blazer Beige (Talla M)</span>
                                <Button size="sm" variant="success">Comprar</Button>
                            </li>
                        </ul>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default ClienteDashboard;