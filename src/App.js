import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Buy from './components/Buy';
import Home from './components/Home';
import Privacy from './components/Privacy';
import Refund from './components/Refund';
import Support from './components/Support';
import Terms from './components/Terms';
import './App.css';

const App = () => {
  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/buy" element={<Buy />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/refund" element={<Refund />} />
          <Route path="/support" element={<Support />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;
