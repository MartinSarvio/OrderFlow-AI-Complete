/**
 * Card Logo Handler
 * Håndterer visning af kortlogoer og korttype-detektion
 */

const CardLogos = {
    // Korttype mapper
    types: {
        'visa-debit': {
            name: 'Visa Debit',
            logo: 'assets/logos/cards/visa-debit.png',
            fallbackSvg: `<svg width="60" height="20" viewBox="0 0 60 20" xmlns="http://www.w3.org/2000/svg">
                <text x="0" y="15" font-family="Arial" font-weight="bold" font-size="14" fill="#1A1F71">VISA</text>
            </svg>`,
            gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
        },
        'visa-kredit': {
            name: 'Visa Kredit',
            logo: 'assets/logos/cards/visa-kredit.png',
            fallbackSvg: `<svg width="60" height="20" viewBox="0 0 60 20" xmlns="http://www.w3.org/2000/svg">
                <text x="0" y="15" font-family="Arial" font-weight="bold" font-size="14" fill="#1A1F71">VISA</text>
            </svg>`,
            gradient: 'linear-gradient(135deg, #0f3460 0%, #16213e 100%)'
        },
        'mastercard-debit': {
            name: 'Mastercard Debit',
            logo: 'assets/logos/cards/mastercard-debit.png',
            fallbackSvg: `<svg width="60" height="20" viewBox="0 0 60 20" xmlns="http://www.w3.org/2000/svg">
                <circle cx="8" cy="10" r="8" fill="#EB001B"/>
                <circle cx="16" cy="10" r="8" fill="#F79E1B"/>
            </svg>`,
            gradient: 'linear-gradient(135deg, #1a1a2e 0%, #2d2d44 100%)'
        },
        'mastercard-kredit': {
            name: 'Mastercard Kredit',
            logo: 'assets/logos/cards/mastercard-kredit.png',
            fallbackSvg: `<svg width="60" height="20" viewBox="0 0 60 20" xmlns="http://www.w3.org/2000/svg">
                <circle cx="8" cy="10" r="8" fill="#EB001B"/>
                <circle cx="16" cy="10" r="8" fill="#F79E1B"/>
            </svg>`,
            gradient: 'linear-gradient(135deg, #eb001b 0%, #f79e1b 100%)'
        },
        'dankort': {
            name: 'Dankort',
            logo: 'assets/logos/cards/dankort.png',
            fallbackSvg: `<svg width="60" height="20" viewBox="0 0 60 20" xmlns="http://www.w3.org/2000/svg">
                <rect width="60" height="20" rx="2" fill="#ED1C24"/>
                <text x="5" y="14" font-family="Arial" font-weight="bold" font-size="10" fill="white">Dankort</text>
            </svg>`,
            gradient: 'linear-gradient(135deg, #ed1c24 0%, #c41230 100%)'
        },
        'visa-electron': {
            name: 'Visa Electron',
            logo: 'assets/logos/cards/visa-electron.png',
            fallbackSvg: `<svg width="60" height="20" viewBox="0 0 60 20" xmlns="http://www.w3.org/2000/svg">
                <text x="0" y="15" font-family="Arial" font-weight="bold" font-size="14" fill="#1A1F71">VISA</text>
            </svg>`,
            gradient: 'linear-gradient(135deg, #1a365d 0%, #2d3748 100%)'
        },
        'maestro': {
            name: 'Maestro',
            logo: 'assets/logos/cards/maestro.png',
            fallbackSvg: `<svg width="60" height="20" viewBox="0 0 60 20" xmlns="http://www.w3.org/2000/svg">
                <circle cx="8" cy="10" r="8" fill="#0099DF"/>
                <circle cx="16" cy="10" r="8" fill="#ED0006"/>
            </svg>`,
            gradient: 'linear-gradient(135deg, #0099df 0%, #ed0006 100%)'
        }
    },

    /**
     * Detekter korttype baseret på kortnummer
     */
    detectCardType(cardNumber) {
        // Fjern whitespace og special characters
        const cleaned = cardNumber.replace(/[^\d]/g, '');

        // Simpel detektion baseret på første cifre
        if (cleaned.startsWith('4')) {
            return 'visa-debit'; // Default til debit, kan opdateres dynamisk
        } else if (cleaned.startsWith('5')) {
            return 'mastercard-debit';
        } else if (cleaned.startsWith('6')) {
            return 'maestro';
        } else if (cleaned.startsWith('50')) {
            return 'dankort';
        }

        return 'visa-debit'; // Fallback
    },

    /**
     * Opdater kort-visning med logo og type
     */
    updateCardDisplay(cardType, cardNumber, cardHolder, cardExpiry) {
        const typeInfo = this.types[cardType] || this.types['visa-debit'];

        // Opdater logo
        const logoImg = document.getElementById('payment-card-logo');
        if (logoImg) {
            logoImg.src = typeInfo.logo;
            logoImg.alt = typeInfo.name;

            // Hvis PNG ikke findes, brug SVG fallback
            logoImg.onerror = function() {
                const logoContainer = logoImg.parentElement;
                logoContainer.innerHTML = typeInfo.fallbackSvg;
            };
        }

        // Opdater korttype tekst
        const typeText = document.getElementById('payment-card-type');
        if (typeText) {
            typeText.textContent = typeInfo.name;
        }

        // Opdater kortnummer
        const numberElem = document.getElementById('payment-card-number');
        if (numberElem && cardNumber) {
            numberElem.textContent = cardNumber;
        }

        // Opdater kortholder
        const holderElem = document.getElementById('payment-card-holder');
        if (holderElem && cardHolder) {
            holderElem.textContent = cardHolder;
        }

        // Opdater udløbsdato
        const expiryElem = document.getElementById('payment-card-expiry');
        if (expiryElem && cardExpiry) {
            expiryElem.textContent = cardExpiry;
        }

        // Opdater gradient (valgfrit)
        const cardContainer = numberElem?.closest('div[style*="gradient"]');
        if (cardContainer && typeInfo.gradient) {
            const style = cardContainer.getAttribute('style');
            const newStyle = style.replace(/background:linear-gradient[^;]+;/, `background:${typeInfo.gradient};`);
            cardContainer.setAttribute('style', newStyle);
        }
    },

    /**
     * Initialiser kort-visning fra data
     */
    init(cardData) {
        const cardType = cardData.type || this.detectCardType(cardData.number || '');
        this.updateCardDisplay(
            cardType,
            cardData.number || '•••• •••• •••• 4242',
            cardData.holder || 'MARTIN JENSEN',
            cardData.expiry || '12/26'
        );
    }
};

// Auto-init hvis DOM er klar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        // Eksempel: Hent kortdata fra localStorage eller API
        const savedCardData = {
            type: 'visa-debit',
            number: '•••• •••• •••• 4242',
            holder: 'MARTIN JENSEN',
            expiry: '12/26'
        };
        CardLogos.init(savedCardData);
    });
} else {
    // DOM er allerede klar
    const savedCardData = {
        type: 'visa-debit',
        number: '•••• •••• •••• 4242',
        holder: 'MARTIN JENSEN',
        expiry: '12/26'
    };
    CardLogos.init(savedCardData);
}

// Eksporter for brug i andre scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CardLogos;
}
