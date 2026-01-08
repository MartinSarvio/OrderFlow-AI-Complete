"""
OrderFlow Faktura Generator - Betalingsinfo i bunden
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.colors import HexColor
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from io import BytesIO
from datetime import datetime, date, timedelta
from typing import Dict, List, Optional
from dataclasses import dataclass, field
from enum import Enum

# ============ FARVER ============
PRIMARY_COLOR = HexColor("#1a1a2e")
ACCENT_COLOR = HexColor("#0f3460")
MEDIUM_GRAY = HexColor("#e0e0e0")
LIGHT_GRAY = HexColor("#f8f9fa")
TEXT_COLOR = HexColor("#333333")

# ============ ENUMS ============
class PaymentTerms(Enum):
    NET_8 = (8, "Netto 8 dage")
    NET_14 = (14, "Netto 14 dage")
    NET_30 = (30, "Netto 30 dage")
    IMMEDIATE = (0, "Kontant")

    def __init__(self, days: int, label: str):
        self.days = days
        self.label = label

class VatRate(Enum):
    STANDARD = (25.0, "25%")
    ZERO = (0.0, "0%")

    def __init__(self, rate: float, label: str):
        self.rate = rate
        self.label = label

class FakturaType(Enum):
    INVOICE = "FAKTURA"
    CREDIT_NOTE = "KREDITNOTA"
    PROFORMA = "PROFORMA"

# ============ DATA KLASSER ============
@dataclass
class PlatformInfo:
    company_name: str = "OrderFlow ApS"
    address: str = "Vestergade 12"
    postal_city: str = "2100 København Ø"
    cvr: str = "12345678"
    phone: str = "+45 70 20 30 40"
    email: str = "faktura@orderflow.dk"
    website: str = "www.orderflow.dk"
    bank_name: str = "Danske Bank"
    bank_reg: str = "1234"
    bank_account: str = "12345678"

@dataclass
class CustomerInfo:
    company_name: str
    cvr: str
    address: str
    postal_city: str
    attention: Optional[str] = None
    email: Optional[str] = None

@dataclass
class InvoiceLine:
    description: str
    quantity: float
    unit: str
    unit_price: float
    vat_rate: VatRate = VatRate.STANDARD

    @property
    def line_total_excl_vat(self) -> float:
        return round(self.quantity * self.unit_price, 2)

    @property
    def vat_amount(self) -> float:
        return round(self.line_total_excl_vat * (self.vat_rate.rate / 100), 2)

    @property
    def line_total_incl_vat(self) -> float:
        return round(self.line_total_excl_vat + self.vat_amount, 2)

@dataclass
class FakturaData:
    invoice_number: str
    invoice_date: date
    lines: List[InvoiceLine]
    payment_terms: PaymentTerms = PaymentTerms.NET_14
    invoice_type: FakturaType = FakturaType.INVOICE
    order_reference: Optional[str] = None

    @property
    def due_date(self) -> date:
        return self.invoice_date + timedelta(days=self.payment_terms.days)

    @property
    def subtotal_excl_vat(self) -> float:
        return sum(line.line_total_excl_vat for line in self.lines)

    @property
    def total_vat(self) -> float:
        return sum(line.vat_amount for line in self.lines)

    @property
    def total_incl_vat(self) -> float:
        return round(self.subtotal_excl_vat + self.total_vat, 2)

# ============ HJÆLPEFUNKTIONER ============
def fmt_currency(amount: float) -> str:
    return f"{amount:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".") + " DKK"

def fmt_date(d: date) -> str:
    return d.strftime("%d.%m.%Y")

# ============ CANVAS MED SIDEFOD OG BETALINGSINFO ============
class FakturaCanvas(canvas.Canvas):
    def __init__(self, *args, platform_info: PlatformInfo = None, invoice_number: str = "", **kwargs):
        canvas.Canvas.__init__(self, *args, **kwargs)
        self._saved_page_states = []
        self.platform_info = platform_info or PlatformInfo()
        self.invoice_number = invoice_number
        # Beregn bredde - samme som page_width * 0.55
        self.box_width = (A4[0] - 40*mm) * 0.55

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_payment_info()
            self.draw_footer(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_payment_info(self):
        """Tegner betalingsoplysninger i venstre side, lige over sidefod"""
        page_width, page_height = A4
        p = self.platform_info

        # Position og størrelse - matcher "Faktureres til" boksen
        box_x = 20*mm
        box_y = 20*mm
        box_width = self.box_width
        box_height = 22*mm  # Matcher højden på Faktureres til
        padding = 3*mm

        # Baggrund
        self.setFillColor(LIGHT_GRAY)
        self.roundRect(box_x, box_y, box_width, box_height, 0, fill=True, stroke=False)

        # Tekst
        self.setFillColor(TEXT_COLOR)

        # Overskrift
        self.setFont("Helvetica-Bold", 9)
        self.drawString(box_x + padding, box_y + box_height - 5*mm, "Betalingsoplysninger")

        # Bankinfo
        self.setFont("Helvetica", 9)
        self.drawString(box_x + padding, box_y + box_height - 10*mm, f"{p.bank_name} | Reg: {p.bank_reg} | Konto: {p.bank_account}")

        # Fakturanummer reference
        self.setFont("Helvetica", 9)
        text_y = box_y + box_height - 15*mm
        self.drawString(box_x + padding, text_y, "Anfør fakturanr. ")

        # Beregn position for bold tekst
        text_width = self.stringWidth("Anfør fakturanr. ", "Helvetica", 9)
        self.setFont("Helvetica-Bold", 9)
        self.drawString(box_x + padding + text_width, text_y, self.invoice_number)

        # Fortsæt med normal tekst
        bold_width = self.stringWidth(self.invoice_number, "Helvetica-Bold", 9)
        self.setFont("Helvetica", 9)
        self.drawString(box_x + padding + text_width + bold_width, text_y, " ved betaling")

    def draw_footer(self, page_count):
        page_width, page_height = A4
        p = self.platform_info

        # Tynd linje over sidefod
        self.setStrokeColor(MEDIUM_GRAY)
        self.setLineWidth(0.5)
        self.line(20*mm, 15*mm, page_width - 20*mm, 15*mm)

        # Firmainfo linje
        self.setFont("Helvetica", 7)
        self.setFillColor(colors.gray)
        footer_text = f"{p.company_name} | {p.address}, {p.postal_city} | CVR: DK {p.cvr} | {p.phone} | {p.email} | {p.website}"
        self.drawCentredString(page_width / 2, 9*mm, footer_text)

        # Side X af Y
        self.setFont("Helvetica", 8)
        page_text = f"Side {self._pageNumber} af {page_count}"
        self.drawCentredString(page_width / 2, 4*mm, page_text)

# ============ PDF GENERATOR ============
class FakturaGenerator:

    def __init__(self, platform_info: PlatformInfo = None):
        self.platform = platform_info or PlatformInfo()
        self.page_width = A4[0] - 40*mm

    def generate(self, faktura: FakturaData, customer: CustomerInfo) -> bytes:
        buffer = BytesIO()

        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=20*mm,
            rightMargin=20*mm,
            topMargin=20*mm,
            bottomMargin=48*mm  # Plads til betalingsinfo + sidefod
        )

        story = []
        p = self.platform

        # ========== HEADER ==========
        left_header = Paragraph(
            f"""<font size="16"><b>{p.company_name}</b></font><br/>
