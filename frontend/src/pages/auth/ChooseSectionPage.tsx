import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage, LanguageToggle } from '../../i18n/i18n';
import { ThemeToggle } from '../../theme/ThemeContext';
import './AuthPages.css';

const ChooseSectionPage: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();

    const handleChoice = (choice: 'rcc' | 'bein') => {
        if (choice === 'rcc') {
            navigate('/admin/dashboard');
        } else {
            navigate('/admin/secteur/BEIN');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-background">
                <div className="gradient-orb orb-1"></div>
                <div className="gradient-orb orb-2"></div>
                <div className="gradient-orb orb-3"></div>
            </div>

            <div className="choice-card" style={{ position: 'relative', zIndex: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '8px' }}>
                    <LanguageToggle />
                    <ThemeToggle />
                </div>
                <h2 className="choice-title">{t('login.choose_section')}</h2>
                <p className="choice-subtitle">{t('login.choose_subtitle')}</p>
                <div className="choice-buttons">
                    <button className="choice-btn choice-rcc" onClick={() => handleChoice('rcc')}>
                        <span className="choice-icon">📊</span>
                        <span className="choice-label">RCC</span>
                        <span className="choice-desc">{t('login.rcc_desc')}</span>
                    </button>
                    <button className="choice-btn choice-bein" onClick={() => handleChoice('bein')}>
                        <span className="choice-icon">📋</span>
                        <span className="choice-label">BEIN</span>
                        <span className="choice-desc">{t('login.bein_desc')}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChooseSectionPage;
