// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home2 } from './pages/Home2';
import { ProjectPage } from './pages/project';
import { AboutPage } from './pages/about';

export const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home2 />} />
        <Route path="/project/:id" element={<ProjectPage />} />
        <Route path="/about" element={<AboutPage />} />
      </Routes>
    </Router>
  );
};
