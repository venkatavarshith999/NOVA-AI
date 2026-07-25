"""PDF and Markdown export for Nova AI reports."""
import io
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch


def generate_pdf(report_dict: dict) -> bytes:
    """Generate a professional PDF from a Nova AI report dict."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.75 * inch, bottomMargin=0.75 * inch)
    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle('NovaTitle', parent=styles['Title'], fontSize=22, spaceAfter=6,
                                  textColor=colors.HexColor('#2563EB'))
    heading_style = ParagraphStyle('NovaHeading', parent=styles['Heading2'], fontSize=14,
                                    textColor=colors.HexColor('#1E293B'), spaceBefore=14, spaceAfter=6)
    normal_style = styles['Normal']

    STATUS_COLORS = {
        'verified': colors.HexColor('#16A34A'),
        'partially_verified': colors.HexColor('#D97706'),
        'not_verified': colors.HexColor('#DC2626'),
    }

    elements = []

    # Title
    elements.append(Paragraph('Nova AI Research Report', title_style))
    elements.append(Spacer(1, 6))

    # Query
    query = report_dict.get('query', 'N/A')
    elements.append(Paragraph(f'<b>Research Query:</b> {query}', normal_style))
    elements.append(Spacer(1, 12))

    # Stats
    stats = report_dict.get('stats', {})
    if stats:
        stats_text = (
            f"<b>Total Claims:</b> {stats.get('total_claims', 0)} | "
            f"<b>Verified:</b> {stats.get('verified', 0)} | "
            f"<b>Partially Verified:</b> {stats.get('partially_verified', 0)} | "
            f"<b>Not Verified:</b> {stats.get('not_verified', 0)} | "
            f"<b>Avg Confidence:</b> {stats.get('avg_confidence', 0)}%"
        )
        elements.append(Paragraph(stats_text, normal_style))
        elements.append(Spacer(1, 12))

    # Executive Summary
    elements.append(Paragraph('Executive Summary', heading_style))
    elements.append(Paragraph(report_dict.get('executive_summary', ''), normal_style))
    elements.append(Spacer(1, 12))

    # Claims Table
    claims = report_dict.get('claims', [])
    if claims:
        elements.append(Paragraph('Claims Analysis', heading_style))
        data = [['#', 'Claim', 'Status', 'Confidence']]
        for i, c in enumerate(claims):
            verification = c.get('verification', {})
            confidence = c.get('confidence', {})
            status = verification.get('status', 'unknown').replace('_', ' ').title()
            score = f"{confidence.get('score', 0)}%"
            text = c.get('text', '')[:80]
            data.append([str(i + 1), text, status, score])

        col_widths = [30, 280, 100, 70]
        t = Table(data, colWidths=col_widths)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2563EB')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('ALIGN', (0, 0), (0, -1), 'CENTER'),
            ('ALIGN', (3, 0), (3, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#F8FAFC')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#F8FAFC'), colors.white]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ]))
        elements.append(t)
        elements.append(Spacer(1, 12))

    # Hallucination Alerts
    hallucinations = report_dict.get('hallucinations', [])
    if hallucinations:
        elements.append(Paragraph('⚠ Hallucination Alerts', heading_style))
        for h in hallucinations:
            claim_text = h.get('claim_text', '')
            reason = h.get('reason', '')
            severity = h.get('severity', 'unknown').upper()
            elements.append(Paragraph(
                f'<font color="#DC2626"><b>[{severity}]</b></font> {claim_text} — <i>{reason}</i>',
                normal_style
            ))
        elements.append(Spacer(1, 12))

    # Conclusion
    elements.append(Paragraph('Conclusion', heading_style))
    elements.append(Paragraph(report_dict.get('conclusion', ''), normal_style))
    elements.append(Spacer(1, 12))

    # Sources
    sources = report_dict.get('sources', [])
    if sources:
        elements.append(Paragraph('Sources', heading_style))
        for s in sources:
            title = s.get('title', 'Unknown')
            url = s.get('url', '')
            elements.append(Paragraph(f'• <b>{title}</b> — <a href="{url}">{url}</a>', normal_style))

    # Footer
    elements.append(Spacer(1, 24))
    footer_style = ParagraphStyle('Footer', parent=normal_style, fontSize=8, textColor=colors.grey)
    elements.append(Paragraph('Generated by Nova AI — Autonomous Multi-Agent Research & Fact Verification', footer_style))

    doc.build(elements)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes


def generate_markdown(report_dict: dict) -> str:
    """Generate formatted Markdown from a Nova AI report dict."""
    lines = []
    lines.append("# Nova AI Research Report\n")
    lines.append(f"**Query:** {report_dict.get('query', 'N/A')}\n")

    # Stats
    stats = report_dict.get('stats', {})
    if stats:
        lines.append("## Summary Statistics")
        lines.append(f"| Metric | Value |")
        lines.append(f"|--------|-------|")
        lines.append(f"| Total Claims | {stats.get('total_claims', 0)} |")
        lines.append(f"| Verified | {stats.get('verified', 0)} |")
        lines.append(f"| Partially Verified | {stats.get('partially_verified', 0)} |")
        lines.append(f"| Not Verified | {stats.get('not_verified', 0)} |")
        lines.append(f"| Avg Confidence | {stats.get('avg_confidence', 0)}% |")
        lines.append(f"| Total Sources | {stats.get('total_sources', 0)} |")
        lines.append("")

    # Executive Summary
    lines.append("## Executive Summary")
    lines.append(f"{report_dict.get('executive_summary', '')}\n")

    # Claims
    claims = report_dict.get('claims', [])
    if claims:
        lines.append("## Claims Analysis")
        for i, c in enumerate(claims):
            verification = c.get('verification', {})
            confidence = c.get('confidence', {})
            status = verification.get('status', 'unknown')
            emoji = "✅" if status == "verified" else "⚠️" if status == "partially_verified" else "❌"
            score = confidence.get('score', 0)
            lines.append(f"### {emoji} Claim {i + 1}")
            lines.append(f"**{c.get('text', '')}**\n")
            lines.append(f"- Status: {status.replace('_', ' ').title()}")
            lines.append(f"- Confidence: {score}%")
            reason = verification.get('reason', '')
            if reason:
                lines.append(f"- Reason: {reason}")
            sources_list = c.get('source_urls', [])
            if sources_list:
                lines.append(f"- Sources: {', '.join(sources_list)}")
            lines.append("")

    # Hallucination Alerts
    hallucinations = report_dict.get('hallucinations', [])
    if hallucinations:
        lines.append("## ⚠ Hallucination Alerts")
        for h in hallucinations:
            severity = h.get('severity', 'unknown').upper()
            lines.append(f"- **[{severity}]** {h.get('claim_text', '')} — {h.get('reason', '')}")
        lines.append("")

    # Conclusion
    lines.append("## Conclusion")
    lines.append(f"{report_dict.get('conclusion', '')}\n")

    # Sources
    sources = report_dict.get('sources', [])
    if sources:
        lines.append("## Sources")
        for s in sources:
            title = s.get('title', 'Unknown')
            url = s.get('url', '')
            name = s.get('source_name', '')
            lines.append(f"- [{title}]({url}) — {name}")

    lines.append("\n---\n*Generated by Nova AI — Autonomous Multi-Agent Research & Fact Verification*")

    return "\n".join(lines)
