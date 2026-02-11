# Printer Proxy - Quick Start Guide

## Step 1: Deploy proxy til VPS

### Upload filer
```bash
# SSH til VPS
ssh root@31.220.111.87

# Opret mappe
mkdir -p /root/printer-proxy
cd /root/printer-proxy

# Download proxy kode (eller upload manuelt)
```

Upload disse filer til `/root/printer-proxy/`:
- `server.js`
- `package.json`
- `printer-proxy.service`

### Start service
```bash
# Kopier service fil
cp /root/printer-proxy/printer-proxy.service /etc/systemd/system/

# Start service
systemctl daemon-reload
systemctl start printer-proxy
systemctl enable printer-proxy

# Check status
systemctl status printer-proxy
```

### Åbn firewall
```bash
# Via UFW (hvis installeret)
ufw allow 3456/tcp

# ELLER via Hostinger dashboard:
# Firewall → Add Rule → Protocol: TCP, Port: 3456
```

### Test proxy
```bash
# Fra din Mac (eller browser)
curl http://31.220.111.87:3456/health
```

Forventet svar:
```json
{"status":"ok","printer":"192.168.32.26:80"}
```

---

## Step 2: Konfigurer OrderFlow

1. **Åbn OrderFlow** (https://flow-lime-rho.vercel.app/app/)

2. **Gå til Værktøjer → Integrationer → Printer Integration**

3. **Udfyld settings:**
   - **Printer IP:** `192.168.32.26`
   - **Port:** `80`
   - **Papirbredde:** `80mm`
   - **✓ Brug VPS Proxy:** Kryds af
   - **Proxy URL:** `http://31.220.111.87:3456/print`

4. **Klik "Gem & Aktiver"**

5. **Test:**
   - Gå til **Værktøjer → Enheder**
   - Klik **"Test Print"**
   - Printeren skulle nu printe en testkvittering! 🎉

---

## Troubleshooting

**Problem: curl health check fejler**
```bash
# Check om service kører
systemctl status printer-proxy

# Se logs
journalctl -u printer-proxy -n 50

# Test manuelt
cd /root/printer-proxy
node server.js
```

**Problem: Proxy kører, men OrderFlow kan ikke nå den**
- Check firewall: `ufw status`
- Check Hostinger firewall dashboard
- Prøv: `curl http://31.220.111.87:3456/health` fra din Mac

**Problem: Proxy kan ikke nå printer**
- Printer og VPS skal være på samme netværk
- Check printer IP: se printer status slip
- Ping fra VPS: `ping 192.168.32.26`

---

## Logs
```bash
# Live logs
journalctl -u printer-proxy -f

# Seneste 100 linjer
journalctl -u printer-proxy -n 100
```

## Stop/restart
```bash
systemctl stop printer-proxy
systemctl restart printer-proxy
systemctl status printer-proxy
```
