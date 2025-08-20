import React, { useState } from 'react';
import Home from './components/Home';
import Privacy from './components/Privacy';
import Terms from './components/Terms';
import './App.css';

const App = () => {
  const [currentPage, setCurrentPage] = useState('home');

  const renderPage = () => {
    switch(currentPage) {
      case 'privacy':
        return <Privacy setCurrentPage={setCurrentPage} />;
      case 'terms':
        return <Terms setCurrentPage={setCurrentPage} />;
      default:
        return <Home setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <div className="App">
      {renderPage()}
    </div>
  );
};

export default App;