<font size="9">{p.address}, {p.postal_city}<br/>
CVR: DK {p.cvr} | Tlf: {p.phone}<br/>
{p.email}</font>""",
            ParagraphStyle('LH', fontSize=9, leading=11, textColor=TEXT_COLOR)
        )

        right_header = Paragraph(
            f"""<font size="24"><b>{faktura.invoice_type.value}</b></font><br/>
<font size="11">Nr. {faktura.invoice_number}</font>""",
            ParagraphStyle('RH', fontSize=11, leading=14, alignment=TA_RIGHT, textColor=PRIMARY_COLOR)
        )

        header_table = Table([[left_header, right_header]], colWidths=[self.page_width*0.55, self.page_width*0.45])
        header_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        story.append(header_table)
        story.append(Spacer(1, 4*mm))

        # Linje
        line = Table([['']], colWidths=[self.page_width])
        line.setStyle(TableStyle([('LINEBELOW', (0, 0), (-1, -1), 1.5, PRIMARY_COLOR)]))
        story.append(line)
        story.append(Spacer(1, 6*mm))

        # ========== KUNDE + FAKTURA INFO ==========
        att = f"Att: {customer.attention}<br/>" if customer.attention else ""
        ref = f"Deres ref.: {faktura.order_reference}<br/>" if faktura.order_reference else ""

        left_info = Paragraph(
            f"""<font size="9"><b>Faktureres til:</b></font><br/>
<font size="10"><b>{customer.company_name}</b></font><br/>
{att}<font size="9">{customer.address}<br/>
{customer.postal_city}<br/>
CVR: {customer.cvr}</font>""",
            ParagraphStyle('LI', fontSize=9, leading=11, textColor=TEXT_COLOR)
        )

        right_info = Paragraph(
            f"""<font size="9">
