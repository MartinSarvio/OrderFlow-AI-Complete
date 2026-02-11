# Printer Proxy - Deployment Guide

## Hvad er det?
En proxy-server der kører på din VPS og videresender printer-requests fra OrderFlow (Vercel HTTPS) til din lokale Star TSP100A printer (HTTP).

## Deployment på Hostinger VPS

### 1. Upload filerne til VPS

SSH til din VPS:
```bash
ssh root@31.220.111.87
```

Opret mappe og upload filer:
```bash
mkdir -p /root/printer-proxy
cd /root/printer-proxy
```

Upload `server.js` og `package.json` til `/root/printer-proxy/` (brug SFTP eller scp).

### 2. Installer og start service

```bash
# Kopier systemd service fil
cp printer-proxy.service /etc/systemd/system/

# Reload systemd
systemctl daemon-reload

# Start service
systemctl start printer-proxy

# Check status
systemctl status printer-proxy

# Enable auto-start ved reboot
systemctl enable printer-proxy
```

### 3. Åbn firewall port

```bash
# UFW (hvis installeret)
ufw allow 3456/tcp

# Eller via Hostinger dashboard: Firewall → Add Rule → TCP 3456
```

### 4. Test proxy

```bash
# Fra VPS (lokal test)
curl http://localhost:3456/health

# Fra ekstern (test fra din Mac)
curl http://31.220.111.87:3456/health
```

Du skulle se:
```json
{"status":"ok","printer":"192.168.32.26:80"}
```

### 5. Opdater OrderFlow

I OrderFlow's printer integration, ændr URL fra:
```
http://192.168.32.26:80/StarWebPRNT/SendMessage
```

Til:
```
http://31.220.111.87:3456/print
```

## Logs

```bash
# Se logs
journalctl -u printer-proxy -f

# Se seneste 50 linjer
journalctl -u printer-proxy -n 50
```

## Stop/restart service

```bash
systemctl stop printer-proxy
systemctl restart printer-proxy
systemctl status printer-proxy
```

## Troubleshooting

**Problem:** Service starter ikke
```bash
# Check logs
journalctl -u printer-proxy -n 50

# Test manuelt
cd /root/printer-proxy
node server.js
```

**Problem:** Kan ikke nå proxy fra internet
- Check firewall: `ufw status`
- Check Hostinger firewall dashboard
- Check VPS IP: `curl ifconfig.me`

**Problem:** Proxy kan ikke nå printer
- Printer skal være på samme netværk som VPS
- Check printer IP: Se printer status slip
- Ping printer fra VPS: `ping 192.168.32.26`

## Sikkerhed (valgfri)

For at tilføje HTTPS (anbefalet):
1. Installer SSL certifikat (Let's Encrypt)
2. Tilføj HTTPS support i `server.js`
3. Opdater OrderFlow til at bruge `https://`

For nu virker HTTP fint fordi det kun er intern trafik.
