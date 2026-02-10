# 🖨️ Star Micronics TSP100A Printer Integration

## Oversigt

OrderFlow understøtter Star Micronics TSP100A (TSP143IV-UE) thermal kvitteringsprinter med:
- **Kunde-kvitteringer** ved ordreafslutning
- **Køkken-kvitteringer** ved nye ordrer (automatisk)
- **Print kø** med retry-logik
- **Admin UI** til konfiguration

## Hardware

| Felt | Værdi |
|------|-------|
| Model | TSP143IV-UE GYE+U |
| Producent | Star Micronics CO. LTD |
| Interface | USB-C + Ethernet (LAN) |
| Papirbredde | 80mm (standard) eller 58mm |
| Hastighed | 250mm/s |
| Opløsning | 203 DPI |
| Auto-cutter | Ja (partial cut) |

## Setup

### 1. Tilslut Printer via Ethernet (anbefalet)

1. Tilslut printer til netværk via Ethernet-kabel
2. Find printerens IP-adresse:
   - Print selv-test: Hold FEED-knappen nede mens du tænder printeren
   - Eller check din router's DHCP-tabel
3. Anbefal: Tildel fast IP via DHCP reservation

### 2. Konfigurer i OrderFlow

1. Gå til **Indstillinger → 🖨️ Printer**
2. Slå "Aktiver Printer" til
3. Indtast printerens IP-adresse (f.eks. `192.168.1.100`)
4. Port: `80` (standard for Star WebPRNT)
5. Vælg papirbredde (80mm eller 58mm)
6. Tryk "Tjek Status" for at verificere forbindelse
7. Tryk "Test Print" for at printe en test-kvittering

### 3. Konfigurer Auto-Print

- **Køkken-kvittering**: Slå til for automatisk print ved nye ordrer
- **Kunde-kvittering**: Slå til for automatisk print ved "Færdig"
- **Lyd**: Printer bipper ved køkken-print (vælgbart)
- **Ordre-typer**: Vælg hvilke ordretyper der skal printes

### 4. Tilpas Kvittering

Udfyld restaurant-info der vises på kvitteringen:
- Restaurant navn
- Adresse
- Telefon
- CVR-nummer
- Footer-tekst
- QR-kode (valgfrit)

## Teknisk Arkitektur

### Star WebPRNT SDK

Bruger Star Micronics' officielle **WebPRNT JavaScript SDK** til direkte browser-til-printer kommunikation via HTTP/XML over LAN. Ingen backend eller driver krævet.

**Filer:**
- `js/vendor/starwebprnt/StarWebPrintBuilder.js` - Builder til print-kommandoer
- `js/vendor/starwebprnt/StarWebPrintTrader.js` - HTTP kommunikation med printer
- `js/vendor/starwebprnt/StarBarcodeEncoder.js` - Stregkode-encoder
- `js/printer-service.js` - Wrapper, templates, kø-system

### Print Flow

```
Ny ordre → saveOrderToModule() → triggerKitchenPrint() → addToPrintQueue()
                                                              ↓
Færdig ordre → completeOrder() → triggerCustomerPrint() → processPrintQueue()
                                                              ↓
                                                    StarWebPrintBuilder (XML)
                                                              ↓
                                                    StarWebPrintTrader (HTTP POST)
                                                              ↓
                                              http://PRINTER_IP/StarWebPRNT/SendMessage
```

### Print Kø

- Jobs gemmes i `localStorage` (key: `orderflow_print_queue`)
- Automatisk retry hvert 30 sekunder
- Max 5 forsøg per job
- Færdige jobs slettes efter 1 time
- Kø overlever browser-genstart

## Kvittering Format

### Kunde-kvittering
- Restaurant header (navn, adresse, CVR)
- Ordre-nummer + dato
- Ordretype + kundenavn
- Alle items med priser
- Subtotal, moms (25%), total
- QR-kode (valgfrit)
- Footer-tekst

### Køkken-kvittering
- **STOR TEKST** (let læselig)
- "KØKKEN" header
- Ordre-nummer (4x størrelse)
- Ordretype
- Items med antal
- Noter/special instructions
- Estimeret tid
- Lyd-alarm

## Troubleshooting

| Problem | Løsning |
|---------|---------|
| "Kan ikke forbinde til printer" | Tjek IP-adresse og at printer er på netværket |
| "Printer timeout" | Tjek Ethernet-kabel og netværk |
| "Printer er offline" | Tænd printeren, tjek strøm |
| "Printer låg er åbent" | Luk papirlåget |
| "Løbet tør for papir" | Skift papirrulle (80mm thermal) |
| "Cutter fejl" | Fjern eventuel papirblokering |
| Forkerte danske tegn | Bruger cp1252 + denmark codepage |
| CORS-fejl | Printer skal være på samme LAN |

### CORS / Mixed Content

Star WebPRNT kører over HTTP. Hvis OrderFlow kører over HTTPS, kan browseren blokere requests. Løsninger:
1. Brug Star WebPRNT Browser app (anbefalet til tablet)
2. Kør OrderFlow lokalt over HTTP
3. Aktiver HTTPS på printeren (kræver certifikat-import)

## Papirrulle

- Bredde: 80mm (standard) eller 58mm
- Type: Thermal papir
- Diameter: Max 83mm
- Kerne: 12mm

## Version

Integreret i OrderFlow v4.5.0
SDK: Star WebPRNT v1.9.0
