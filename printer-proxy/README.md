# OrderFlow Printer Proxy - Tailscale Setup

## Quick Start 🚀

### 1. Start MacBook Proxy (on your Mac)

```bash
# Navigate to this folder
cd /path/to/printer-proxy

# Run the MacBook proxy
node macbook-proxy.js
```

Keep this terminal window open. You should see:
```
🖨️  MacBook Printer Proxy listening on port 3457
📡 Forwarding to printer: 192.168.32.26:80
💡 Listening on all interfaces (including Tailscale 100.79.171.122)
```

### 2. Deploy VPS Proxy (on Hostinger VPS)

```bash
# SSH into VPS
ssh root@31.220.111.87

# Create directory
mkdir -p /opt/printer-proxy
cd /opt/printer-proxy

# Copy vps-proxy.js to here (from this repo)

# Run it
node vps-proxy.js
```

You should see:
```
🖨️  VPS Printer Proxy listening on port 3456
📡 Forwarding to MacBook via Tailscale: 100.79.171.122:3457
🌍 Public endpoint: http://31.220.111.87:3456/print
```

### 3. Test It Works

From VPS:
```bash
# Test MacBook proxy via Tailscale
curl http://100.79.171.122:3457/health

# Test full chain
curl http://localhost:3456/health
```

From anywhere:
```bash
# Test public endpoint
curl http://31.220.111.87:3456/health
```

### 4. Configure OrderFlow

OrderFlow is already configured to use the proxy! Settings in `printer-service.js`:
```javascript
useProxy: true,
proxyUrl: 'http://31.220.111.87:3456/print'
```

Just enable the printer in OrderFlow settings (Værktøjer → Printer Opsætning).

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  OrderFlow (Vercel HTTPS)                                      │
│                                                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ HTTPS POST /print
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  VPS Proxy (31.220.111.87:3456)                               │
│  • Receives HTTPS from internet                                │
│  • Forwards via Tailscale to MacBook                           │
│                                                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ HTTP via Tailscale
                         │ (100.91.246.90 → 100.79.171.122:3457)
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  MacBook Proxy (100.79.171.122:3457)                          │
│  • Receives from VPS via Tailscale                             │
│  • Forwards to printer on local network                        │
│                                                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ HTTP local network
                         │ (192.168.32.26:80)
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Star TSP100A Printer                                          │
│  • Receives print jobs                                         │
│  • Prints kitchen/customer receipts                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Files

- **`vps-proxy.js`** - Runs on VPS, forwards to MacBook via Tailscale
- **`macbook-proxy.js`** - Runs on MacBook, forwards to printer locally
- **`DEPLOY-TAILSCALE.md`** - Full deployment guide with systemd/LaunchDaemon setup
- **`README.md`** - This file (quick start)

---

## Running as Services (Optional)

### MacBook (LaunchDaemon)
See `DEPLOY-TAILSCALE.md` for macOS LaunchAgent setup to run proxy automatically.

### VPS (systemd)
See `DEPLOY-TAILSCALE.md` for systemd service setup.

---

## Troubleshooting

**MacBook proxy not reachable:**
- Make sure Tailscale is running: `tailscale status`
- Check proxy is running: `lsof -i :3457`
- Test locally: `curl http://localhost:3457/health`

**Printer not responding:**
- Check printer IP is correct: `192.168.32.26`
- Test from MacBook: `curl http://192.168.32.26`
- Make sure printer is on and connected to same network

**VPS proxy errors:**
- Check Tailscale is running on VPS: `tailscale status`
- Test connection to MacBook: `curl http://100.79.171.122:3457/health`
- Check firewall allows port 3456: `ufw status`

---

## Important Notes

⚠️ **MacBook must be ON and connected** for printing to work
- Printer is on local network, accessible only via MacBook
- If MacBook sleeps/disconnects, printing will fail
- Consider setting "Prevent Mac from sleeping" in Energy Settings

✅ **Tailscale keeps connections secure**
- No port forwarding needed on your router
- No public exposure of printer
- Encrypted tunnel between VPS and MacBook

🔋 **Power saving tips:**
- Set MacBook to never sleep when plugged in
- Or use a Raspberry Pi as the MacBook proxy instead
- Or wake MacBook remotely when order arrives (advanced)

---

## Support

Questions? Check `DEPLOY-TAILSCALE.md` for detailed troubleshooting.
