import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { motion } from 'framer-motion';
import { 
  FaQuestionCircle, 
  FaFileAlt, 
  FaUserCheck, 
  FaClipboardCheck,
  FaSearchPlus,
  FaComments,
  FaCreditCard,
  FaListOl,
  FaExclamationTriangle
} from 'react-icons/fa';
import { MdPolicy, MdHelp, MdSecurity } from 'react-icons/md';
import Footer from '../components/Footer';

const GeneralInfoPage: React.FC = () => {
  const { t, language } = useLanguage();

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
      <div className="page-title-section" style={{ display: 'flex', justifyContent: 'center', paddingLeft: '0px' }}>
        <h1>{t('generalInformation')}</h1>
      </div>

      {/* Content Section */}
      <div className="page-content-section" style={{
        paddingBottom: '0px'
      }}>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="content-wrapper"
          style={{ maxWidth: '1000px', margin: '0 auto' }}
        >
          {/* Introduction Section */}
          <motion.div 
            variants={fadeInVariants}
            className="card"
            style={{ marginBottom: '2rem', textAlign: 'center' }}
          >
            <div style={{ marginBottom: '2rem' }}>
              <FaQuestionCircle size={80} color="#14b8a6" style={{ marginBottom: '1rem' }} />
            </div>
            <h2 style={{ 
              fontSize: '2.5rem', 
              marginBottom: '1rem', 
              background: 'linear-gradient(135deg, #1E293B 0%, #475569 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: '800'
            }}>
              {language === 'en' ? 'Platform Guide & Information' : 'Platform Rehberi & Bilgiler'}
            </h2>
            <p style={{ 
              fontSize: '1.2rem', 
              color: '#6b7280', 
              lineHeight: '1.8',
              maxWidth: '800px',
              margin: '0 auto'
            }}>
              {language === 'en' 
                ? 'Everything you need to know about using our academic platform, submission guidelines, and frequently asked questions.'
                : 'Akademik platformumuzu kullanma, gönderim yönergeleri ve sıkça sorulan sorular hakkında bilmeniz gereken her şey.'
              }
            </p>
          </motion.div>

          {/* Submission Guidelines */}
          <motion.div variants={fadeInVariants} className="card">
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
              <FaClipboardCheck size={40} color="#14b8a6" style={{ marginRight: '1rem' }} />
              <h3 style={{ fontSize: '1.8rem', margin: 0, color: '#1E293B' }}>
                {language === 'en' ? 'Submission Guidelines' : 'Gönderim Yönergeleri'}
              </h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
              <div style={{ 
                padding: '1.5rem', 
                borderRadius: '12px', 
                background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.05) 0%, rgba(13, 148, 136, 0.02) 100%)',
                border: '1px solid rgba(20, 184, 166, 0.1)'
              }}>
                <h4 style={{ color: '#0D9488', marginBottom: '1rem' }}>
                  {language === 'en' ? 'Article Requirements' : 'Makale Gereksinimleri'}
                </h4>
                <ul style={{ color: '#374151', margin: 0, lineHeight: '1.8', paddingLeft: '1.5rem' }}>
                  <li>{language === 'en' ? 'Original research in spatial studies, architecture, urban planning, or related fields' : 'Mekansal çalışmalar, mimarlık, şehir planlama veya ilgili alanlarda özgün araştırma'}</li>
                  <li>{language === 'en' ? 'Abstract in both Turkish and English (150-250 words each)' : 'Türkçe ve İngilizce özet (her biri 150-250 kelime)'}</li>
                  <li>{language === 'en' ? 'Keywords: 3-6 relevant terms' : 'Anahtar kelimeler: 3-6 ilgili terim'}</li>
                  <li>{language === 'en' ? 'Proper academic citation format (APA, MLA, or Chicago)' : 'Uygun akademik alıntı formatı (APA, MLA veya Chicago)'}</li>
                  <li>{language === 'en' ? 'Article length: 3,000-8,000 words' : 'Makale uzunluğu: 3.000-8.000 kelime'}</li>
                </ul>
                
                {/* Template Download Section */}
                <div style={{ 
                  marginTop: '1.5rem', 
                  padding: '1rem', 
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(37, 99, 235, 0.04) 100%)', 
                  borderRadius: '8px',
                  border: '1px solid rgba(59, 130, 246, 0.2)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <FaFileAlt size={20} color="#2563EB" style={{ marginRight: '0.5rem' }} />
                    <h5 style={{ margin: 0, color: '#2563EB', fontSize: '1rem' }}>
                      {language === 'en' ? 'Paper Template' : 'Makale Şablonu'}
                    </h5>
                  </div>
                  <p style={{ margin: '0 0 1rem 0', color: '#374151', fontSize: '0.9rem', lineHeight: '1.6' }}>
                    {language === 'en' 
                      ? 'Download our official paper template to ensure proper formatting and structure for your submission.'
                      : 'Gönderiminizin doğru biçimlendirme ve yapısını sağlamak için resmi makale şablonumuzu indirin.'
                    }
                  </p>
                  <a 
                    href="/jhs_template.docx" 
                    download="JHS_Paper_Template.docx"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '0.5rem 1rem',
                      background: '#2563EB',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '6px',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      transition: 'background-color 0.3s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#1D4ED8'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#2563EB'}
                  >
                    <FaFileAlt size={16} style={{ marginRight: '0.5rem' }} />
                    {language === 'en' ? 'Download Template' : 'Şablonu İndir'}
                  </a>
                </div>
              </div>
              <div style={{ 
                padding: '1.5rem', 
                borderRadius: '12px', 
                background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.05) 0%, rgba(13, 148, 136, 0.02) 100%)',
                border: '1px solid rgba(20, 184, 166, 0.1)'
              }}>
                <h4 style={{ color: '#0D9488', marginBottom: '1rem' }}>
                  {language === 'en' ? 'Review Process' : 'Değerlendirme Süreci'}
                </h4>
                <ul style={{ color: '#374151', margin: 0, lineHeight: '1.8', paddingLeft: '1.5rem' }}>
                  <li>{language === 'en' ? 'Initial editorial review (1-2 weeks)' : 'İlk editöryal değerlendirme (1-2 hafta)'}</li>
                  <li>{language === 'en' ? 'Double-blind peer review by 2-3 experts (4-6 weeks)' : '2-3 uzman tarafından çift-kör hakemlik (4-6 hafta)'}</li>
                  <li>{language === 'en' ? 'Author revision period (2-4 weeks)' : 'Yazar düzeltme süresi (2-4 hafta)'}</li>
                  <li>{language === 'en' ? 'Final editorial decision and publication' : 'Son editöryal karar ve yayım'}</li>
                  <li>{language === 'en' ? 'Digital publication in our archive' : 'Arşivimizde dijital yayım'}</li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Payment Information Section */}
          <motion.div variants={fadeInVariants} className="card">
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
              <FaCreditCard size={40} color="#14b8a6" style={{ marginRight: '1rem' }} />
              <h3 style={{ fontSize: '1.8rem', margin: 0, color: '#1E293B' }}>
                {language === 'en' ? 'Processing Fee Information' : 'İşleme Ücreti Bilgileri'}
              </h3>
            </div>
            
            {/* Submission Process Steps */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                <FaListOl size={24} color="#14b8a6" style={{ marginRight: '0.75rem' }} />
                <h4 style={{ fontSize: '1.3rem', margin: 0, color: '#1E293B' }}>
                  {language === 'en' ? 'Submission Process' : 'Gönderim Süreci'}
                </h4>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                {[
                  {
                    step: '1',
                    title: language === 'en' ? 'Submit Paper' : 'Makale Gönder',
                    description: language === 'en' ? 'Upload your research paper' : 'Araştırma makalenizi yükleyin'
                  },
                  {
                    step: '2',
                    title: language === 'en' ? 'Payment' : 'Ödeme',
                    description: language === 'en' ? 'Complete payment with token' : 'Token ile ödemeyi tamamlayın'
                  },
                  {
                    step: '3',
                    title: language === 'en' ? 'Review' : 'İnceleme',
                    description: language === 'en' ? 'Peer review process' : 'Hakemlik değerlendirme süreci'
                  },
                  {
                    step: '4',
                    title: language === 'en' ? 'Publish' : 'Yayınla',
                    description: language === 'en' ? 'Article publication' : 'Makale yayımı'
                  }
                ].map((processStep, index) => (
                  <div key={index} style={{ 
                    padding: '1rem', 
                    textAlign: 'center',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.08) 0%, rgba(13, 148, 136, 0.04) 100%)',
                    border: '1px solid rgba(20, 184, 166, 0.15)'
                  }}>
                    <div style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '50%', 
                      background: '#14b8a6', 
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 0.75rem auto',
                      fontSize: '1.1rem',
                      fontWeight: 'bold'
                    }}>
                      {processStep.step}
                    </div>
                    <h5 style={{ margin: '0 0 0.5rem 0', color: '#1E293B', fontSize: '1rem' }}>
                      {processStep.title}
                    </h5>
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '0.85rem' }}>
                      {processStep.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
              <div style={{ 
                padding: '1.5rem', 
                borderRadius: '12px', 
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(220, 38, 38, 0.02) 100%)',
                border: '1px solid rgba(239, 68, 68, 0.15)'
              }}>
                <h4 style={{ color: '#DC2626', marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
                  <FaCreditCard size={20} style={{ marginRight: '0.5rem' }} />
                  {language === 'en' ? 'Bank Transfer Information' : 'Banka Havale Bilgileri'}
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                  <div>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#6b7280' }}>
                      {language === 'en' ? 'Bank Name' : 'Banka Adı'}
                    </p>
                    <p style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#1E293B', fontWeight: '600' }}>
                      {language === 'en' ? 'Example Bank' : 'Örnek Banka'}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#6b7280' }}>
                      {language === 'en' ? 'Account Holder' : 'Hesap Sahibi'}
                    </p>
                    <p style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#1E293B', fontWeight: '600' }}>
                      {language === 'en' ? 'İnsan Mekan Journal' : 'İnsan Mekan Dergisi'}
                    </p>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#6b7280' }}>
                      {language === 'en' ? 'IBAN Number' : 'IBAN Numarası'}
                    </p>
                    <p style={{ 
                      margin: '0 0 1rem 0', 
                      fontSize: '1.1rem', 
                      color: '#1E293B', 
                      fontWeight: '700',
                      fontFamily: 'monospace',
                      padding: '0.75rem',
                      background: '#F3F4F6',
                      borderRadius: '6px',
                      border: '1px solid #E5E7EB'
                    }}>
                      TR12 3456 7890 1234 5678 9012 34
                    </p>
                  </div>
                </div>
              </div>
              
              <div style={{ 
                padding: '1.5rem', 
                borderRadius: '12px', 
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.05) 100%)',
                border: '1px solid rgba(245, 158, 11, 0.3)'
              }}>
                <h4 style={{ color: '#D97706', marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
                  <FaExclamationTriangle size={20} style={{ marginRight: '0.5rem' }} />
                  {language === 'en' ? 'Important Payment Instructions' : 'Önemli Ödeme Talimatları'}
                </h4>
                <ul style={{ color: '#374151', margin: 0, lineHeight: '1.8', paddingLeft: '1.5rem' }}>
                  <li style={{ marginBottom: '0.5rem' }}>
                    <strong>{language === 'en' ? 'Include Your Unique Token:' : 'Makalenize Özel Token\'ınızı Dahil Edin:'}</strong>
                    {' ' + (language === 'en' 
                      ? 'You must include your unique submission token in the payment description/reference field.' 
                      : 'Ödeme yaparken açıklama alanında makalenize özel token bilgisini yazmalısınız.')}
                  </li>
                  <li style={{ marginBottom: '0.5rem' }}>
                    <strong>{language === 'en' ? 'Find Your Token:' : 'Token\'ınızı Bulun:'}</strong>
                    {' ' + (language === 'en' 
                      ? 'Your unique token will be provided after submitting your paper through the platform.' 
                      : 'Makalenize özel token bilgisi, platform üzerinden makalenizi oluşturduktan sonra sağlanacaktır.')}
                  </li>
                  <li style={{ marginBottom: '0.5rem' }}>
                    <strong>{language === 'en' ? 'Payment Verification:' : 'Ödeme Doğrulaması:'}</strong>
                    {' ' + (language === 'en' 
                      ? 'Without the correct token, we cannot link your payment to your submission.' 
                      : 'Doğru token belirtilmeden ödemenizi gönderiminizle eşleştiremeyiz.')}
                  </li>
                  <li>
                    <strong>{language === 'en' ? 'Processing Time:' : 'İşlem Süresi:'}</strong>
                    {' ' + (language === 'en' 
                      ? 'Payment verification typically takes 1-2 business days.' 
                      : 'Ödemenin doğrulanması genellikle 1-2 iş günü sürer.')}
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* User Roles */}
          <motion.div variants={fadeInVariants} className="card">
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
              <FaComments size={40} color="#14b8a6" style={{ marginRight: '1rem' }} />
              <h3 style={{ fontSize: '1.8rem', margin: 0, color: '#1E293B' }}>
                {language === 'en' ? 'User Roles & Responsibilities' : 'Kullanıcı Rolleri & Sorumlulukları'}
              </h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
              {[
                {
                  role: language === 'en' ? 'Author' : 'Yazar',
                  icon: <FaFileAlt size={24} color="#14b8a6" />,
                  responsibilities: language === 'en' 
                    ? ['Submit original research', 'Respond to reviewer comments', 'Provide revisions when requested']
                    : ['Özgün araştırma gönder', 'Hakem yorumlarına yanıt ver', 'İstendiğinde düzeltme sağla']
                },
                {
                  role: language === 'en' ? 'Reviewer' : 'Hakem',
                  icon: <FaSearchPlus size={24} color="#14b8a6" />,
                  responsibilities: language === 'en' 
                    ? ['Evaluate submitted papers', 'Provide constructive feedback', 'Maintain confidentiality']
                    : ['Gönderilen makaleleri değerlendir', 'Yapıcı geri bildirim sağla', 'Gizliliği koru']
                },
                {
                  role: language === 'en' ? 'Editor' : 'Editör',
                  icon: <FaUserCheck size={24} color="#14b8a6" />,
                  responsibilities: language === 'en' 
                    ? ['Oversee review process', 'Make publication decisions', 'Ensure academic standards']
                    : ['İnceleme sürecini denetle', 'Yayım kararları ver', 'Akademik standartları sağla']
                }
              ].map((userRole, index) => (
                <div key={index} style={{ 
                  padding: '1.25rem', 
                  border: '1px solid #E5E7EB', 
                  borderRadius: '8px',
                  background: '#FAFAFA'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                    {userRole.icon}
                    <h4 style={{ margin: '0 0 0 0.75rem', color: '#1E293B', fontSize: '1.1rem' }}>
                      {userRole.role}
                    </h4>
                  </div>
                  <ul style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem', lineHeight: '1.5', paddingLeft: '1.25rem' }}>
                    {userRole.responsibilities.map((responsibility, i) => (
                      <li key={i} style={{ marginBottom: '0.25rem' }}>{responsibility}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </motion.div>

          {/* FAQ Section */}
          <motion.div variants={fadeInVariants} className="card">
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
              <MdHelp size={40} color="#14b8a6" style={{ marginRight: '1rem' }} />
              <h3 style={{ fontSize: '1.8rem', margin: 0, color: '#1E293B' }}>
                {language === 'en' ? 'Frequently Asked Questions' : 'Sıkça Sorulan Sorular'}
              </h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
              {[
                {
                  question: language === 'en' ? 'How long does the review process take?' : 'İnceleme süreci ne kadar sürer?',
                  answer: language === 'en' 
                    ? 'The typical review process takes 6-10 weeks from submission to decision, including peer review and editorial evaluation.'
                    : 'Tipik inceleme süreci, gönderimden karara kadar hakemlik ve editöryal değerlendirme dahil 6-10 hafta sürer.'
                },
                {
                  question: language === 'en' ? 'Can I submit papers in languages other than Turkish or English?' : 'Türkçe veya İngilizce dışında dillerde makale gönderebilir miyim?',
                  answer: language === 'en' 
                    ? 'Currently, we accept submissions in Turkish and English only. However, abstracts must be provided in both languages.'
                    : 'Şu anda sadece Türkçe ve İngilizce gönderimler kabul ediyoruz. Ancak özetlerin her iki dilde de sağlanması gerekir.'
                },
                {
                  question: language === 'en' ? 'How can I track my submission status?' : 'Gönderim durumumu nasıl takip edebilirim?',
                  answer: language === 'en' 
                    ? 'After logging in, you can view all your submissions and their current status in your profile dashboard.'
                    : 'Giriş yaptıktan sonra, profil panonuzda tüm gönderimlerinizi ve mevcut durumlarını görüntüleyebilirsiniz.'
                }
              ].map((faq, index) => (
                <div key={index} style={{ 
                  padding: '1.25rem', 
                  border: '1px solid #E5E7EB', 
                  borderRadius: '8px',
                  background: '#FAFAFA'
                }}>
                  <h4 style={{ margin: '0 0 0.75rem 0', color: '#1E293B', fontSize: '1rem' }}>
                    {faq.question}
                  </h4>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '0.95rem', lineHeight: '1.6' }}>
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Policies Section */}
          <motion.div variants={fadeInVariants} className="card">
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
              <MdPolicy size={40} color="#14b8a6" style={{ marginRight: '1rem' }} />
              <h3 style={{ fontSize: '1.8rem', margin: 0, color: '#1E293B' }}>
                {language === 'en' ? 'Policies & Ethics' : 'Politikalar & Etik'}
              </h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
              <div style={{ 
                padding: '1.5rem', 
                borderRadius: '12px', 
                background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.05) 0%, rgba(13, 148, 136, 0.02) 100%)',
                border: '1px solid rgba(20, 184, 166, 0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                  <MdSecurity size={24} color="#14b8a6" style={{ marginRight: '0.75rem' }} />
                  <h4 style={{ color: '#0D9488', margin: 0 }}>
                    {language === 'en' ? 'Academic Integrity' : 'Akademik Dürüstlük'}
                  </h4>
                </div>
                <p style={{ color: '#374151', margin: 0, lineHeight: '1.6', fontSize: '0.95rem' }}>
                  {language === 'en' 
                    ? 'We strictly enforce academic integrity standards. All submissions must be original work with proper citations and no plagiarism.'
                    : 'Akademik dürüstlük standartlarını sıkı bir şekilde uygularız. Tüm gönderimler uygun alıntılı ve intihal olmayan özgün çalışmalar olmalıdır.'
                  }
                </p>
              </div>
              <div style={{ 
                padding: '1.5rem', 
                borderRadius: '12px', 
                background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.05) 0%, rgba(13, 148, 136, 0.02) 100%)',
                border: '1px solid rgba(20, 184, 166, 0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                  <FaUserCheck size={24} color="#14b8a6" style={{ marginRight: '0.75rem' }} />
                  <h4 style={{ color: '#0D9488', margin: 0 }}>
                    {language === 'en' ? 'Privacy Policy' : 'Gizlilik Politikası'}
                  </h4>
                </div>
                <p style={{ color: '#374151', margin: 0, lineHeight: '1.6', fontSize: '0.95rem' }}>
                  {language === 'en' 
                    ? 'We protect user privacy and maintain confidentiality throughout the review process while ensuring transparency in publication.'
                    : 'Yayımda şeffaflığı sağlarken inceleme süreci boyunca kullanıcı gizliliğini korur ve gizliliği muhafaza ederiz.'
                  }
                </p>
              </div>
            </div>
          </motion.div>

          {/* Contact Section */}
          <motion.div variants={fadeInVariants} className="card" style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: '#1E293B' }}>
              {language === 'en' ? 'Need Help?' : 'Yardıma İhtiyacınız Var?'}
            </h3>
            <p style={{ fontSize: '1.1rem', color: '#6b7280', marginBottom: '2rem', lineHeight: '1.8' }}>
              {language === 'en' 
                ? 'If you have questions not covered in this guide, our support team is here to help. We aim to provide assistance within 24-48 hours.'
                : 'Bu rehberde ele alınmayan sorularınız varsa, destek ekibimiz size yardımcı olmak için burada. 24-48 saat içinde yardım sağlamayı hedefliyoruz.'
              }
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a 
                href="/about" 
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
                {language === 'en' ? 'Learn More' : 'Daha Fazla Öğren'}
              </a>
            </div>
          </motion.div>
        </motion.div>
        
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

export default GeneralInfoPage; 