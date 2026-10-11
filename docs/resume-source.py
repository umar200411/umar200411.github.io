"""Generate Umar Saeed Qureshi's one-page, searchable portfolio resume.

Run with ReportLab installed:
    python docs/resume-source.py

The published PDF is intentionally generated from verified public portfolio
details. Education, employment dates, and exact company titles are omitted
until confirmed.
"""

from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets" / "Umar-Saeed-Qureshi-Resume.pdf"
INK = colors.HexColor("#100c27")
PURPLE = colors.HexColor("#7043de")
MUTED = colors.HexColor("#514b62")
LIME = colors.HexColor("#d7ff64")
RULE = colors.HexColor("#ded9e9")


class ResumeDoc(BaseDocTemplate):
    def __init__(self, filename):
        super().__init__(
            str(filename),
            pagesize=A4,
            leftMargin=17 * mm,
            rightMargin=17 * mm,
            topMargin=15 * mm,
            bottomMargin=14 * mm,
            title="Umar Saeed Qureshi | Flutter & Web Developer",
            author="Umar Saeed Qureshi",
            subject="Professional resume",
        )
        frame = Frame(self.leftMargin, self.bottomMargin, self.width, self.height, id="main")
        self.addPageTemplates(PageTemplate(id="resume", frames=frame, onPage=self.draw_page))

    @staticmethod
    def draw_page(canvas, document):
        canvas.saveState()
        canvas.setFillColor(INK)
        canvas.rect(0, A4[1] - 5 * mm, A4[0], 5 * mm, fill=1, stroke=0)
        canvas.setStrokeColor(RULE)
        canvas.setLineWidth(.5)
        canvas.line(17 * mm, 10 * mm, A4[0] - 17 * mm, 10 * mm)
        canvas.setFont("Helvetica", 7.5)
        canvas.setFillColor(MUTED)
        canvas.drawString(17 * mm, 6.5 * mm, "UMAR SAEED QURESHI  /  PORTFOLIO RESUME")
        canvas.drawRightString(A4[0] - 17 * mm, 6.5 * mm, str(document.page))
        canvas.restoreState()


styles = getSampleStyleSheet()
styles.add(ParagraphStyle(
    name="Name", parent=styles["Title"], fontName="Helvetica-Bold", fontSize=24,
    leading=27, textColor=INK, alignment=TA_LEFT, spaceAfter=2,
))
styles.add(ParagraphStyle(
    name="Role", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=11,
    leading=14, textColor=PURPLE, spaceAfter=5,
))
styles.add(ParagraphStyle(
    name="Contact", parent=styles["Normal"], fontName="Helvetica", fontSize=8.1,
    leading=11, textColor=MUTED,
))
styles.add(ParagraphStyle(
    name="Section", parent=styles["Heading2"], fontName="Helvetica-Bold", fontSize=10,
    leading=12, textColor=PURPLE, spaceBefore=8, spaceAfter=4, keepWithNext=True,
))
styles.add(ParagraphStyle(
    name="BodySmall", parent=styles["BodyText"], fontName="Helvetica", fontSize=8.3,
    leading=11.2, textColor=INK, spaceAfter=2,
))
styles.add(ParagraphStyle(
    name="ProjectTitle", parent=styles["BodyText"], fontName="Helvetica-Bold",
    fontSize=8.8, leading=11, textColor=INK, spaceAfter=1,
))
styles.add(ParagraphStyle(
    name="Tagline", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=7.7,
    leading=10, textColor=INK,
))


def link(label, href):
    return f'<link href="{escape(href)}" color="#7043de">{escape(label)}</link>'


story = []
story.append(Paragraph("Umar Saeed Qureshi", styles["Name"]))
story.append(Paragraph("FLUTTER &amp; WEB DEVELOPER", styles["Role"]))
contact = "Pakistan  ·  " + link("umar@umarsaeedqureshi.com", "mailto:umar@umarsaeedqureshi.com")
contact += "  ·  " + link("Website", "https://umarsaeedqureshi.com/")
contact += "  ·  " + link("GitHub", "https://github.com/umar200411/")
contact += "  ·  " + link("LinkedIn", "https://www.linkedin.com/in/umar-saeed-qureshi-8a6484296/")
story.append(Paragraph(contact, styles["Contact"]))
story.append(Spacer(1, 3 * mm))

