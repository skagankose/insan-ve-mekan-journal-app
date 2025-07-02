import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { FaUniversity, FaGlobeAmericas, FaCogs, FaEnvelope, FaPhone } from 'react-icons/fa';
import { MdScience } from 'react-icons/md';
import Footer from '../components/Footer';

const AboutPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { isAuthenticated } = useAuth();

  const fadeInVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  return (
    <>
      {/* Title Section */}
      <div className="page-title-section" style={{ marginLeft: '60px' }}>
        <h1>{t('about')}</h1>
      </div>

      {/* Content Section */}
      <div className="page-content-section" style={{
        paddingBottom: '0px'
      }}>
        <div style={{
          margin: '0 auto',
          marginLeft: '60px'
        }}>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="content-wrapper"
            style={{ 
              maxWidth: 'none', 
              width: '100%',
              margin: '0'
            }}
          >
            {/* Hero Section */}
            <motion.div 
              variants={fadeInVariants}
              className="card"
              style={{ marginBottom: '2rem', textAlign: 'center' }}
            >
              <div style={{ marginBottom: '2rem' }}>
                <FaUniversity size={80} color="#14b8a6" style={{ marginBottom: '1rem' }} />
              </div>
              <h2 style={{ 
                fontSize: '2.5rem', 
                marginBottom: '1rem', 
                background: 'linear-gradient(135deg, #1E293B 0%, #475569 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: '800'
              }}>
                {language === 'en' ? 'About Human & Space' : 'İnsan & Mekan Hakkında'}
              </h2>
              <p style={{ 
                fontSize: '1.2rem', 
                color: '#6b7280', 
                lineHeight: '1.8',
                maxWidth: '800px',
                margin: '0 auto'
              }}>
                {language === 'en' 
                  ? 'A premier academic platform dedicated to advancing research in human-environment interactions, spatial studies, and interdisciplinary scholarship that bridges the gap between theory and practice.'
                  : 'İnsan-çevre etkileşimleri, mekansal çalışmalar ve teori ile pratik arasında köprü kuran disiplinlerarası akademik araştırmaları geliştirmeye adanmış önde gelen bir akademik platform.'
                }
              </p>
            </motion.div>

            {/* Contact Section */}
            <motion.div variants={fadeInVariants} className="card">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.05) 0%, rgba(13, 148, 136, 0.02) 100%)',
                  border: '1px solid rgba(20, 184, 166, 0.1)'
                }}>
                  <FaEnvelope size={24} color="#14b8a6" style={{ marginRight: '1rem' }} />
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#1E293B', fontSize: '1.1rem' }}>
                      {language === 'en' ? 'Email Address' : 'E-posta Adresi'}
                    </h4>
                    <a 
                      href="mailto:admin@insanvemekan.com" 
                      style={{ 
                        color: '#0D9488', 
                        textDecoration: 'none', 
                        fontSize: '1rem',
                        fontWeight: '500',
                        transition: 'color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#14B8A6';
                        e.currentTarget.style.textDecoration = 'underline';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#0D9488';
                        e.currentTarget.style.textDecoration = 'none';
                      }}
                    >
                      admin@insanvemekan.com
                    </a>
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.05) 0%, rgba(13, 148, 136, 0.02) 100%)',
                  border: '1px solid rgba(20, 184, 166, 0.1)'
                }}>
                  <FaPhone size={24} color="#14b8a6" style={{ marginRight: '1rem' }} />
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#1E293B', fontSize: '1.1rem' }}>
                      {language === 'en' ? 'Phone Number' : 'Telefon Numarası'}
                    </h4>
                    <a 
                      href="tel:+902125551234" 
                      style={{ 
                        color: '#0D9488', 
                        textDecoration: 'none', 
                        fontSize: '1rem',
                        fontWeight: '500',
                        transition: 'color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#14B8A6';
                        e.currentTarget.style.textDecoration = 'underline';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#0D9488';
                        e.currentTarget.style.textDecoration = 'none';
                      }}
                    >
                      +90 (532) 426 77 46
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Mission Section */}
            <motion.div variants={fadeInVariants} className="card">
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                <MdScience size={40} color="#14b8a6" style={{ marginRight: '1rem' }} />
                <h3 style={{ fontSize: '1.8rem', margin: 0, color: '#1E293B' }}>
                  {language === 'en' ? 'Our Mission' : 'Misyonumuz'}
                </h3>
              </div>
              <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: '#374151', marginBottom: '1.5rem' }}>
                {language === 'en' 
                  ? 'To provide a comprehensive digital platform for researchers, scholars, and academics to publish, share, and collaborate on groundbreaking research in spatial studies, urban planning, architecture, geography, and related interdisciplinary fields.'
                  : 'Araştırmacılar, akademisyenler ve bilim insanları için mekansal çalışmalar, şehir planlama, mimarlık, coğrafya ve ilgili disiplinlerarası alanlarda çığır açan araştırmalar yayımlamak, paylaşmak ve işbirliği yapmak için kapsamlı bir dijital platform sağlamak.'
                }
              </p>
            </motion.div>

            {/* Values Section */}
            <motion.div variants={fadeInVariants} className="card">
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                <FaGlobeAmericas size={40} color="#14b8a6" style={{ marginRight: '1rem' }} />
                <h3 style={{ fontSize: '1.8rem', margin: 0, color: '#1E293B' }}>
                  {language === 'en' ? 'Our Values' : 'Değerlerimiz'}
                </h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                <div style={{ 
                  padding: '1.5rem', 
                  borderRadius: '12px', 
                  background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.05) 0%, rgba(13, 148, 136, 0.02) 100%)',
                  border: '1px solid rgba(20, 184, 166, 0.1)'
                }}>
                  <h4 style={{ color: '#0D9488', marginBottom: '1rem' }}>
                    {language === 'en' ? 'Open Access' : 'Açık Erişim'}
                  </h4>
                  <p style={{ color: '#374151', margin: 0, lineHeight: '1.6' }}>
                    {language === 'en' 
                      ? 'Democratizing access to scholarly research and ensuring knowledge reaches all corners of the global academic community.'
                      : 'Akademik araştırmalara erişimi demokratikleştirmek ve bilginin küresel akademik topluluğun her köşesine ulaşmasını sağlamak.'
                    }
                  </p>
                </div>
                <div style={{ 
                  padding: '1.5rem', 
                  borderRadius: '12px', 
                  background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.05) 0%, rgba(13, 148, 136, 0.02) 100%)',
                  border: '1px solid rgba(20, 184, 166, 0.1)'
                }}>
                  <h4 style={{ color: '#0D9488', marginBottom: '1rem' }}>
                    {language === 'en' ? 'Innovation' : 'İnovasyon'}
                  </h4>
                  <p style={{ color: '#374151', margin: 0, lineHeight: '1.6' }}>
                    {language === 'en' 
                      ? 'Embracing cutting-edge technologies and methodologies to advance scholarly communication and research dissemination.'
                      : 'Akademik iletişimi ve araştırma yayımını geliştirmek için son teknoloji ve metodolojileri benimser.'
                    }
                  </p>
                </div>
                <div style={{ 
                  padding: '1.5rem', 
                  borderRadius: '12px', 
                  background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.05) 0%, rgba(13, 148, 136, 0.02) 100%)',
                  border: '1px solid rgba(20, 184, 166, 0.1)'
                }}>
                  <h4 style={{ color: '#0D9488', marginBottom: '1rem' }}>
                    {language === 'en' ? 'Collaboration' : 'İşbirliği'}
                  </h4>
                  <p style={{ color: '#374151', margin: 0, lineHeight: '1.6' }}>
                    {language === 'en' 
                      ? 'Fostering interdisciplinary collaboration and cross-cultural exchange to address complex spatial and social challenges.'
                      : 'Karmaşık mekansal ve sosyal zorlukları ele almak için disiplinlerarası işbirliği ve kültürlerarası değişimi teşvik etmek.'
                    }
                  </p>
                </div>
                <div style={{ 
                  padding: '1.5rem', 
                  borderRadius: '12px', 
                  background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.05) 0%, rgba(13, 148, 136, 0.02) 100%)',
                  border: '1px solid rgba(20, 184, 166, 0.1)'
                }}>
                  <h4 style={{ color: '#0D9488', marginBottom: '1rem' }}>
                    {language === 'en' ? 'Academic Excellence' : 'Akademik Mükemmellik'}
                  </h4>
                  <p style={{ color: '#374151', margin: 0, lineHeight: '1.6' }}>
                    {language === 'en' 
                      ? 'Maintaining the highest standards of academic rigor, peer review, and scholarly integrity in all published research.'
                      : 'Yayınlanan tüm araştırmalarda en yüksek akademik titizlik, hakemlik ve bilimsel dürüstlük standartlarını korumak.'
                    }
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Platform Features */}
            <motion.div variants={fadeInVariants} className="card">
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                <FaCogs size={40} color="#14b8a6" style={{ marginRight: '1rem' }} />
                <h3 style={{ fontSize: '1.8rem', margin: 0, color: '#1E293B' }}>
                  {language === 'en' ? 'Platform Features' : 'Platform Özellikleri'}
                </h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                {[
                  {
                    title: language === 'en' ? 'Peer Review System' : 'Hakem Değerlendirme Sistemi',
                    description: language === 'en' 
                      ? 'Rigorous peer review process ensuring academic quality and integrity.'
                      : 'Akademik kalite ve bütünlüğü sağlayan titiz hakem değerlendirme süreci.'
                  },
                  {
                    title: language === 'en' ? 'Multilingual Support' : 'Çok Dilli Destek',
                    description: language === 'en' 
                      ? 'Supporting both Turkish and English to serve a diverse academic community.'
                      : 'Çeşitli akademik topluluğa hizmet etmek için Türkçe ve İngilizce desteği.'
                  },
                  {
                    title: language === 'en' ? 'Digital Archive' : 'Dijital Arşiv',
                    description: language === 'en' 
                      ? 'Comprehensive digital repository for easy access and long-term preservation.'
                      : 'Kolay erişim ve uzun vadeli koruma için kapsamlı dijital depo.'
                  }
                ].map((feature, index) => (
                  <div key={index} style={{ 
                    padding: '1.25rem', 
                    border: '1px solid #E5E7EB', 
                    borderRadius: '8px',
                    background: '#FAFAFA'
                  }}>
                    <h4 style={{ margin: '0 0 0.75rem 0', color: '#1E293B', fontSize: '1.1rem' }}>
                      {feature.title}
                    </h4>
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '0.95rem', lineHeight: '1.5' }}>
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Contact Section */}
            <motion.div variants={fadeInVariants} className="card" style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: '#1E293B' }}>
                {language === 'en' ? 'Join Our Community' : 'Topluluğumuza Katılın'}
              </h3>
              <p style={{ fontSize: '1.1rem', color: '#6b7280', marginBottom: '2rem', lineHeight: '1.8' }}>
                {language === 'en' 
                  ? 'Whether you are a researcher, academic, or practitioner, we invite you to be part of our growing community of scholars dedicated to advancing knowledge in spatial studies and human-environment interactions.'
                  : 'Araştırmacı, akademisyen veya uygulayıcı olun, mekansal çalışmalar ve insan-çevre etkileşimleri alanında bilgiyi geliştirmeye adanmış büyüyen akademisyen topluluğumuzun bir parçası olmanız için sizi davet ediyoruz.'
                }
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                {!isAuthenticated ? (
                  <a 
                    href="/register" 
                    style={{ 
                      textDecoration: 'none',
                      background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
                      color: 'white',
                      padding: '12px 24px',
                      borderRadius: '10px',
                      fontSize: '16px',
                      fontWeight: '600',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(20, 184, 166, 0.3)',
                      transition: 'all 0.3s ease',
                      border: 'none'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(20, 184, 166, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(20, 184, 166, 0.3)';
                    }}
                  >
                    {language === 'en' ? 'Join as Researcher' : 'Araştırmacı Olarak Katıl'}
                  </a>
                ) : (
                  <a 
                    href="/archive" 
                    style={{ 
                      textDecoration: 'none',
                      background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
                      color: 'white',
                      padding: '12px 24px',
                      borderRadius: '10px',
                      fontSize: '16px',
                      fontWeight: '600',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(20, 184, 166, 0.3)',
                      transition: 'all 0.3s ease',
                      border: 'none'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(20, 184, 166, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(20, 184, 166, 0.3)';
                    }}
                  >
                    {language === 'en' ? 'Explore Publications' : 'Yayınları Keşfet'}
                  </a>
                )}
              </div>
            </motion.div>
          </motion.div>
        </div>
        
        {/* Footer */}
        <div style={{ marginTop: '16px', marginBottom: '0px' }}>
          <div className="transparent-footer">
            <Footer />
          </div>
        </div>
      </div>
      
      {/* CSS for transparent footer */}
      <style>{`
        .transparent-footer .footer-content {
          background: transparent !important;
          border-top: none !important;
        }
      `}</style>
    </>
  );
};

export default AboutPage; 