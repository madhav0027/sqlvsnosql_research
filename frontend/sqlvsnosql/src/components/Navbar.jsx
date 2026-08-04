import React from 'react';

function Navbar() {
  return (
    <header className="navbar">
      <div className="nav-container">
        <div className="nav-logo">EnterpriseHub</div>
        <nav className="nav-links">
          <a href="#home" className="active">Home</a>
          <a href="#dashboard">Dashboard</a>
          <a href="#analytics">Analytics</a>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
