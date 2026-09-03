'use client';

import { publicService } from '@/services/publicService';
import { useEffect, useState } from 'react';
import { Modal, Spinner } from 'react-bootstrap';
import { useIntl } from 'react-intl';
import './LanguageModal.scss';

const DUMMY_LANGUAGES = [
    { id: 1, lang_short: 'aa', lang_long: 'Afar' },
    { id: 2, lang_short: 'ab', lang_long: 'Abkhazian' },
    { id: 3, lang_short: 'ae', lang_long: 'Avestan' },
    { id: 4, lang_short: 'af', lang_long: 'Afrikaans' },
    { id: 5, lang_short: 'ak', lang_long: 'Akan' },
    { id: 116, lang_short: 'nl', lang_long: 'Dutch' },
    { id: 38, lang_short: 'en', lang_long: 'English' },
    { id: 33, lang_short: 'de', lang_long: 'German' },
    { id: 48, lang_short: 'fr', lang_long: 'French' },
    { id: 40, lang_short: 'es', lang_long: 'Spanish' },
    { id: 82, lang_short: 'it', lang_long: 'Italian' },
    { id: 110, lang_short: 'pt', lang_long: 'Portuguese' },
    { id: 120, lang_short: 'ru', lang_long: 'Russian' },
    { id: 130, lang_short: 'zh', lang_long: 'Chinese' },
    { id: 140, lang_short: 'ja', lang_long: 'Japanese' },
];

const LanguageModal = ({ show, onHide, onAddLanguage, excludeLanguages = [] }) => {
    const intl = useIntl();
    const t = (id, values) => intl.formatMessage({ id }, values);
    const [availableLanguages, setAvailableLanguages] = useState([]);
    const [fetchLoading, setFetchLoading] = useState(false);
    const [selectedLang, setSelectedLang] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch languages when modal is opened (caches in sessionStorage)
    useEffect(() => {
        if (show) {
            try {
                const cachedLanguages = sessionStorage.getItem('pawpoint_languages');
                if (cachedLanguages) {
                    const parsed = JSON.parse(cachedLanguages);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setAvailableLanguages(parsed);
                        return;
                    }
                }
            } catch (storageErr) {
                console.warn('Failed to read from sessionStorage:', storageErr);
            }

            setFetchLoading(true);
            publicService
                .languages()
                .then((res) => {
                    let langsToSet = DUMMY_LANGUAGES;
                    if (res && res.status && Array.isArray(res.data)) {
                        langsToSet = res.data;
                    } else if (Array.isArray(res)) {
                        langsToSet = res;
                    } else if (res && Array.isArray(res.data?.data)) {
                        langsToSet = res.data.data;
                    }

                    setAvailableLanguages(langsToSet);

                    try {
                        sessionStorage.setItem('pawpoint_languages', JSON.stringify(langsToSet));
                    } catch (storageErr) {
                        console.warn('Failed to write to sessionStorage:', storageErr);
                    }
                })
                .catch((err) => {
                    console.error('Error fetching languages:', err);
                    setAvailableLanguages(DUMMY_LANGUAGES);
                })
                .finally(() => {
                    setFetchLoading(false);
                });
        }
    }, [show]);

    const handleClose = () => {
        setSelectedLang(null);
        setSearchQuery('');
        onHide();
    };

    const handleSubmit = () => {
        if (!selectedLang) return;
        onAddLanguage(selectedLang);
        handleClose();
    };

    const filteredLanguages = availableLanguages.filter(
        (lang) =>
            !excludeLanguages.includes(lang.lang_long) &&
            lang.lang_long.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    return (
        <Modal show={show} onHide={handleClose} centered className="add-language-modal">
            <Modal.Header closeButton>
                <Modal.Title>{t('language.title')}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="search-wrapper mb-3">
                    <input
                        type="text"
                        className="form-control language-search-input"
                        placeholder={t('language.search')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {fetchLoading ? (
                    <div className="py-4 text-center">
                        <Spinner animation="border" variant="success" />
                        <p className="text-muted mt-2">{t('common.loading')}</p>
                    </div>
                ) : (
                    <div className="languages-scroll-container">
                        {filteredLanguages.length > 0 ? (
                            <ul className="languages-list list-unstyled m-0 p-0">
                                {filteredLanguages.map((lang) => (
                                    <li
                                        key={lang.id}
                                        className={`language-item d-flex align-items-center justify-content-between mb-1 rounded p-2 ${selectedLang?.id === lang.id ? 'active' : ''}`}
                                        onClick={() => setSelectedLang(lang)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <span className="lang-name">{lang.lang_long}</span>
                                        <span className="lang-code text-muted text-uppercase">
                                            {lang.lang_short}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-muted py-4 text-center">{t('language.noResults')}</div>
                        )}
                    </div>
                )}
            </Modal.Body>
            <Modal.Footer>
                <button
                    className="btn btn-secondary border-0 px-4 py-2"
                    style={{
                        borderRadius: '8px',
                        backgroundColor: '#e2e8f0',
                        color: '#475569',
                    }}
                    onClick={handleClose}
                >
                    {t('common.cancel')}
                </button>
                <button
                    className="btn btn-primary border-0 px-4 py-2"
                    style={{
                        borderRadius: '8px',
                        backgroundColor: '#005c5c',
                        color: '#fff',
                    }}
                    disabled={!selectedLang}
                    onClick={handleSubmit}
                >
                    {t('language.save')}
                </button>
            </Modal.Footer>
        </Modal>
    );
};

export default LanguageModal;
