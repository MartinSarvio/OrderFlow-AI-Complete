/**
 * OrderFlow Kvittering (Receipt) Generator - Browser version med jsPDF
 * Genererer simple kvitteringer for ordrer (ikke fakturaer)
 */

class KvitteringGenerator {
    constructor() {
        this.primaryColor = [26, 26, 46]; // #1a1a2e
        this.accentColor = [16, 185, 129]; // #10b981 (green accent)
        this.lightGray = [248, 249, 250]; // #f8f9fa
        this.textColor = [51, 51, 51]; // #333333
    }

    formatCurrency(amount) {
        return Number(amount || 0).toFixed(2).replace('.', ',') + ' kr';
    }

    formatDate(dateStr) {
        const date = dateStr ? new Date(dateStr) : new Date();
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const mins = String(date.getMinutes()).padStart(2, '0');
        return `${day}.${month}.${year} kl. ${hours}:${mins}`;
    }

    /**
     * Generate receipt PDF
     * @param {Object} data - Receipt data
     * @param {string} data.ordreNummer - Order number
     * @param {Object} data.kunde - Customer info {navn, telefon, email?}
     * @param {Array} data.linjer - Order lines [{beskrivelse, antal, pris}]
     * @param {number} data.total - Total amount
     * @param {Object} data.restaurant - Restaurant info {navn, adresse?, cvr?, telefon?}
     * @param {string} data.orderType - 'Pickup' or 'Delivery'
     * @param {string} data.pickupTime - Estimated pickup/delivery time
     * @param {string} data.paymentMethod - Payment method used
     */
    generate(data) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            format: [80, 200], // Receipt width 80mm, variable height
            unit: 'mm'
        });

        const pageWidth = 80;
        const margin = 5;
        const contentWidth = pageWidth - 2 * margin;

        let yPos = margin;

        // ========== HEADER ==========
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]);
        doc.text(data.restaurant?.navn || 'OrderFlow', pageWidth / 2, yPos, { align: 'center' });

        yPos += 5;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(this.textColor[0], this.textColor[1], this.textColor[2]);

        if (data.restaurant?.adresse) {
            doc.text(data.restaurant.adresse, pageWidth / 2, yPos, { align: 'center' });
            yPos += 3;
        }
        if (data.restaurant?.telefon) {
            doc.text(`Tlf: ${data.restaurant.telefon}`, pageWidth / 2, yPos, { align: 'center' });
            yPos += 3;
        }
        if (data.restaurant?.cvr) {
            doc.text(`CVR: ${data.restaurant.cvr}`, pageWidth / 2, yPos, { align: 'center' });
            yPos += 3;
        }

        // Divider
        yPos += 2;
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 4;

        // ========== KVITTERING TITLE ==========
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('KVITTERING', pageWidth / 2, yPos, { align: 'center' });
        yPos += 5;

        // Order info
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`Ordre: #${data.ordreNummer}`, margin, yPos);
        yPos += 4;
        doc.text(`Dato: ${this.formatDate(data.dato)}`, margin, yPos);
        yPos += 4;

        if (data.orderType) {
            const typeLabel = data.orderType === 'Pickup' ? 'Afhentning' : 'Levering';
            doc.text(`Type: ${typeLabel}`, margin, yPos);
            yPos += 4;
        }

        if (data.pickupTime) {
            const timeLabel = data.orderType === 'Pickup' ? 'Afhentes ca.' : 'Leveres ca.';
            doc.text(`${timeLabel}: ${data.pickupTime}`, margin, yPos);
            yPos += 4;
        }

        // Customer info
        if (data.kunde?.navn) {
            doc.text(`Kunde: ${data.kunde.navn}`, margin, yPos);
            yPos += 4;
        }

        // Divider
        yPos += 1;
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 4;

        // ========== ORDER LINES ==========
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('Vare', margin, yPos);
        doc.text('Pris', pageWidth - margin, yPos, { align: 'right' });
        yPos += 4;

        doc.setFont('helvetica', 'normal');

        if (data.linjer && data.linjer.length > 0) {
            data.linjer.forEach(linje => {
                const antal = linje.antal || 1;
                const pris = Number(linje.pris || 0);
                const lineTotal = antal * pris;

                // Item name (with quantity if > 1)
                const itemText = antal > 1 ? `${antal}x ${linje.beskrivelse}` : linje.beskrivelse;

                // Wrap long text
                const maxWidth = contentWidth - 15;
                const lines = doc.splitTextToSize(itemText, maxWidth);

                lines.forEach((line, i) => {
                    doc.text(line, margin, yPos);
                    if (i === lines.length - 1) {
                        doc.text(this.formatCurrency(lineTotal), pageWidth - margin, yPos, { align: 'right' });
                    }
                    yPos += 3.5;
                });
            });
        }

        // Divider before totals
        yPos += 1;
        doc.setLineWidth(0.5);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 4;

        // ========== TOTALS ==========
        // Subtotal
        const momsSettings = JSON.parse(localStorage.getItem('orderflow_moms_settings') || '{}');
        const momsRate = momsSettings.rate || 25;
        const subtotal = data.total / (1 + momsRate / 100);
        const moms = data.total - subtotal;

        doc.setFontSize(8);
        doc.text('Subtotal:', margin, yPos);
        doc.text(this.formatCurrency(subtotal), pageWidth - margin, yPos, { align: 'right' });
        yPos += 4;

        doc.text(`Moms (${momsRate}%):`, margin, yPos);
        doc.text(this.formatCurrency(moms), pageWidth - margin, yPos, { align: 'right' });
        yPos += 4;

        // Total
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('TOTAL:', margin, yPos);
        doc.text(this.formatCurrency(data.total), pageWidth - margin, yPos, { align: 'right' });
        yPos += 5;

        // Payment method
        if (data.paymentMethod) {
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.text(`Betalt med: ${data.paymentMethod}`, margin, yPos);
            yPos += 4;
        }

        // ========== FOOTER ==========
        yPos += 3;
        doc.setLineWidth(0.3);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 4;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Tak for din ordre!', pageWidth / 2, yPos, { align: 'center' });
        yPos += 5;

        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(128, 128, 128);
        doc.text('Powered by OrderFlow', pageWidth / 2, yPos, { align: 'center' });

        return doc;
    }

    download(data, filename = 'kvittering.pdf') {
        const doc = this.generate(data);
        doc.save(filename);
    }

    getBlob(data) {
        const doc = this.generate(data);
        return doc.output('blob');
    }

    getBase64(data) {
        const doc = this.generate(data);
        return doc.output('datauristring');
    }
}

// Global instance
const kvitteringGenerator = new KvitteringGenerator();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = KvitteringGenerator;
}
