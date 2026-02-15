/**
 * OrderFlow Notification System
 * Håndterer blå prik-notifikationer i sidebar menu
 */

const NotificationSystem = {
    // Notification storage
    notifications: new Map(),

    // CSS klasse for notifikation
    notificationClass: 'nav-notification',

    /**
     * Initialiser notifikationssystemet
     */
    init() {
        // Indlæs gemte notifikationer fra localStorage
        this.loadNotifications();

        // Anvend notifikationer på menu
        this.applyNotifications();

        console.log('Notification system initialized');
    },

    /**
     * Tilføj notifikation til et menu-element
     * @param {string} path - Path til elementet (fx "integrationer.bogholderi.e-conomic")
     * @param {object} options - Valgfri indstillinger (title, message, timestamp, dismissType, dismissValue)
     */
    async add(path, options = {}) {
        // Hent globale indstillinger
        const settings = this.getSettings();

        const notification = {
            path: path,
            title: options.title || 'Ny opdatering',
            message: options.message || '',
            timestamp: options.timestamp || Date.now(),
            read: false,
            dismissType: options.dismissType || settings.defaultDismissType || 'click', // 'click', 'minutes', 'hours', 'days'
            dismissValue: options.dismissValue || settings.defaultDismissValue || 1,
            expiresAt: null
        };

        // Beregn udløbstidspunkt baseret på dismissType
        if (notification.dismissType !== 'click') {
            const multiplier = {
                'minutes': 60 * 1000,
                'hours': 60 * 60 * 1000,
                'days': 24 * 60 * 60 * 1000
            };
            notification.expiresAt = Date.now() + (notification.dismissValue * multiplier[notification.dismissType]);
        }

        this.notifications.set(path, notification);

        // Save to Supabase if available
        if (typeof SupabaseDB !== 'undefined' && typeof currentUser !== 'undefined' && currentUser) {
            try {
                await SupabaseDB.addNotification(currentUser.id, path, {
                    title: notification.title,
                    message: notification.message,
                    expires_at: notification.expiresAt ? new Date(notification.expiresAt).toISOString() : null
                });
                console.log(`✅ Notification saved to Supabase: ${path}`);
            } catch (err) {
                console.error('❌ Error saving notification to Supabase:', err);
            }
        }

        this.saveNotifications(); // Also save to localStorage as backup
        this.applyNotifications();

        console.log(`Notification added: ${path}`, notification);
    },

    /**
     * Fjern notifikation
     * @param {string} path - Path til elementet
     */
    remove(path) {
        this.notifications.delete(path);
        this.saveNotifications();
        this.applyNotifications();

        console.log(`Notification removed: ${path}`);
    },

    /**
     * Marker notifikation som læst
     * @param {string} path - Path til elementet
     */
    markAsRead(path) {
        const notification = this.notifications.get(path);
        if (notification) {
            notification.read = true;
            this.saveNotifications();
            this.applyNotifications();
        }
    },

    /**
     * Fjern alle notifikationer under en path
     * @param {string} basePath - Base path (fx "integrationer.bogholderi")
     */
    async clearPath(basePath) {
        const toRemove = [];
        this.notifications.forEach((notification, path) => {
            if (path.startsWith(basePath)) {
                toRemove.push(path);
            }
        });

        toRemove.forEach(path => this.notifications.delete(path));

        // Clear from Supabase if available
        if (typeof SupabaseDB !== 'undefined' && typeof currentUser !== 'undefined' && currentUser) {
            try {
                await SupabaseDB.clearNotificationPath(currentUser.id, basePath);
                console.log(`✅ Notifications cleared from Supabase: ${basePath}`);
            } catch (err) {
                console.error('❌ Error clearing notifications from Supabase:', err);
            }
        }
        this.saveNotifications();
        this.applyNotifications();

        console.log(`Cleared notifications for: ${basePath}`);
    },

    /**
     * Anvend notifikationer på menu-elementer
     */
    applyNotifications() {
        // Ryd udløbne notifikationer først
        this.cleanupExpired();

        // Valider data-afhængige notifikationer
        // Fjern "kunder" notifikationer hvis ingen kunder eksisterer
        if (typeof restaurants !== 'undefined' && restaurants.length === 0) {
            this.notifications.delete('kunder');
            this.notifications.delete('alle-kunder');
        }

        // Fjern stale "kunder" notifikationer (ældre end 1 time) - disse er sandsynligvis fra demo/test
        const kundeNotif = this.notifications.get('kunder');
        if (kundeNotif && kundeNotif.timestamp < Date.now() - 60 * 60 * 1000) {
            this.notifications.delete('kunder');
            this.saveNotifications();
            console.log('Removed stale kunder notification');
        }

        // Fjern alle eksisterende notifikations-badges
        document.querySelectorAll('.nav-notification-badge').forEach(badge => badge.remove());

        // Tilføj notifikations-badges baseret på paths
        this.notifications.forEach((notification, path) => {
            if (notification.read) return; // Skip læste notifikationer

            const parts = path.split('.');

            // Tilføj badge til hvert niveau i hierarkiet
            for (let i = 0; i < parts.length; i++) {
                const currentPath = parts.slice(0, i + 1).join('.');
                this.addBadgeToElement(currentPath, parts[i], notification);
            }
        });

        if (typeof renderHeaderNotifications === 'function') {
            renderHeaderNotifications();
        }
    },

    /**
     * Ryd udløbne notifikationer
     */
    cleanupExpired() {
        const now = Date.now();
        const toRemove = [];

        this.notifications.forEach((notification, path) => {
            if (notification.expiresAt && notification.expiresAt < now) {
                toRemove.push(path);
            }
        });

        if (toRemove.length > 0) {
            toRemove.forEach(path => this.notifications.delete(path));
            this.saveNotifications();
            console.log(`Removed ${toRemove.length} expired notifications`);
        }
    },

    /**
     * Tilføj badge til et specifikt menu-element
     * @param {string} fullPath - Fuld path
     * @param {string} elementId - Element ID eller tekst
     * @param {object} notification - Notifikations-objektet
     */
    addBadgeToElement(fullPath, elementId, notification) {
        let element = null;

        // Find element baseret på path-struktur
        const parts = fullPath.split('.');

        if (parts.length === 1) {
            // Top-level (fx "integrationer")
            element = document.querySelector(`#nav-${elementId} .nav-dropdown-toggle`);
            if (!element) {
                element = document.querySelector(`[onclick*="showPage('${elementId}')"]`);
            }
        } else if (parts.length === 2) {
            // Andet niveau (fx "integrationer.bogholderi")
            element = document.querySelector(`#nav-${parts[0]} [onclick*="showPage('${elementId}')"]`);
        } else if (parts.length === 3) {
            // Tredje niveau (fx integration item i bogholderi)
            element = document.querySelector(`[data-integration="${elementId}"]`);
        }

        if (element && !element.querySelector('.nav-notification-badge')) {
            const badge = document.createElement('span');
            badge.className = 'nav-notification-badge';
            badge.textContent = 'Ny';
            badge.setAttribute('data-path', fullPath);
            badge.setAttribute('title', 'Ny opdatering');

            // Tilføj klik-handler hvis dismiss type er 'click'
            if (notification && notification.dismissType === 'click') {
                badge.style.cursor = 'pointer';
                badge.addEventListener('click', (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    this.remove(fullPath);
                });

                // Tilføj også klik på parent element
                element.addEventListener('click', () => {
                    this.remove(fullPath);
                }, { once: true });
            }

            // Indsæt badge i elementet
            if (element.classList.contains('nav-dropdown-toggle') || element.classList.contains('nav-btn')) {
                // For navigation buttons - tilføj efter tekst
                const span = element.querySelector('span');
                if (span) {
                    span.appendChild(badge);
                }
            } else if (element.classList.contains('nav-dropdown-item')) {
                // For dropdown items - tilføj efter tekst
                element.appendChild(badge);
            } else {
                // Fallback for andre elementer
                element.appendChild(badge);
            }
        }
    },

    /**
     * Gem notifikationer til localStorage
     */
    saveNotifications() {
        const data = Array.from(this.notifications.entries());
        localStorage.setItem('orderflow_notifications', JSON.stringify(data));
    },

    /**
     * Indlæs notifikationer fra localStorage
     */
    loadNotifications() {
        const saved = localStorage.getItem('orderflow_notifications');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.notifications = new Map(data);
            } catch (e) {
                console.error('Failed to load notifications:', e);
            }
        }
    },

    /**
     * Hent antal ulæste notifikationer for en path
     * @param {string} basePath - Base path
     * @returns {number} Antal ulæste
     */
    getUnreadCount(basePath) {
        let count = 0;
        this.notifications.forEach((notification, path) => {
            if (path.startsWith(basePath) && !notification.read) {
                count++;
            }
        });
        return count;
    },

    /**
     * Hent alle notifikationer for en path
     * @param {string} basePath - Base path
     * @returns {Array} Array af notifikationer
     */
    getNotifications(basePath) {
        const results = [];
        this.notifications.forEach((notification, path) => {
            if (path.startsWith(basePath)) {
                results.push({ ...notification, path });
            }
        });
        return results.sort((a, b) => b.timestamp - a.timestamp);
    },

    /**
     * Hent indstillinger
     * @returns {object} Indstillinger
     */
    getSettings() {
        const saved = localStorage.getItem('orderflow_notification_settings');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Failed to load notification settings:', e);
            }
        }
        return {
            defaultDismissType: 'click',
            defaultDismissValue: 1
        };
    },

    /**
     * Gem indstillinger
     * @param {object} settings - Indstillinger
     */
    saveSettings(settings) {
        localStorage.setItem('orderflow_notification_settings', JSON.stringify(settings));
        console.log('Notification settings saved:', settings);
    }
};

