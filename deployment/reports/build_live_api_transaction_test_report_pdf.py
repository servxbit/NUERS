from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    KeepTogether,
    PageBreak,
    Paragraph,
    Preformatted,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


OUT_DIR = Path(__file__).resolve().parent
PDF_PATH = OUT_DIR / "NUERS_Live_API_Transaction_Test_Report.pdf"

BLUE = colors.HexColor("#2E74B5")
DARK_BLUE = colors.HexColor("#1F4D78")
INK = colors.HexColor("#111827")
MUTED = colors.HexColor("#4B5563")
LIGHT_BLUE = colors.HexColor("#E8EEF5")
LIGHT_GRAY = colors.HexColor("#F2F4F7")
GREEN_FILL = colors.HexColor("#EEF7EE")
GREEN = colors.HexColor("#166534")
BORDER = colors.HexColor("#DADCE0")
CODE_FILL = colors.HexColor("#F8FAFC")


def styles():
    base = getSampleStyleSheet()
    base.add(ParagraphStyle(
        name="ReportTitle",
        parent=base["Title"],
        fontName="Helvetica-Bold",
        fontSize=24,
        leading=28,
        textColor=DARK_BLUE,
        alignment=TA_LEFT,
        spaceAfter=4,
    ))
    base.add(ParagraphStyle(
        name="Subtitle",
        parent=base["Normal"],
        fontName="Helvetica",
        fontSize=10.5,
        leading=14,
        textColor=MUTED,
        spaceAfter=14,
    ))
    base.add(ParagraphStyle(
        name="Body",
        parent=base["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=13,
        textColor=INK,
        spaceAfter=7,
    ))
    base.add(ParagraphStyle(
        name="H1",
        parent=base["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=15,
        leading=18,
        textColor=BLUE,
        spaceBefore=14,
        spaceAfter=8,
    ))
    base.add(ParagraphStyle(
        name="H2",
        parent=base["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=15,
        textColor=DARK_BLUE,
        spaceBefore=10,
        spaceAfter=6,
    ))
    base.add(ParagraphStyle(
        name="Cell",
        parent=base["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=11,
        textColor=INK,
    ))
    base.add(ParagraphStyle(
        name="CellBold",
        parent=base["Cell"],
        fontName="Helvetica-Bold",
        textColor=DARK_BLUE,
    ))
    base.add(ParagraphStyle(
        name="Footer",
        parent=base["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=10,
        textColor=MUTED,
        alignment=TA_RIGHT,
    ))
    base.add(ParagraphStyle(
        name="CodeBlock",
        parent=base["Code"],
        fontName="Courier",
        fontSize=7.8,
        leading=9.5,
        textColor=INK,
        leftIndent=2,
        rightIndent=2,
    ))
    return base


S = styles()


def p(text, style="Body"):
    return Paragraph(text, S[style])


def kv_table(rows):
    data = [[p(label, "CellBold"), p(value, "Cell")] for label, value in rows]
    table = Table(data, colWidths=[1.65 * inch, 4.85 * inch], hAlign="LEFT")
    table.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
        ("BACKGROUND", (0, 0), (0, -1), LIGHT_BLUE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return table


def matrix(headers, rows, widths):
    data = [[p(header, "CellBold") for header in headers]]
    for row in rows:
        data.append([p(str(value), "Cell") for value in row])
    table = Table(data, colWidths=[w * inch for w in widths], hAlign="LEFT", repeatRows=1)
    table.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
        ("BACKGROUND", (0, 0), (-1, 0), LIGHT_BLUE),
        ("BACKGROUND", (0, 1), (0, -1), LIGHT_GRAY),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return table


def callout(title, body):
    content = [[Paragraph(f"<b>{title}</b><br/>{body}", ParagraphStyle(
        name="CalloutText",
        parent=S["Body"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=12.5,
        textColor=INK,
        spaceAfter=0,
    ))]]
    table = Table(content, colWidths=[6.5 * inch], hAlign="LEFT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), GREEN_FILL),
        ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#BBE0C0")),
        ("LEFTPADDING", (0, 0), (-1, -1), 9),
        ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    return table


def code_block(text):
    table = Table([[Preformatted(text, S["CodeBlock"])]], colWidths=[6.5 * inch], hAlign="LEFT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), CODE_FILL),
        ("BOX", (0, 0), (-1, -1), 0.5, BORDER),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    return table


def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(MUTED)
    canvas.drawRightString(7.5 * inch, 0.55 * inch, f"NUERS Live API Transaction Test Report | Page {doc.page}")
    canvas.restoreState()


def build():
    doc = SimpleDocTemplate(
        str(PDF_PATH),
        pagesize=LETTER,
        rightMargin=1 * inch,
        leftMargin=1 * inch,
        topMargin=0.85 * inch,
        bottomMargin=0.85 * inch,
        title="NUERS Live API Transaction Test Report",
        author="Codex",
    )

    story = []
    story.append(p("NUERS Live API Transaction Test Report", "ReportTitle"))
    story.append(p("Successful production API insertion and verification for the Business Account integration endpoint", "Subtitle"))
    story.append(kv_table([
        ("Live site", "https://nuers.net"),
        ("API endpoint tested", "POST https://nuers.net/public/api/integrations/transactions"),
        ("Business Account", "Servxbit I.T Solutions"),
        ("Test date", "June 3, 2026, Asia/Manila"),
        ("Prepared by", "Codex API test run"),
        ("Security note", "No API secret, bearer token, or password is included in this report."),
    ]))
    story.append(Spacer(1, 12))
    story.append(callout(
        "Executive result",
        "The live NUERS transaction API accepted a marked production test transaction with HTTP 201. The inserted transaction and generated receipt were both verified through the live merchant APIs. The temporary API key created for the test was revoked and confirmed inactive.",
    ))

    story.append(p("1. Test Scope", "H1"))
    story.append(p("The test validated that a Business Account API key with the transactions:write scope can insert a live transaction through the NUERS integration endpoint, and that the resulting transaction and receipt appear through the authenticated merchant APIs."))
    story.append(p("This was a production test. The record is intentionally marked so it can be found, excluded from analysis, or removed later if required."))

    story.append(p("2. API Contract Used", "H1"))
    story.append(kv_table([
        ("Method", "POST"),
        ("URL", "https://nuers.net/public/api/integrations/transactions"),
        ("Authentication", "X-NUERS-API-Key header"),
        ("Required fields used", "external_reference, gross_amount, tax_type"),
        ("Tax setup", "vatable, 12 percent VAT rate, VAT inclusive"),
        ("Temporary key handling", "Created for the test, used once, then revoked."),
    ]))

    story.append(p("3. Submitted Payload", "H1"))
    story.append(p("The following payload was submitted. The API key itself is intentionally omitted."))
    story.append(code_block("""{
  "external_reference": "CODEX-LIVE-API-TEST-B21DF9A8",
  "source_system": "codex_live_api_test",
  "channel": "api_test",
  "transaction_type": "sale",
  "payment_method": "cash",
  "document_type": "sales_invoice",
  "gross_amount": 123.45,
  "tax_type": "vatable",
  "vat_rate": 12,
  "vat_inclusive": true,
  "customer_name": "Codex Live API Test Buyer",
  "customer_tin": "000-000-000-000",
  "branch_code": "MAIN",
  "branch_name": "Main Office",
  "branch_type": "main",
  "items": [
    {
      "description": "Codex live API test item",
      "quantity": 1,
      "unit_price": 123.45
    }
  ]
}"""))

    story.append(PageBreak())
    story.append(p("4. API Response", "H1"))
    story.append(matrix(["Field", "Observed value", "Result"], [
        ("HTTP status", "201 Created", "Passed"),
        ("Duplicate flag", "No duplicate response was returned", "Passed"),
        ("Transaction ID", "429bd850-0318-437c-9fde-363d63ac6c66", "Passed"),
        ("Receipt number", "VI-20260603-WQEBLQC1", "Passed"),
    ], [1.45, 3.75, 1.3]))

    story.append(p("5. Verification Evidence", "H1"))
    story.append(matrix(["Verification check", "Live endpoint / signal", "Observed result"], [
        ("Merchant transaction lookup", "/public/api/merchant/transactions?search=CODEX-LIVE-API-TEST-B21DF9A8", "1 matching row found"),
        ("Merchant receipt lookup", "/public/api/merchant/receipts?search=VI-20260603-WQEBLQC1", "1 matching row found"),
        ("Temporary API key cleanup", "/public/api/merchant/api-keys", "Status revoked, active no"),
    ], [1.85, 3.25, 1.4]))

    story.append(p("6. Security and Cleanup", "H1"))
    story.append(p("The full API secret was available only immediately after key creation and was not written into this report. Temporary local response files containing tokens or secrets were deleted after the test."))
    story.append(p("The temporary live API key was revoked after the transaction was verified. Read-only verification confirmed that its status is revoked and active is no."))

    story.append(p("7. Operational Notes", "H1"))
    story.append(matrix(["Item", "Value"], [
        ("Record classification", "Production test transaction"),
        ("External reference", "CODEX-LIVE-API-TEST-B21DF9A8"),
        ("Gross amount", "PHP 123.45"),
        ("Recommended handling", "Keep for audit trail, or filter by external_reference/source_system in reports if test records should be excluded."),
        ("Code changes required", "None for transaction insertion. The live API accepted and persisted the transaction successfully."),
    ], [1.8, 4.7]))

    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    print(PDF_PATH)


if __name__ == "__main__":
    build()
