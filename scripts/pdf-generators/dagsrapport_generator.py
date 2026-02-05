"""
OrderFlow Dagsrapport Generator
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
from datetime import datetime, date, time
from typing import Dict, List, Optional
from dataclasses import dataclass, field
from enum import Enum

# ============ FARVER ============
PRIMARY_COLOR = HexColor("#1a1a2e")
ACCENT_COLOR = HexColor("#0f3460")
MEDIUM_GRAY = HexColor("#e0e0e0")
LIGHT_GRAY = HexColor("#f8f9fa")
TEXT_COLOR = HexColor("#333333")
HEADER_BLUE = HexColor("#1a365d")

# ============ DATA KLASSER ============
@dataclass
class PlatformInfo:
    company_name: str = "Ordreflow SaaS"
    address: str = "Vestergade 12"
    postal_city: str = "2100 København Ø"
    cvr: str = "12345678"

@dataclass
class CustomerInfo:
    company_name: str
    cvr: str
    address: str
    postal_city: str

@dataclass
class PaymentBreakdown:
    cash_sale: float = 0.0
    cash_revenue: float = 0.0
    card_sale: float = 0.0
    card_revenue: float = 0.0
    surcharge: float = 0.0
    tips: float = 0.0

    @property
    def cash_total(self) -> float:
        return self.cash_revenue

    @property
    def card_total(self) -> float:
        return self.card_revenue + self.surcharge + self.tips

@dataclass
class DagsrapportData:
    report_date: date
    opened_time: datetime
    closed_time: datetime
    opened_by: str
    document_number: str
    gross_revenue: float
    discounts: float
    total_revenue: float
    vat_collected: float
    sale_excl_vat: float
    payment_breakdown: PaymentBreakdown

    @property
    def net_amount(self) -> float:
        return self.sale_excl_vat

    @property
    def vat_amount(self) -> float:
        return self.vat_collected

    @property
    def gross_amount(self) -> float:
        return self.total_revenue

# ============ HJÆLPEFUNKTIONER ============
def fmt_currency(amount: float) -> str:
    return f"{amount:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".") + " DKK"

def fmt_date(d: date) -> str:
    return d.strftime("%d.%m.%Y")

def fmt_datetime(dt: datetime) -> str:
    return dt.strftime("%d.%m.%Y, %H:%M")

# ============ CANVAS MED SIDEFOD ============
class DagsrapportCanvas(canvas.Canvas):
    def __init__(self, *args, platform_info: PlatformInfo = None, **kwargs):
        canvas.Canvas.__init__(self, *args, **kwargs)
        self._saved_page_states = []
        self.platform_info = platform_info or PlatformInfo()

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_footer(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_footer(self, page_count):
        page_width, page_height = A4
        p = self.platform_info

        # Firmainfo linje
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.gray)
        footer_text = f"{p.company_name} • {p.address}, {p.postal_city} • CVR: {p.cvr}"
        self.drawCentredString(page_width / 2, 10*mm, footer_text)

        # Side X af Y
        self.setFont("Helvetica", 8)
        page_text = f"Side {self._pageNumber} af {page_count}"
        self.drawCentredString(page_width / 2, 5*mm, page_text)

# ============ PDF GENERATOR ============
class DagsrapportGenerator:

    def __init__(self, platform_info: PlatformInfo = None):
        self.platform = platform_info or PlatformInfo()
        self.page_width = A4[0] - 40*mm

    def generate(self, rapport: DagsrapportData, customer: CustomerInfo) -> bytes:
        buffer = BytesIO()

        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=20*mm,
            rightMargin=20*mm,
            topMargin=20*mm,
            bottomMargin=20*mm
        )

        story = []
        p = self.platform

        # ========== HEADER ==========
        left_header = Paragraph(
            f"""<font size="28"><b>DAGSRAPPORT</b></font><br/>
<font size="11">{p.company_name}</font>""",
            ParagraphStyle('LH', fontSize=11, leading=16, textColor=TEXT_COLOR)
        )

        right_header = Paragraph(
            f"""<font size="11"><b>{fmt_date(rapport.report_date)}</b></font><br/>
