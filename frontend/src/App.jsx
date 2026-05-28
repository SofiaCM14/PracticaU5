import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Login';
import Home from './Home';
import 'bootstrap/dist/css/bootstrap.min.css';
import './dashboard-responsive.css';

function App() {
  return (
    <Router>
      <div className="App bg-light" style={{ minHeight: '100vh' }}>
        <Routes>
          {/* Por ahora, la ruta raíz nos manda directo al Login */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/home" element={<Home />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;