// Auto-initialiser når DOM er klar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        NotificationSystem.init();
        if (typeof renderHeaderNotifications === 'function') {
            renderHeaderNotifications();
        }

        // Demo: Tilføj eksempel notifikationer (kan fjernes i produktion)
        // addDemoNotifications();  // ← DEAKTIVERET: Demo data fjernet i produktion

        // Auto-cleanup hvert minut
        setInterval(() => {
            NotificationSystem.cleanupExpired();
            NotificationSystem.applyNotifications();
        }, 60000); // 60 sekunder
    });
} else {
    NotificationSystem.init();
    if (typeof renderHeaderNotifications === 'function') {
        renderHeaderNotifications();
    }

    // Demo: Tilføj eksempel notifikationer (kan fjernes i produktion)
    // addDemoNotifications();  // ← DEAKTIVERET: Demo data fjernet i produktion

    // Auto-cleanup hvert minut
    setInterval(() => {
        NotificationSystem.cleanupExpired();
        NotificationSystem.applyNotifications();
    }, 60000); // 60 sekunder
}

// Eksporter til global scope
window.NotificationSystem = NotificationSystem;

// Demo funktion - DEAKTIVERET i produktion
/* COMMENTED OUT - Demo data removed for production
function addDemoNotifications() {
    // Kun tilføj demo notifikationer hvis der ikke allerede er nogen
    if (NotificationSystem.notifications.size === 0) {
        // Eksempel: Ny integration i bogholderi
        NotificationSystem.add('integrationer.bogholderi.totalregnskap', {
            title: 'Ny integration tilgængelig',
            message: 'Total Regnskab er nu tilgængelig'
        });

        // Eksempel: Opdatering på Kunder siden
        NotificationSystem.add('kunder', {
            title: 'Nye kunder',
            message: '3 nye kunder tilføjet'
        });
    }
}
*/

// ========== EKSEMPEL NOTIFIKATIONER ==========
// Du kan tilføje notifikationer sådan her:

// Eksempel 1: Ny integration i bogholderi
// NotificationSystem.add('integrationer.bogholderi.totalregnskap', {
//     title: 'Ny integration tilgængelig',
//     message: 'Total Regnskab er nu tilgængelig'
// });

// Eksempel 2: Opdatering på en side
// NotificationSystem.add('kunder', {
//     title: 'Nye kunder',
//     message: '3 nye kunder tilføjet'
// });

// Eksempel 3: Ny funktion i workflow
// NotificationSystem.add('workflow', {
//     title: 'Ny automation tilgængelig',
//     message: 'Auto-svar funktionalitet er nu aktiv'
// });