<b>Fakturadato:</b> {fmt_date(faktura.invoice_date)}<br/>
<b>Forfaldsdato:</b> {fmt_date(faktura.due_date)}<br/>
<b>Betaling:</b> {faktura.payment_terms.label}<br/>
{ref}</font>""",
            ParagraphStyle('RI', fontSize=9, leading=12, alignment=TA_RIGHT, textColor=TEXT_COLOR)
        )

        info_table = Table([[left_info, right_info]], colWidths=[self.page_width*0.55, self.page_width*0.45])
        info_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BACKGROUND', (0, 0), (0, 0), LIGHT_GRAY),
            ('LEFTPADDING', (0, 0), (0, 0), 3*mm),
            ('TOPPADDING', (0, 0), (0, 0), 3*mm),
            ('BOTTOMPADDING', (0, 0), (0, 0), 3*mm),
            ('RIGHTPADDING', (0, 0), (0, 0), 3*mm),
        ]))
        story.append(info_table)
        story.append(Spacer(1, 8*mm))

        # ========== FAKTURALINJER ==========
        header_row = ['Beskrivelse', 'Antal', 'Enhed', 'Enhedspris', 'Beløb']
        table_data = [header_row]

        for ln in faktura.lines:
            table_data.append([
                ln.description,
                f"{ln.quantity:.0f}" if ln.quantity == int(ln.quantity) else f"{ln.quantity:.2f}".replace(".", ","),
                ln.unit,
                f"{ln.unit_price:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."),
                f"{ln.line_total_excl_vat:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
            ])

        col_widths = [self.page_width*0.40, self.page_width*0.12, self.page_width*0.12, self.page_width*0.18, self.page_width*0.18]

        lines_table = Table(table_data, colWidths=col_widths)
        lines_table.setStyle(TableStyle([
            # Header
            ('BACKGROUND', (0, 0), (-1, 0), PRIMARY_COLOR),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('TOPPADDING', (0, 0), (-1, 0), 2.5*mm),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 2.5*mm),
            # Data
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('TEXTCOLOR', (0, 1), (-1, -1), TEXT_COLOR),
            ('TOPPADDING', (0, 1), (-1, -1), 2*mm),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 2*mm),
            # Alignment
            ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            # Lines
            ('LINEBELOW', (0, 1), (-1, -2), 0.5, MEDIUM_GRAY),
            ('LINEBELOW', (0, -1), (-1, -1), 1, PRIMARY_COLOR),
        ]))
        story.append(lines_table)
        story.append(Spacer(1, 6*mm))

        # ========== TOTALER (kun højre side) ==========
        totals_data = [
            ['Subtotal ekskl. moms:', fmt_currency(faktura.subtotal_excl_vat)],
            ['Moms 25%:', fmt_currency(faktura.total_vat)],
            ['Total inkl. moms:', fmt_currency(faktura.total_incl_vat)],
        ]

        totals_table = Table(totals_data, colWidths=[self.page_width*0.24, self.page_width*0.20])
        totals_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -2), 'Helvetica'),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -2), 9),
            ('FONTSIZE', (0, -1), (-1, -1), 11),
            ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
            ('TOPPADDING', (0, 0), (-1, -1), 1.5*mm),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 1.5*mm),
            ('LINEABOVE', (0, -1), (-1, -1), 1, PRIMARY_COLOR),
            ('BACKGROUND', (0, -1), (-1, -1), LIGHT_GRAY),
            ('TOPPADDING', (0, -1), (-1, -1), 2.5*mm),
            ('BOTTOMPADDING', (0, -1), (-1, -1), 2.5*mm),
        ]))

        # Placer totaler til højre
        wrapper = Table([[Spacer(1,1), totals_table]], colWidths=[self.page_width*0.56, self.page_width*0.44])
        wrapper.setStyle(TableStyle([('ALIGN', (1, 0), (1, 0), 'RIGHT')]))
        story.append(wrapper)

        # Generer PDF med custom canvas
        platform_info = self.platform
        invoice_number = faktura.invoice_number
        def canvas_maker(*args, **kwargs):
            return FakturaCanvas(*args, platform_info=platform_info, invoice_number=invoice_number, **kwargs)

        doc.build(story, canvasmaker=canvas_maker)
        return buffer.getvalue()


# ============ HOVEDFUNKTION ============
def generate_faktura(
    faktura_data: FakturaData,
    customer_info: CustomerInfo,
    platform_info: PlatformInfo = None
) -> bytes:
    generator = FakturaGenerator(platform_info)
    return generator.generate(faktura_data, customer_info)


# ============ TEST ============
if __name__ == "__main__":
    platform = PlatformInfo()

    customer = CustomerInfo(
        company_name="Restaurant Bella Vista ApS",
        cvr="87654321",
        address="Nørrebrogade 45",
        postal_city="2200 København N",
        attention="Martin Jensen"
    )

    faktura = FakturaData(
        invoice_number="2025-0042",
        invoice_date=date(2025, 12, 31),
        payment_terms=PaymentTerms.NET_14,
        order_reference="PO-2025-123",
        lines=[
            InvoiceLine("OrderFlow Professional - Månedligt abonnement", 1, "måned", 799.00),
            InvoiceLine("SMS-pakke (1.000 stk.)", 2, "pakke", 249.00),
            InvoiceLine("Ekstra brugerkonti", 5, "stk", 49.00),
            InvoiceLine("API-kald overskridelse (december)", 15000, "kald", 0.02),
        ]
    )

    pdf_bytes = generate_faktura(faktura, customer, platform)

    output_path = "/Users/martinsarvio/Downloads/OrderFlow-v137/generated_faktura.pdf"
    with open(output_path, "wb") as f:
        f.write(pdf_bytes)

    print(f"Faktura genereret: {output_path}")
    print(f"Total: {fmt_currency(faktura.total_incl_vat)}")
