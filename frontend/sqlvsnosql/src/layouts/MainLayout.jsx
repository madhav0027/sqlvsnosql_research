import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/ComparisonChart';

function MainLayout({ children }) {
  return (
    <div className="app-wrapper">
      <Navbar />
      <main className="main-content">
        {children}
      </main>
      <Footer />
    </div>
  );
}

export default MainLayout;
