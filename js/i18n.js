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
        return key.split('.').reduce((obj, i) => obj[i], this.translations) || key;
    },

    updateContent() {
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (element.tagName === 'INPUT' && element.type === 'placeholder') {
                element.placeholder = this.t(key);
            } else {
                element.textContent = this.t(key);
            }
        });
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