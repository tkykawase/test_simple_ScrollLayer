// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home2 } from './pages/home2';

export const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home2 />} />
      </Routes>
    </Router>
  );
};
