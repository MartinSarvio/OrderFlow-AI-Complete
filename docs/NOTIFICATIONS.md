# 🔔 OrderFlow Notifikationssystem

## Oversigt

Dette notifikationssystem viser blå prikker i sidebar menu'en når der er nye opdateringer, nye funktioner eller nyt indhold i systemet. Notifikationerne vises hierarkisk gennem hele menu-strukturen.

## 🎯 Funktionalitet

### Hierarkisk Visning

Når en notifikation tilføjes, vises den blå prik på **alle niveauer** i hierarkiet:

**Eksempel:** Ny integration "Total Regnskab" i Bogholderi
```
Path: integrationer.bogholderi.totalregnskap

Resultat - blå prik vises på:
✓ "Integrationer" (top-level dropdown)
✓ "Bogholderi" (submenu item)
✓ "Total Regnskab" integration card (hvis data-integration attribut findes)
```

### Visuel Design

- **Blå prik:** 8px diameter, #0066ff farve
- **Pulserende animation:** Soft pulse-effekt for opmærksomhed
- **Positionering:** Automatisk tilpasset til forskellige menu-typer
- **Responsiv:** Fungerer på alle skærmstørrelser

## 📦 Implementering

### Filer

1. **js/notifications.js** - Kerne-funktionalitet
2. **css/styles.css** - Styling for blå prikker (linjer 3531-3578)
3. **test_notifications.html** - Test- og demo-side

### Brug i Kode

#### Tilføj Notifikation

```javascript
// Grundlæggende
NotificationSystem.add('integrationer.bogholderi.e-conomic', {
    title: 'Opdatering tilgængelig',
    message: 'e-conomic integration er opdateret'
});

// Med flere options
NotificationSystem.add('kunder', {
    title: 'Nye kunder',
    message: '5 nye kunder tilføjet i dag',
    timestamp: Date.now()
});
```

#### Fjern Notifikation

```javascript
// Fjern specifik notifikation
NotificationSystem.remove('integrationer.bogholderi.e-conomic');

// Fjern alle under en path
NotificationSystem.clearPath('integrationer.bogholderi');

// Ryd alle notifikationer
NotificationSystem.notifications.clear();
NotificationSystem.saveNotifications();
NotificationSystem.applyNotifications();
```

#### Marker som Læst

```javascript
NotificationSystem.markAsRead('integrationer.bogholderi.e-conomic');
```

#### Hent Information

```javascript
// Antal ulæste
const count = NotificationSystem.getUnreadCount('integrationer');

// Alle notifikationer for en path
const notifications = NotificationSystem.getNotifications('integrationer.bogholderi');
```

## 🗂️ Path-struktur

### Standard Paths

```
Hovedsider:
- dashboard
- kunder
- ordre
- faktura
- beskeder
- workflow

Integrationer:
- integrationer
- integrationer.bogholderi
- integrationer.bogholderi.[integration-navn]
- integrationer.betaling
- integrationer.betaling.[betalingsmetode]

Indstillinger:
- indstillinger
- indstillinger.api
- indstillinger.ailearning
- indstillinger.users
- indstillinger.roles
```

### Eksempler

```javascript
// Ny side eller hovedfunktion
NotificationSystem.add('dashboard', {
    title: 'Nye funktioner',
    message: 'Dashboard har fået nye widgets'
});

// Ny integration
NotificationSystem.add('integrationer.bogholderi.uniconta', {
    title: 'Integration klar',
    message: 'Uniconta integration er nu tilgængelig'
});

// Opdatering i undersektion
NotificationSystem.add('integrationer.betaling.mobilepay', {
    title: 'MobilePay opdatering',
    message: 'MobilePay Business nu understøttet'
});

// Indstillinger opdatering
NotificationSystem.add('indstillinger.api', {
    title: 'Ny API version',
    message: 'API v2.0 er nu tilgængelig'
});
```

## 🧪 Test

### Test-side

Åbn `test_notifications.html` i din browser:
```
http://localhost:8080/test_notifications.html
```

### Browser Console

```javascript
// Test direkte i console
NotificationSystem.add('test.path', {title: 'Test', message: 'Dette er en test'});

// Se alle notifikationer
console.log(Array.from(NotificationSystem.notifications.entries()));

// Ryd alt
NotificationSystem.notifications.clear();
NotificationSystem.saveNotifications();
NotificationSystem.applyNotifications();
```

## 💾 Persistens

Notifikationer gemmes automatisk i **localStorage** under nøglen:
```
orderflow_notifications
```

Dette betyder at notifikationer bevares mellem sessions.

## 🎨 Tilpasning

### Ændre Farve

I `css/styles.css` (linje 3538):
```css
.nav-notification-badge {
  background: #0066ff; /* Skift til din farve */
}
```

### Ændre Størrelse

I `css/styles.css` (linje 3536-3537):
```css
.nav-notification-badge {
  width: 8px;  /* Standard størrelse */
  height: 8px;
}
```

### Deaktivere Animation

Fjern eller udkommenter i `css/styles.css` (linje 3541):
```css
/* animation: notification-pulse 2s ease-in-out infinite; */
```

## 🔧 Integration med Backend

### Eksempel: Webhook eller Server-Sent Events

```javascript
// Når backend sender opdatering
eventSource.addEventListener('new-integration', (event) => {
    const data = JSON.parse(event.data);

    NotificationSystem.add(`integrationer.${data.category}.${data.integrationId}`, {
        title: data.title,
        message: data.message
    });
});

// Når bruger klikker på integration
function viewIntegration(integrationId) {
    // Fjern notifikation når bruger ser den
    NotificationSystem.remove(`integrationer.bogholderi.${integrationId}`);

    // Vis integration detaljer
    showIntegrationDetails(integrationId);
}
```

## 🚀 Production Deploy

### Fjern Demo Notifikationer

I `js/notifications.js` (linje 238-254), udkommenter eller fjern:

```javascript
// Demo funktion - fjern denne i produktion
function addDemoNotifications() {
    // ... fjern denne hele funktion
}
```

Og fjern kaldet til funktionen (linje 226 og 232):
```javascript
// addDemoNotifications(); // Fjern denne linje
```

## 📋 Best Practices

1. **Brug meningsfulde paths** - Følg menu-strukturen
2. **Clear notifikationer når set** - Marker som læst eller fjern når bruger har set opdateringen
3. **Begræns mængden** - Hav ikke for mange aktive notifikationer ad gangen
4. **Konsistent navngivning** - Brug lowercase og bindestreger i integration-navne
5. **Test hierarki** - Sørg for at notifikationer vises på alle niveauer

## 🐛 Fejlfinding

### Blå prik vises ikke

1. Check at path matcher menu-struktur
2. Verificer at element findes i DOM
3. Check browser console for fejl
4. Test med `NotificationSystem.applyNotifications()` i console

### Notifikationer forsvinder

1. Check localStorage (Application tab i DevTools)
2. Verificer at `saveNotifications()` kaldes
3. Sørg for at notifikationer ikke bliver auto-cleared

### Animation virker ikke

1. Check at CSS er loaded korrekt
2. Verificer at animation ikke er disabled i browser settings
3. Test i anden browser

## 📞 Support

For spørgsmål eller problemer, åbn issue på GitHub eller kontakt udviklingsteamet.

---

**Version:** 1.0.0
**Sidste opdatering:** Januar 2026
