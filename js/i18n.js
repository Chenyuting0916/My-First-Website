// Language handling
const i18n = {
    currentLang: localStorage.getItem('language') || 'zh',
    translations: {},

    async init() {
        try {
            const response = await fetch(`js/translations/${this.currentLang}.json`);
            this.translations = await response.json();
            this.updateContent();
            this.updateImageTitles();
            this.updateSelectLanguage();
        } catch (error) {
            console.error('Failed to load translations:', error);
        }
    },

    async setLanguage(lang) {
        this.currentLang = lang;
        localStorage.setItem('language', lang);
        await this.init();
    },

    t(key) {
        const value = key.split('.').reduce((obj, part) => (obj == null ? undefined : obj[part]), this.translations);
        return typeof value === 'string' ? value : key;
    },

    updateContent() {
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const value = this.t(element.getAttribute('data-i18n'));
            if (typeof value === 'string') element.textContent = value;
        });
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const value = this.t(element.getAttribute('data-i18n-placeholder'));
            if (typeof value === 'string') element.placeholder = value;
        });
        document.querySelectorAll('[data-i18n-content]').forEach(element => {
            const value = this.t(element.getAttribute('data-i18n-content'));
            if (typeof value === 'string') element.setAttribute('content', value);
        });
        document.querySelectorAll('[data-i18n-alt]').forEach(element => {
            const value = this.t(element.getAttribute('data-i18n-alt'));
            if (typeof value === 'string') element.alt = value;
        });
        const htmlLang = { zh: 'zh-Hant', en: 'en', ja: 'ja' }[this.currentLang] || 'zh-Hant';
        document.documentElement.lang = htmlLang;
        document.dispatchEvent(new CustomEvent('i18n:updated'));
    },

    updateImageTitles() {
        // Update lightbox image titles if they exist in translations
        document.querySelectorAll('[data-lightbox]').forEach(element => {
            const titleKey = element.getAttribute('data-title-key');
            if (titleKey) {
                element.setAttribute('data-title', this.t(titleKey));
            }
        });
    },

    updateSelectLanguage() {
        const langSelect = document.getElementById('langSelect');
        if (langSelect) {
            langSelect.value = this.currentLang;
        }
    }
};

// Initialize i18n
document.addEventListener('DOMContentLoaded', () => {
    i18n.init();
    
    // Update URL if needed
    const currentPath = window.location.pathname;
    if (currentPath.includes('_en.html')) {
        const newPath = currentPath.replace('_en.html', '.html');
        history.replaceState(null, '', newPath);
    }
}); 