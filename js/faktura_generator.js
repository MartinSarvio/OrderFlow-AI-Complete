/**
 * OrderFlow Faktura Generator - Browser version med jsPDF
 */

class FakturaGenerator {
    constructor() {
        this.primaryColor = [26, 26, 46]; // #1a1a2e
        this.accentColor = [15, 52, 96]; // #0f3460
        this.mediumGray = [224, 224, 224]; // #e0e0e0
        this.lightGray = [248, 249, 250]; // #f8f9fa
        this.textColor = [51, 51, 51]; // #333333
    }

    formatCurrency(amount) {
        return amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&.').replace('.', ',').replace(/\./g, '.').replace(/,(\d{2})$/, ',$1') + ' DKK';
    }

    formatDate(dateStr) {
        const date = new Date(dateStr);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    }

    generate(fakturaData) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const pageWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const margin = 20;
        const contentWidth = pageWidth - 2 * margin;

        let yPos = margin;

        // ========== HEADER ==========
        // Left side - Company info
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('OrderFlow ApS', margin, yPos);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        yPos += 6;
        doc.text('Vestergade 12, 2100 København Ø', margin, yPos);
        yPos += 4;
        doc.text('CVR: DK 12345678 | Tlf: +45 70 20 30 40', margin, yPos);
        yPos += 4;
        doc.text('faktura@orderflow.dk', margin, yPos);

