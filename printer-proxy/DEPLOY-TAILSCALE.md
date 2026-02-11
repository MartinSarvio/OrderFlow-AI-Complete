# Tailscale Printer Proxy Deployment Guide

## Architecture

```
OrderFlow (Vercel)
    ↓ HTTPS
VPS Proxy (31.220.111.87:3456)
    ↓ HTTP via Tailscale (100.91.246.90 → 100.79.171.122)
MacBook Proxy (100.79.171.122:3457)
    ↓ HTTP local network
Printer (192.168.32.26:80)
```

## Prerequisites

✅ Tailscale already installed on:
- VPS (srv13568942) - 100.91.246.90
- MacBook (macbook-pro-tilhrende-martin) - 100.79.171.122

✅ Node.js installed on both machines

---

## 1. Deploy MacBook Proxy (localhost)

**On your MacBook:**

```bash
# Create directory
mkdir -p ~/printer-proxy
cd ~/printer-proxy

# Copy macbook-proxy.js to this directory

# Install dependencies (none needed - uses built-in http module)

# Test it works
node macbook-proxy.js

# You should see:
# 🖨️  MacBook Printer Proxy listening on port 3457
# 📡 Forwarding to printer: 192.168.32.26:80
# 💡 Listening on all interfaces (including Tailscale 100.79.171.122)
```

**Test from VPS:**

```bash
ssh root@31.220.111.87

# Test connectivity to MacBook via Tailscale
curl http://100.79.171.122:3457/health

# Should return: {"status":"ok","printer":"192.168.32.26:80","note":"MacBook local proxy ready"}
```

**Run as background service (optional - recommended):**

Create LaunchDaemon on macOS:

```bash
cat > ~/Library/LaunchAgents/com.orderflow.printer-proxy.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.orderflow.printer-proxy</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>/Users/YOUR_USERNAME/printer-proxy/macbook-proxy.js</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/Users/YOUR_USERNAME/printer-proxy/output.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/YOUR_USERNAME/printer-proxy/error.log</string>
</dict>
</plist>
EOF

# Load it
launchctl load ~/Library/LaunchAgents/com.orderflow.printer-proxy.plist

# Check status
launchctl list | grep printer-proxy
```

---

## 2. Deploy VPS Proxy

**On VPS:**

```bash
ssh root@31.220.111.87

# Create directory
mkdir -p /opt/printer-proxy
cd /opt/printer-proxy

# Copy vps-proxy.js to this directory

# Test it works
node vps-proxy.js

# You should see:
# 🖨️  VPS Printer Proxy listening on port 3456
# 📡 Forwarding to MacBook via Tailscale: 100.79.171.122:3457
# 🌍 Public endpoint: http://31.220.111.87:3456/print
```

**Test end-to-end:**

```bash
# From VPS, test the full chain
curl -X POST http://localhost:3456/health
# Should proxy through to MacBook and return printer status
```

**Run as systemd service:**

```bash
cat > /etc/systemd/system/printer-proxy.service << 'EOF'
[Unit]
Description=OrderFlow Printer Proxy (VPS)
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
EOF

# Reload systemd
systemctl daemon-reload

# Enable and start
systemctl enable printer-proxy
systemctl start printer-proxy

# Check status
systemctl status printer-proxy

# View logs
journalctl -u printer-proxy -f
```

---

## 3. Update OrderFlow printer-service.js

Change proxy URL to:

```javascript
const PROXY_URL = 'http://31.220.111.87:3456/print';
```

---

## 4. Open Firewall Port (if needed)

```bash
# On VPS
ufw allow 3456/tcp
ufw reload
```

---

## Testing

### Test MacBook → Printer
```bash
# On MacBook
curl http://localhost:3457/health
```

### Test VPS → MacBook (via Tailscale)
```bash
# On VPS
curl http://100.79.171.122:3457/health
```

### Test VPS Proxy
```bash
# On VPS
curl http://localhost:3456/health
```

### Test from Internet (OrderFlow)
```bash
# From anywhere
curl http://31.220.111.87:3456/health
```

---

## Troubleshooting

**MacBook proxy not reachable from VPS:**
- Check Tailscale is running on both machines: `tailscale status`
- Verify MacBook proxy is listening: `lsof -i :3457`
- Check macOS firewall allows incoming connections

**Printer not responding:**
- Verify printer IP: `192.168.32.26`
- Test direct connection from MacBook: `curl http://192.168.32.26`
- Check printer is on same network as MacBook

**VPS proxy not accessible from internet:**
- Check firewall: `ufw status`
- Verify proxy is listening on 0.0.0.0: `netstat -tulpn | grep 3456`
- Test from VPS localhost first: `curl localhost:3456/health`

---

## Notes

- MacBook must be ON and connected to network with printer
- Tailscale must be running on both machines
- If MacBook sleeps, printer will be unreachable
- Consider keeping MacBook awake or setting up wake-on-LAN
