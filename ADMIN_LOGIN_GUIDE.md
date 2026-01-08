# Admin Login - Setup Guide

## ✅ Implementation Complete!

Admin login funktionaliteten er nu implementeret i OrderFlow AI. Du har nu **TO** login-metoder:

1. **Demo Login** - Hurtig test uden autentificering
2. **Admin Login** - Sikker login med email og password (NYT!)

---

## 🔧 VIGTIG: Opret Admin Bruger i Supabase

Før du kan bruge Admin Login, skal du manuelt oprette admin brugeren i Supabase Dashboard.

### Trin 1: Åbn Supabase Dashboard

1. Gå til: https://supabase.com/dashboard
2. Log ind på din Supabase konto
3. Vælg dit projekt: **OrderFlow-AI-Complete**

### Trin 2: Opret Admin Bruger

1. Klik på **Authentication** i venstre sidebar
2. Klik på **Users** fanen
3. Klik på **Add user** knappen (øverst til højre)
4. Vælg **Create new user**
5. Udfyld formularen:
   - **Email**: `MartinSarvio@hotmail.com`
   - **Password**: `Ma_93rtin`
   - **Auto Confirm User**: ✅ **VIGTIGT: Slå denne til!**
6. Klik **Create user**

### Trin 3: Verificér Oprettelse

Efter oprettelse skulle du se brugeren i listen med:
- Email: MartinSarvio@hotmail.com
- Status: ✅ Confirmed

---

## 🚀 Test Admin Login

### Metode 1: Admin Login Knap (1 klik)

1. Åbn http://localhost:8000
2. Klik på **"Admin Login"** knappen (lilla gradient)
3. Du bliver logget ind automatisk!

### Metode 2: Email/Password Form (Manuel indtastning)

1. Åbn http://localhost:8000
2. Indtast email: `MartinSarvio@hotmail.com`
3. Indtast password: `Ma_93rtin`
4. Klik **"Log ind"**

Begge metoder logger dig ind som samme admin bruger!

---

## 📊 Hvad Sker Der Ved Admin Login?

1. ✅ Autentificerer via Supabase Auth
2. ✅ Henter dine restauranter fra databasen
3. ✅ Initialiserer real-time sync (WebSocket)
4. ✅ Viser dashboard med dine data
5. ✅ Sætter `role: 'admin'` på din bruger (til fremtidig RBAC)

---

## 🔍 Verificér Login i Console

Åbn DevTools Console (F12) og du skulle se:

```
🔑 Attempting admin login...
✅ Admin login successful: MartinSarvio@hotmail.com
✅ Loaded restaurants: 0
✅ Subscribed to restaurant changes
✅ Subscribed to activity changes
✅ Subscribed to notification changes
✅ Real-time sync initialized successfully
✅ Admin logged in successfully!
```

---

## 🆚 Demo Login vs Admin Login

| Feature | Demo Login | Admin Login |
|---------|-----------|-------------|
| Kræver Supabase bruger | ❌ Nej | ✅ Ja |
| Data gemmes i database | ❌ Nej (kun localStorage) | ✅ Ja |
| Real-time sync | ✅ Ja (hvis Supabase tilgængelig) | ✅ Ja |
| Sikkerhed | ⚠️ Test-only | ✅ Sikker autentificering |
| Brug til | Testing, demo | Produktion, rigtig brug |

---

## ⚠️ Sikkerhedsnoter

### For Udvikling (Nu)
- Password er hardcoded i `loginAdmin()` funktionen
- Dette er **KUN** acceptabelt for udvikling/test
- Service role key bruges (fuld database adgang)

### For Produktion (Fremtid)
- ❌ Fjern hardcoded password fra `loginAdmin()`
- ✅ Brug kun email/password form med Supabase Auth
- ✅ Skift til `anon` key i stedet for `service_role`
- ✅ Implementér Row Level Security (RLS) policies
- ✅ Tilføj proper role-based access control (RBAC)

---

## 🐛 Troubleshooting

### "Admin login fejlede: Invalid login credentials"

**Problem:** Admin brugeren eksisterer ikke i Supabase.

**Løsning:** Følg "Opret Admin Bruger i Supabase" trin ovenfor.

---

### "Supabase not available, using local admin login"

**Problem:** Supabase client kunne ikke initialiseres.

**Løsning:**
1. Verificér at app kører på http://localhost:8000
2. Tjek DevTools Console for Supabase fejl
3. Verificér at `@supabase/supabase-js` CDN loadede korrekt

---

### Admin login virker, men ingen restauranter vises

**Dette er FORVENTET!** Du har ingen restauranter endnu.

**Løsning:**
1. Klik "+" → "Tilføj restaurant"
2. Indtast navn og telefonnummer
3. Klik "Tilføj"
4. Restauranten gemmes nu i Supabase database!

---

## ✅ Success Checklist

- [ ] Admin bruger oprettet i Supabase Dashboard
- [ ] "Admin Login" knap vises på login-siden
- [ ] Klik på "Admin Login" logger mig ind
- [ ] Console viser "✅ Admin login successful"
- [ ] Dashboard vises efter login
- [ ] Topbar avatar viser "M"
- [ ] Dropdown viser "Martin Sarvio" + email
- [ ] Kan tilføje restaurant → gemmes i Supabase
- [ ] "Demo Login" knap virker stadig

---

## 📁 Filer der er Ændret

### 1. `partials/auth.html` (linje 48-54)
**Tilføjet:** "Admin Login" knap med lilla gradient styling

### 2. `js/app.js` (linje 1557-1640)
**Tilføjet:**
- `loginAdmin()` - Admin login via Supabase Auth
- `loginAdminLocal()` - Fallback hvis Supabase ikke tilgængelig

---

**Oprettet:** 2026-01-04
**Version:** 1.0