        // Right side - Invoice title and number
        const rightX = pageWidth - margin;
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]);
        doc.text('FAKTURA', rightX, margin, { align: 'right' });

        doc.setFontSize(11);
        doc.setTextColor(this.textColor[0], this.textColor[1], this.textColor[2]);
        doc.text(`Nr. ${fakturaData.invoiceNumber}`, rightX, margin + 8, { align: 'right' });

        // Horizontal line
        yPos = margin + 20;
        doc.setDrawColor(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]);
        doc.setLineWidth(0.5);
        doc.line(margin, yPos, pageWidth - margin, yPos);

        yPos += 8;

        // ========== KUNDE + FAKTURA INFO ==========
        const leftColX = margin;
        const rightColX = pageWidth - margin - 80;

        // Left - Customer info box
        doc.setFillColor(this.lightGray[0], this.lightGray[1], this.lightGray[2]);
        doc.rect(leftColX, yPos, 100, 30, 'F');

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Faktureres til:', leftColX + 3, yPos + 5);

        doc.setFontSize(10);
        doc.text(fakturaData.customer.companyName, leftColX + 3, yPos + 10);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        if (fakturaData.customer.attention) {
            doc.text(`Att: ${fakturaData.customer.attention}`, leftColX + 3, yPos + 15);
        }
        doc.text(fakturaData.customer.address, leftColX + 3, yPos + 19);
        doc.text(fakturaData.customer.postalCity, leftColX + 3, yPos + 23);
        doc.text(`CVR: ${fakturaData.customer.cvr}`, leftColX + 3, yPos + 27);

        // Right - Invoice dates
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        let rightYPos = yPos + 5;
        doc.text('Fakturadato:', rightColX, rightYPos);
        doc.setFont('helvetica', 'normal');
        doc.text(this.formatDate(fakturaData.invoiceDate), rightX, rightYPos, { align: 'right' });

        rightYPos += 5;
        doc.setFont('helvetica', 'bold');
        doc.text('Forfaldsdato:', rightColX, rightYPos);
        doc.setFont('helvetica', 'normal');
        doc.text(this.formatDate(fakturaData.dueDate), rightX, rightYPos, { align: 'right' });

        rightYPos += 5;
        doc.setFont('helvetica', 'bold');
        doc.text('Betaling:', rightColX, rightYPos);
        doc.setFont('helvetica', 'normal');
        doc.text(fakturaData.paymentTerms, rightX, rightYPos, { align: 'right' });

        if (fakturaData.orderReference) {
            rightYPos += 5;
            doc.setFont('helvetica', 'bold');
            doc.text('Deres ref.:', rightColX, rightYPos);
            doc.setFont('helvetica', 'normal');
            doc.text(fakturaData.orderReference, rightX, rightYPos, { align: 'right' });
        }

        yPos += 38;

        // ========== FAKTURALINJER ==========
        // Table header
        doc.setFillColor(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]);
        doc.rect(margin, yPos, contentWidth, 7, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');

        doc.text('Beskrivelse', margin + 2, yPos + 5);
        doc.text('Antal', margin + 82, yPos + 5, { align: 'right' });
        doc.text('Enhed', margin + 102, yPos + 5, { align: 'right' });
        doc.text('Enhedspris', margin + 135, yPos + 5, { align: 'right' });
        doc.text('Beløb', rightX - 2, yPos + 5, { align: 'right' });

        yPos += 7;

        // Table rows
        doc.setTextColor(this.textColor[0], this.textColor[1], this.textColor[2]);
        doc.setFont('helvetica', 'normal');

        fakturaData.lines.forEach((line, index) => {
            yPos += 6;

            doc.text(line.description, margin + 2, yPos);
            doc.text(String(line.quantity), margin + 82, yPos, { align: 'right' });
            doc.text(line.unit, margin + 102, yPos, { align: 'right' });
            doc.text(line.unitPrice.toFixed(2).replace('.', ','), margin + 135, yPos, { align: 'right' });
            doc.text(line.amount.toFixed(2).replace('.', ','), rightX - 2, yPos, { align: 'right' });

            // Line separator
            if (index < fakturaData.lines.length - 1) {
                doc.setDrawColor(this.mediumGray[0], this.mediumGray[1], this.mediumGray[2]);
                doc.setLineWidth(0.1);
                doc.line(margin, yPos + 2, pageWidth - margin, yPos + 2);
            }
        });

        // Bottom line of table
        yPos += 2;
        doc.setDrawColor(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]);
        doc.setLineWidth(0.3);
        doc.line(margin, yPos, pageWidth - margin, yPos);

        yPos += 8;

        // ========== TOTALER ==========
        const totalsX = pageWidth - margin - 75;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');

        doc.text('Subtotal ekskl. moms:', totalsX, yPos);
        doc.text(this.formatCurrency(fakturaData.subtotal), rightX - 2, yPos, { align: 'right' });

        yPos += 5;
        doc.text('Moms 25%:', totalsX, yPos);
        doc.text(this.formatCurrency(fakturaData.vat), rightX - 2, yPos, { align: 'right' });

        yPos += 5;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);

        // Total box background
        doc.setFillColor(this.lightGray[0], this.lightGray[1], this.lightGray[2]);
        doc.rect(totalsX - 2, yPos - 4, 75, 8, 'F');

        doc.setDrawColor(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]);
        doc.setLineWidth(0.3);
        doc.line(totalsX - 2, yPos - 4, rightX, yPos - 4);

        doc.text('Total inkl. moms:', totalsX, yPos);
        doc.text(this.formatCurrency(fakturaData.total), rightX - 2, yPos, { align: 'right' });

        // ========== BETALINGSINFO ==========
        const paymentBoxY = pageHeight - 45;
        doc.setFillColor(this.lightGray[0], this.lightGray[1], this.lightGray[2]);
        doc.rect(margin, paymentBoxY, 100, 22, 'F');

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(this.textColor[0], this.textColor[1], this.textColor[2]);
        doc.text('Betalingsoplysninger', margin + 3, paymentBoxY + 5);

        doc.setFont('helvetica', 'normal');
        doc.text('Danske Bank | Reg: 1234 | Konto: 12345678', margin + 3, paymentBoxY + 10);

        const refText = `Anfør fakturanr. ${fakturaData.invoiceNumber} ved betaling`;
        doc.text('Anfør fakturanr. ', margin + 3, paymentBoxY + 15);
        doc.setFont('helvetica', 'bold');
        const textWidth = doc.getTextWidth('Anfør fakturanr. ');
        doc.text(fakturaData.invoiceNumber, margin + 3 + textWidth, paymentBoxY + 15);
        doc.setFont('helvetica', 'normal');
        const numberWidth = doc.getTextWidth(fakturaData.invoiceNumber);
        doc.text(' ved betaling', margin + 3 + textWidth + numberWidth, paymentBoxY + 15);

        // ========== FOOTER ==========
        doc.setDrawColor(this.mediumGray[0], this.mediumGray[1], this.mediumGray[2]);
        doc.setLineWidth(0.1);
        doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

        doc.setFontSize(7);
        doc.setTextColor(128, 128, 128);
        const footerText = 'OrderFlow ApS | Vestergade 12, 2100 København Ø | CVR: DK 12345678 | +45 70 20 30 40 | faktura@orderflow.dk | www.orderflow.dk';
        doc.text(footerText, pageWidth / 2, pageHeight - 9, { align: 'center' });

        doc.setFontSize(8);
        doc.text('Side 1 af 1', pageWidth / 2, pageHeight - 4, { align: 'center' });

        return doc;
    }

    download(fakturaData, filename = 'faktura.pdf') {
        const doc = this.generate(fakturaData);
        doc.save(filename);
    }

    getBlob(fakturaData) {
        const doc = this.generate(fakturaData);
        return doc.output('blob');
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FakturaGenerator;
}
