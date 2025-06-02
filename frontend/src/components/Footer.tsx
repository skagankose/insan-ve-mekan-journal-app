import React from 'react';
import { Link } from 'react-router-dom'; // Import Link for internal navigation
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa'; // Example social icons
import { useLanguage } from '../contexts/LanguageContext'; // Import useLanguage

const Footer: React.FC = () => {
  const { t, language } = useLanguage(); // Get t function and current language

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
          justifyContent: 'space-around',
          width: '100%',
          maxWidth: '1000px',
          flexWrap: 'wrap',
          gap: '20px',
          textAlign: 'left',
          paddingBottom: '10px',
          paddingTop: '10px'
        }}>
          <div className="footer-section" style={{ flex: '1 1 200px', minWidth: '180px' }}>
            <h5 style={{ 
              color: '#1E293B', 
              marginBottom: '12px', 
              fontSize: '1rem', 
              fontWeight: '600',
              opacity: 0.9
            }}>
              {language === 'tr' ? 'İnsan & Mekan' : 'Human & Space'}
            </h5>
            <p style={{ 
              color: '#475569', 
              fontSize: '0.875rem', 
              lineHeight: '1.5',
              opacity: 0.8
            }}>
              {t('footer.aboutJournalText')}
            </p>
          </div>

          <div className="footer-section" style={{ flex: '1 1 150px', minWidth: '120px' }}>
            <h5 style={{ 
              color: '#1E293B', 
              marginBottom: '12px', 
              fontSize: '1rem', 
              fontWeight: '600',
              opacity: 0.9
            }}>{t('footer.quickLinks')}</h5>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><Link to="/about" style={{ color: '#475569', textDecoration: 'none', fontSize: '0.875rem', opacity: 0.8 }}>{t('footer.aboutUs')}</Link></li>
              <li><Link to="/contact" style={{ color: '#475569', textDecoration: 'none', fontSize: '0.875rem', opacity: 0.8 }}>{t('footer.contact')}</Link></li>
              <li><Link to="/archive" style={{ color: '#475569', textDecoration: 'none', fontSize: '0.875rem', opacity: 0.8 }}>{t('footer.archive')}</Link></li>
              <li><Link to="/submission-guidelines" style={{ color: '#475569', textDecoration: 'none', fontSize: '0.875rem', opacity: 0.8 }}>{t('footer.submissionGuidelines')}</Link></li>
            </ul>
          </div>

          <div className="footer-section" style={{ flex: '1 1 150px', minWidth: '120px' }}>
            <h5 style={{ 
              color: '#1E293B', 
              marginBottom: '12px', 
              fontSize: '1rem', 
              fontWeight: '600',
              opacity: 0.9
            }}>{t('footer.legal')}</h5>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><Link to="/terms-of-service" style={{ color: '#475569', textDecoration: 'none', fontSize: '0.875rem', opacity: 0.8 }}>{t('footer.termsOfService')}</Link></li>
              <li><Link to="/privacy-policy" style={{ color: '#475569', textDecoration: 'none', fontSize: '0.875rem', opacity: 0.8 }}>{t('footer.privacyPolicy')}</Link></li>
              <li><Link to="/copyright" style={{ color: '#475569', textDecoration: 'none', fontSize: '0.875rem', opacity: 0.8 }}>{t('footer.copyrightLink')}</Link></li>
            </ul>
          </div>

          <div className="footer-section" style={{ flex: '1 1 150px', minWidth: '180px' }}>
            <h5 style={{ 
              color: '#1E293B', 
              marginBottom: '12px', 
              fontSize: '1rem', 
              fontWeight: '600',
              opacity: 0.9
            }}>{t('footer.connectWithUs')}</h5>
            <div className="social-links" style={{ display: 'flex', gap: '15px' }}>
              <a href="#" target="_blank" rel="noopener noreferrer" style={{ color: '#475569', fontSize: '1.5rem', opacity: 0.8 }} aria-label={t('footer.facebookAria') || 'Facebook'}><FaFacebook /></a>
              <a href="#" target="_blank" rel="noopener noreferrer" style={{ color: '#475569', fontSize: '1.5rem', opacity: 0.8 }} aria-label={t('footer.twitterAria') || 'Twitter'}><FaTwitter /></a>
              <a href="#" target="_blank" rel="noopener noreferrer" style={{ color: '#475569', fontSize: '1.5rem', opacity: 0.8 }} aria-label={t('footer.instagramAria') || 'Instagram'}><FaInstagram /></a>
              <a href="#" target="_blank" rel="noopener noreferrer" style={{ color: '#475569', fontSize: '1.5rem', opacity: 0.8 }} aria-label={t('footer.linkedinAria') || 'LinkedIn'}><FaLinkedin /></a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 