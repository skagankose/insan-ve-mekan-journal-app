import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <p>© {new Date().getFullYear()} İnsan & Mekan. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer; 