import React from 'react';
import { Link } from 'react-router-dom'; // Import Link for internal navigation
import { FaTwitter, FaInstagram, FaLinkedin, FaPhone, FaEnvelope } from 'react-icons/fa'; // Add contact icons
import { useLanguage } from '../contexts/LanguageContext'; // Import useLanguage

const Footer: React.FC = () => {
  const { t } = useLanguage(); // Get t function

  return (
    <footer className="footer" style={{ 
      background: 'transparent',
      backdropFilter: 'none',
      border: 'none',
      boxShadow: 'none',
      marginTop: '40px'
    }}>
      <div className="footer-content" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        gap: '20px',
        background: 'linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.5) 100%)',
        borderRadius: '20px',
        padding: '30px 20px',
        borderTop: '1px solid rgba(20, 184, 166, 0.1)'
      }}>
        <div className="footer-main-sections" style={{
          display: 'flex',
          justifyContent: 'center',
          width: '100%',
          maxWidth: '800px',
          flexWrap: 'nowrap',
          gap: '25px',
          textAlign: 'left',
          paddingBottom: '10px',
          paddingTop: '10px',
          paddingLeft: '100px'
        }}>
          {/* Left Section - Contact Information */}
          <div className="footer-section" style={{ flex: '1 1 200px', minWidth: '150px' }}>
            <h5 style={{ 
              color: '#1E293B', 
              marginBottom: '15px', 
              fontSize: '1rem', 
              fontWeight: '600',
              opacity: 0.9,
              borderBottom: '2px solid rgba(20, 184, 166, 0.3)',
              paddingBottom: '8px',
              display: 'inline-block',
              width: 'auto',
              marginRight: '20px'
            }}>
              {t('footer.contact')}
            </h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaPhone style={{ color: '#14B8A6', fontSize: '0.875rem' }} />
                <a href="tel:+902122223344" style={{ 
                  color: '#475569', 
                  textDecoration: 'none', 
                  fontSize: '0.875rem', 
                  opacity: 0.8,
                  transition: 'color 0.2s ease'
                }}>
                  +90 (532) 426 77 46
                </a>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaEnvelope style={{ color: '#14B8A6', fontSize: '0.875rem' }} />
                <a href="mailto:admin@insanvemekan.com" style={{ 
                  color: '#475569', 
                  textDecoration: 'none', 
                  fontSize: '0.875rem', 
                  opacity: 0.8,
                  transition: 'color 0.2s ease'
                }}>
                  admin@insanvemekan.com
                </a>
              </div>
            </div>
          </div>

          {/* Middle Section - Quick Links */}
          <div className="footer-section" style={{ flex: '1 1 150px', minWidth: '120px' }}>
            <h5 style={{ 
              color: '#1E293B', 
              marginBottom: '15px', 
              fontSize: '1rem', 
              fontWeight: '600',
              opacity: 0.9,
              borderBottom: '2px solid rgba(20, 184, 166, 0.3)',
              paddingBottom: '8px',
              display: 'inline-block',
              width: 'auto',
              marginRight: '20px'
            }}>{t('footer.quickLinks')}</h5>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><Link to="/about" style={{ color: '#475569', textDecoration: 'none', fontSize: '0.875rem', opacity: 0.8, transition: 'color 0.2s ease' }}>{t('footer.aboutUs')}</Link></li>
              <li><Link to="/general-info" style={{ color: '#475569', textDecoration: 'none', fontSize: '0.875rem', opacity: 0.8, transition: 'color 0.2s ease' }}>{t('footer.generalInformation')}</Link></li>
              <li><Link to="/archive" style={{ color: '#475569', textDecoration: 'none', fontSize: '0.875rem', opacity: 0.8, transition: 'color 0.2s ease' }}>{t('footer.archive')}</Link></li>
            </ul>
          </div>

          {/* Right Section - Social Media */}
          <div className="footer-section" style={{ flex: '1 1 150px', minWidth: '140px' }}>
            <h5 style={{ 
              color: '#1E293B', 
              marginBottom: '15px', 
              fontSize: '1rem', 
              fontWeight: '600',
              opacity: 0.9,
              borderBottom: '2px solid rgba(20, 184, 166, 0.3)',
              paddingBottom: '8px',
              display: 'inline-block',
              width: 'auto',
              marginRight: '20px'
            }}>{t('footer.connectWithUs')}</h5>
            <div className="social-links" style={{ display: 'flex', gap: '15px' }}>
              <a href="#" target="_blank" rel="noopener noreferrer" style={{ color: '#475569', fontSize: '1.5rem', opacity: 0.8, transition: 'color 0.2s ease' }} aria-label={t('footer.twitterAria') || 'Twitter'}><FaTwitter /></a>
              <a href="#" target="_blank" rel="noopener noreferrer" style={{ color: '#475569', fontSize: '1.5rem', opacity: 0.8, transition: 'color 0.2s ease' }} aria-label={t('footer.instagramAria') || 'Instagram'}><FaInstagram /></a>
              <a href="#" target="_blank" rel="noopener noreferrer" style={{ color: '#475569', fontSize: '1.5rem', opacity: 0.8, transition: 'color 0.2s ease' }} aria-label={t('footer.linkedinAria') || 'LinkedIn'}><FaLinkedin /></a>
            </div>
          </div>
        </div>
      </div>
      
      <style>
        {`
          .footer-section a:hover {
            color: #14B8A6 !important;
            opacity: 1 !important;
          }
          
          .social-links a:hover {
            color: #14B8A6 !important;
            opacity: 1 !important;
            transform: translateY(-2px);
          }
          
          @media (max-width: 768px) {
            .footer-main-sections {
              flex-direction: column !important;
              text-align: center !important;
              gap: 25px !important;
            }
            
            .footer-section {
              min-width: auto !important;
              flex: none !important;
            }
            
            .social-links {
              justify-content: center !important;
            }
          }
        `}
      </style>
    </footer>
  );
};

export default Footer; 