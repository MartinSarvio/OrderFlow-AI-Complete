# Printer Opsætning - Quick Start 🖨️

## Step 1: Start proxy på din Mac

**Åbn Terminal og kør:**

```bash
# Download macbook-proxy.js til din Mac
cd ~/Downloads
curl -O https://raw.githubusercontent.com/MartinSarvio/OrderFlow-AI-Complete/main/printer-proxy/macbook-proxy.js

# Kør den
node macbook-proxy.js
```

**Du skal se:**
```
🖨️  MacBook Printer Proxy listening on port 3457
📡 Forwarding to printer: 192.168.32.26:80
💡 Listening on all interfaces (including Tailscale 100.79.171.122)
```

**Lad denne terminal være åben!** Så længe den kører, kan printeren nås.

---

## Step 2: Deploy VPS proxy

**SSH ind på din VPS:**

```bash
ssh root@31.220.111.87
```

**Kør disse kommandoer:**

```bash
# Opret mappe
mkdir -p /opt/printer-proxy
cd /opt/printer-proxy

# Download vps-proxy.js
curl -O https://raw.githubusercontent.com/MartinSarvio/OrderFlow-AI-Complete/main/printer-proxy/vps-proxy.js

# Kør den
node vps-proxy.js
```

**Du skal se:**
```
🖨️  VPS Printer Proxy listening on port 3456
📡 Forwarding to MacBook via Tailscale: 100.79.171.122:3457
🌍 Public endpoint: http://31.220.111.87:3456/print
```

**Test det virker:**

```bash
# Fra VPS terminal, test forbindelsen
curl http://100.79.171.122:3457/health
# Skal returnere: {"status":"ok","printer":"192.168.32.26:80",...}

curl http://localhost:3456/health
# Skal også returnere success
```

---

## Step 3: Åbn firewall port (hvis nødvendigt)

```bash
# På VPS
ufw allow 3456/tcp
ufw reload
```

---

## Step 4: Test fra OrderFlow

1. Åbn OrderFlow (flow-lime-rho.vercel.app)
2. Gå til **Værktøjer → Printer Opsætning**
3. Aktiver printer (useProxy er allerede sat til true)
4. Klik **Test Forbindelse**

Du skulle gerne se: ✅ **Forbindelse OK**

Prøv at printe en test-kvittering!

---

## Gør det permanent (valgfrit)

### MacBook - Kør automatisk ved opstart

```bash
# Flyt filen til en permanent placering
mkdir -p ~/printer-proxy
mv ~/Downloads/macbook-proxy.js ~/printer-proxy/

# Opret LaunchAgent
nano ~/Library/LaunchAgents/com.orderflow.printer-proxy.plist
```

**Indsæt:**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.orderflow.printer-proxy</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>/Users/DINTBRUGERNAVN/printer-proxy/macbook-proxy.js</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/Users/DINTBRUGERNAVN/printer-proxy/output.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/DINTBRUGERNAVN/printer-proxy/error.log</string>
</dict>
</plist>
```

**Erstat `DINTBRUGERNAVN` med dit Mac brugernavn!**

**Aktiver:**

```bash
launchctl load ~/Library/LaunchAgents/com.orderflow.printer-proxy.plist
launchctl start com.orderflow.printer-proxy
```

Nu starter proxy'en automatisk når din Mac starter!

---

### VPS - Kør som systemd service

```bash
# På VPS
nano /etc/systemd/system/printer-proxy.service
```

**Indsæt:**

```ini
[Unit]
Description=OrderFlow Printer Proxy
After=network.target tailscaled.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/printer-proxy
ExecStart=/usr/bin/node /opt/printer-proxy/vps-proxy.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

**Aktiver:**

```bash
systemctl daemon-reload
systemctl enable printer-proxy
systemctl start printer-proxy

# Tjek status
systemctl status printer-proxy

# Se logs
journalctl -u printer-proxy -f
```

---

## Vigtigt! ⚠️

- **Din Mac skal være tændt** for at printeren virker
- Tailscale skal køre på både Mac og VPS
- Hvis Mac går i dvale, vil print fejle
- Overvej at sætte Mac til "Aldrig sluk" når den er tilsluttet strøm

---

## Troubleshooting

**Print virker ikke:**

1. **Tjek Mac proxy kører:**
   ```bash
   lsof -i :3457
   ```

2. **Tjek VPS proxy kører:**
   ```bash
   ssh root@31.220.111.87
   systemctl status printer-proxy
   # eller hvis du kører den manuelt: ps aux | grep vps-proxy
   ```

3. **Tjek Tailscale:**
   ```bash
   # På Mac
   tailscale status
   
   # På VPS
   tailscale status
   ```

4. **Test printer direkte fra Mac:**
   ```bash
   curl http://192.168.32.26
   # Skal returnere noget fra printeren
   ```

5. **Test forbindelsen:**
   ```bash
   # Fra VPS
   curl http://100.79.171.122:3457/health
   ```

**Hvis noget ikke virker, send mig fejlmeddelelsen!** 💬