<font size="10"><b>{customer.company_name}</b></font><br/>
<font size="9">{customer.address}<br/>
{customer.postal_city}<br/>
CVR: {customer.cvr}</font>""",
            ParagraphStyle('RH', fontSize=9, leading=11, alignment=TA_RIGHT, textColor=TEXT_COLOR)
        )

        header_table = Table([[left_header, right_header]], colWidths=[self.page_width*0.5, self.page_width*0.5])
        header_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        story.append(header_table)
        story.append(Spacer(1, 4*mm))

        # Linje
        line = Table([['']], colWidths=[self.page_width])
        line.setStyle(TableStyle([('LINEBELOW', (0, 0), (-1, -1), 2, PRIMARY_COLOR)]))
        story.append(line)
        story.append(Spacer(1, 6*mm))

        # ========== DETALJER SEKTION ==========
        story.append(Paragraph("<font size='14'><b>Detaljer</b></font>",
            ParagraphStyle('SectionHeader', fontSize=14, leading=16, textColor=TEXT_COLOR)))
        story.append(Spacer(1, 3*mm))

        story.append(Paragraph("<font size='10' color='#1a365d'><b>Oversigt</b></font>",
            ParagraphStyle('SubHeader', fontSize=10, leading=12, textColor=HEADER_BLUE)))
        story.append(Spacer(1, 2*mm))

        detail_data = [
            ['Åbnet', fmt_datetime(rapport.opened_time)],
            ['Lukket', fmt_datetime(rapport.closed_time)],
            ['Åbnet af', rapport.opened_by],
            ['Dokumentnummer', rapport.document_number],
        ]

        detail_table = Table(detail_data, colWidths=[self.page_width*0.3, self.page_width*0.7])
        detail_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('TEXTCOLOR', (0, 0), (-1, -1), TEXT_COLOR),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('TOPPADDING', (0, 0), (-1, -1), 2*mm),
            ('BOTTOMPADDING', (0, 0), (-1, -2), 2*mm),
            ('BOTTOMPADDING', (0, -1), (-1, -1), 3*mm),
            ('LINEBELOW', (0, 0), (-1, -2), 0.5, MEDIUM_GRAY),
            ('LINEBELOW', (0, -1), (-1, -1), 2, PRIMARY_COLOR),
        ]))
        story.append(detail_table)
        story.append(Spacer(1, 8*mm))

        # ========== SALGSOVERSIGT ==========
        story.append(Paragraph("<font size='14'><b>Salgsoversigt</b></font>",
            ParagraphStyle('SectionHeader', fontSize=14, leading=16, textColor=TEXT_COLOR)))
        story.append(Spacer(1, 3*mm))

        story.append(Paragraph("<font size='10' color='#1a365d'><b>Oversigt</b></font>",
            ParagraphStyle('SubHeader', fontSize=10, leading=12, textColor=HEADER_BLUE)))
        story.append(Spacer(1, 2*mm))

        sales_data = [
            ['Bruttoomsætning', fmt_currency(rapport.gross_revenue)],
            ['Rabatter', fmt_currency(rapport.discounts)],
            ['Totalomsætning', fmt_currency(rapport.total_revenue)],
            ['Moms opkrævet', fmt_currency(rapport.vat_collected)],
            ['Salg ekskl. moms', fmt_currency(rapport.sale_excl_vat)],
        ]

        sales_table = Table(sales_data, colWidths=[self.page_width*0.3, self.page_width*0.7])
        sales_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('TEXTCOLOR', (0, 0), (-1, -1), TEXT_COLOR),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('TOPPADDING', (0, 0), (-1, -1), 2*mm),
            ('BOTTOMPADDING', (0, 0), (-1, -2), 2*mm),
            ('BOTTOMPADDING', (0, -1), (-1, -1), 3*mm),
            ('LINEBELOW', (0, 0), (-1, -2), 0.5, MEDIUM_GRAY),
            ('LINEBELOW', (0, -1), (-1, -1), 2, PRIMARY_COLOR),
        ]))
        story.append(sales_table)

        # Start ny side for betalingsfordeling
        story.append(Spacer(1, 10*mm))

        # ========== BETALINGSFORDELING ==========
        story.append(Paragraph("<font size='14'><b>Betalingsfordeling</b></font>",
            ParagraphStyle('SectionHeader', fontSize=14, leading=16, textColor=TEXT_COLOR)))
        story.append(Spacer(1, 3*mm))

        # Kontant
        story.append(Paragraph("<font size='10' color='#1a365d'><b>Kontant</b></font>",
            ParagraphStyle('SubHeader', fontSize=10, leading=12, textColor=HEADER_BLUE)))
        story.append(Spacer(1, 2*mm))

        cash_data = [
            ['Salg', fmt_currency(rapport.payment_breakdown.cash_sale)],
            ['Omsætning', fmt_currency(rapport.payment_breakdown.cash_revenue)],
            ['Total', fmt_currency(rapport.payment_breakdown.cash_total)],
        ]

        cash_table = Table(cash_data, colWidths=[self.page_width*0.3, self.page_width*0.7])
        cash_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('TEXTCOLOR', (0, 0), (-1, -1), TEXT_COLOR),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('TOPPADDING', (0, 0), (-1, -1), 2*mm),
            ('BOTTOMPADDING', (0, 0), (-1, -2), 2*mm),
            ('BOTTOMPADDING', (0, -1), (-1, -1), 3*mm),
            ('LINEBELOW', (0, 0), (-1, -2), 0.5, MEDIUM_GRAY),
            ('LINEBELOW', (0, -1), (-1, -1), 2, PRIMARY_COLOR),
        ]))
        story.append(cash_table)
        story.append(Spacer(1, 6*mm))

        # Kort
        story.append(Paragraph("<font size='10' color='#1a365d'><b>Kort</b></font>",
            ParagraphStyle('SubHeader', fontSize=10, leading=12, textColor=HEADER_BLUE)))
        story.append(Spacer(1, 2*mm))

        card_data = [
            ['Salg', fmt_currency(rapport.payment_breakdown.card_sale)],
            ['Omsætning', fmt_currency(rapport.payment_breakdown.card_revenue)],
            ['Surcharge', fmt_currency(rapport.payment_breakdown.surcharge)],
            ['Drikkepenge', fmt_currency(rapport.payment_breakdown.tips)],
            ['Total', fmt_currency(rapport.payment_breakdown.card_total)],
        ]

        card_table = Table(card_data, colWidths=[self.page_width*0.3, self.page_width*0.7])
        card_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('TEXTCOLOR', (0, 0), (-1, -1), TEXT_COLOR),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('TOPPADDING', (0, 0), (-1, -1), 2*mm),
            ('BOTTOMPADDING', (0, 0), (-1, -2), 2*mm),
            ('BOTTOMPADDING', (0, -1), (-1, -1), 3*mm),
            ('LINEBELOW', (0, 0), (-1, -2), 0.5, MEDIUM_GRAY),
            ('LINEBELOW', (0, -1), (-1, -1), 2, PRIMARY_COLOR),
        ]))
        story.append(card_table)
        story.append(Spacer(1, 8*mm))

        # ========== MOMSSPECIFIKATION ==========
        story.append(Paragraph("<font size='14'><b>Momsspecifikation</b></font>",
            ParagraphStyle('SectionHeader', fontSize=14, leading=16, textColor=TEXT_COLOR)))
        story.append(Spacer(1, 3*mm))

        story.append(Paragraph("<font size='10' color='#1a365d'><b>Rate: 25%</b></font>",
            ParagraphStyle('SubHeader', fontSize=10, leading=12, textColor=HEADER_BLUE)))
        story.append(Spacer(1, 2*mm))

        vat_data = [
            ['Net', fmt_currency(rapport.net_amount)],
            ['Moms', fmt_currency(rapport.vat_amount)],
            ['Brutto', fmt_currency(rapport.gross_amount)],
        ]

        vat_table = Table(vat_data, colWidths=[self.page_width*0.3, self.page_width*0.7])
        vat_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('TEXTCOLOR', (0, 0), (-1, -1), TEXT_COLOR),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('TOPPADDING', (0, 0), (-1, -1), 2*mm),
            ('BOTTOMPADDING', (0, 0), (-1, -2), 2*mm),
            ('BOTTOMPADDING', (0, -1), (-1, -1), 3*mm),
            ('LINEBELOW', (0, 0), (-1, -2), 0.5, MEDIUM_GRAY),
            ('LINEBELOW', (0, -1), (-1, -1), 2, PRIMARY_COLOR),
        ]))
        story.append(vat_table)
        story.append(Spacer(1, 8*mm))

        # ========== TOTAL ==========
        story.append(Paragraph("<font size='14'><b>Total</b></font>",
            ParagraphStyle('SectionHeader', fontSize=14, leading=16, textColor=TEXT_COLOR)))
        story.append(Spacer(1, 2*mm))

        total_data = [
            ['Nettobeløb', fmt_currency(rapport.net_amount)],
            ['Momsbeløb', fmt_currency(rapport.vat_amount)],
            ['Bruttobeløb', fmt_currency(rapport.gross_amount)],
        ]

        total_table = Table(total_data, colWidths=[self.page_width*0.3, self.page_width*0.7])
        total_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('TEXTCOLOR', (0, 0), (-1, -1), TEXT_COLOR),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('TOPPADDING', (0, 0), (-1, -1), 2*mm),
            ('BOTTOMPADDING', (0, 0), (-1, -2), 2*mm),
            ('BOTTOMPADDING', (0, -1), (-1, -1), 3*mm),
            ('LINEBELOW', (0, 0), (-1, -2), 0.5, MEDIUM_GRAY),
            ('LINEBELOW', (0, -1), (-1, -1), 2, PRIMARY_COLOR),
        ]))
        story.append(total_table)

        # Generer PDF med custom canvas
        platform_info = self.platform
        def canvas_maker(*args, **kwargs):
            return DagsrapportCanvas(*args, platform_info=platform_info, **kwargs)

        doc.build(story, canvasmaker=canvas_maker)
        return buffer.getvalue()


# ============ HOVEDFUNKTION ============
def generate_dagsrapport(
    rapport_data: DagsrapportData,
    customer_info: CustomerInfo,
    platform_info: PlatformInfo = None
) -> bytes:
    generator = DagsrapportGenerator(platform_info)
    return generator.generate(rapport_data, customer_info)


# ============ TEST ============
if __name__ == "__main__":
    platform = PlatformInfo()

    customer = CustomerInfo(
        company_name="Restaurant Bella Vista ApS",
        cvr="87654321",
        address="Nørrebrogade 45",
        postal_city="2200 København N"
    )

    payment = PaymentBreakdown(
        cash_sale=48140.24,
        cash_revenue=48140.24,
        card_sale=389056.76,
        card_revenue=389056.76,
        surcharge=624.24,
        tips=121.24
    )

    rapport = DagsrapportData(
        report_date=date(2025, 12, 31),
        opened_time=datetime(2025, 12, 31, 8, 14),
        closed_time=datetime(2025, 12, 31, 21, 14),
        opened_by="Medarbejder / Medarbejder",
        document_number="DOC-2025-524408",
        gross_revenue=438412.24,
        discounts=1215.24,
        total_revenue=437197.00,
        vat_collected=87439.40,
        sale_excl_vat=349757.60,
        payment_breakdown=payment
    )

    pdf_bytes = generate_dagsrapport(rapport, customer, platform)

    output_path = "/Users/martinsarvio/Downloads/OrderFlow-v137/generated_dagsrapport.pdf"
    with open(output_path, "wb") as f:
        f.write(pdf_bytes)

    print(f"Dagsrapport genereret: {output_path}")
    print(f"Total omsætning: {fmt_currency(rapport.total_revenue)}")