def section(title, contents):
    story.append(Paragraph(title.upper(), styles["Section"]))
    story.append(Paragraph(contents, styles["BodySmall"]))


section(
    "Professional Summary",
    "Flutter and web developer experienced in building mobile applications, integrating Firebase and APIs, "
    "and delivering responsive digital products. Independently developed and published Beautify on Google Play "
    "and built the Magnet Masala storefront. Uses modern AI-assisted tools to support iteration, debugging, and "
    "implementation while retaining hands-on technical judgment and responsibility for review.",
)

section(
    "Technical Skills",
    "<b>Mobile:</b> Flutter, Dart, GetX, Provider  &nbsp;&nbsp; <b>Services:</b> Firebase Authentication, "
    "Cloud Firestore, Firebase Cloud Messaging, REST APIs, Google Maps and location services<br/>"
    "<b>Web:</b> Responsive web development, e-commerce interfaces  &nbsp;&nbsp; "
    "<b>Workflow:</b> Git, GitHub, testing and release preparation<br/>"
    "<b>AI-assisted tools:</b> ChatGPT, OpenAI Codex, Claude Code",
)

story.append(Paragraph("SELECTED PROJECTS", styles["Section"]))
projects = [
    [
        Paragraph("Beautify — Flutter Mobile Application", styles["ProjectTitle"]),
        Paragraph(
            "Independently developed and published Android app for salon and beauty-service discovery, "
            "appointment booking, and salon-side service management. Flutter, Dart, Firebase, Google Maps, "
            "and GetX are identified in the project record. "
            + link("Google Play", "https://play.google.com/store/apps/details?id=com.umar.beautify")
            + "  ·  " + link("Case study", "https://umarsaeedqureshi.com/projects/beautify/"),
            styles["BodySmall"],
        ),
    ],
    [
        Paragraph("Magnet Masala — Responsive E-commerce Website", styles["ProjectTitle"]),
        Paragraph(
            "Responsive storefront for a Pakistani spice brand, with product discovery, a basket, and "
            "WhatsApp-based order continuation. Contribution details and implementation stack are not "
            "specified in this resume. "
            + link("Live website", "https://magnetmasala.com/")
            + "  ·  " + link("Case study", "https://umarsaeedqureshi.com/projects/magnet-masala/"),
            styles["BodySmall"],
        ),
    ],
]
doc_width = A4[0] - 34 * mm
project_table = Table(projects, colWidths=[51 * mm, doc_width - 51 * mm], hAlign="LEFT")
project_table.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), colors.white),
    ("BOX", (0, 0), (-1, -1), .5, RULE),
    ("INNERGRID", (0, 0), (-1, -1), .4, RULE),
    ("LEFTPADDING", (0, 0), (-1, -1), 8),
    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ("TOPPADDING", (0, 0), (-1, -1), 6),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
]))
story.append(project_table)

story.append(Paragraph("PROFESSIONAL EXPERIENCE", styles["Section"]))
experience_data = [
    [Paragraph("Zamindar Technologies", styles["ProjectTitle"]), Paragraph("Mobile app development experience. Company product context is shown on the portfolio. " + link("Company website", "https://zamindartech.com/"), styles["BodySmall"])],
    [Paragraph("Token Talent", styles["ProjectTitle"]), Paragraph("Mobile app development experience. ESS product context is shown on the portfolio. " + link("Company website", "https://tokentalent.co/"), styles["BodySmall"])],
]
experience_table = Table(experience_data, colWidths=[39 * mm, doc_width - 39 * mm], hAlign="LEFT")
experience_table.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), colors.white),
    ("BOX", (0, 0), (-1, -1), .5, RULE),
    ("INNERGRID", (0, 0), (-1, -1), .4, RULE),
    ("LEFTPADDING", (0, 0), (-1, -1), 8),
    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ("TOPPADDING", (0, 0), (-1, -1), 6),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
]))
story.append(experience_table)
story.append(Spacer(1, 2 * mm))
story.append(Paragraph(
    "AI-assisted workflow: Engineering-led and AI-accelerated. I use coding assistants to explore solutions, "
    "debug, and refine implementations; code review, testing, and final decisions remain my responsibility.",
    styles["BodySmall"],
))

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
doc = ResumeDoc(OUTPUT)
doc.build(story)
print(OUTPUT)
