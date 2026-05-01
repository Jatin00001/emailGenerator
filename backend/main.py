"""
backend/main.py  –  FastAPI backend for the Email Builder
Gmail-safe HTML: table-based layout, fully inline styles, no flexbox/grid,
no external fonts, no box-shadow, no CSS classes — pastes perfectly into Gmail.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import re, html as html_lib

app = FastAPI(title="Email Builder API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Models ────────────────────────────────────────────────────────────────────

class LineItem(BaseModel):
    text: str
    url: Optional[str] = ""

class Section(BaseModel):
    title: str
    lines: List[LineItem] = []

class EmailPayload(BaseModel):
    subject:     str
    greeting:    str
    intro:       str
    sections:    List[Section] = []
    closing:     Optional[str] = ""
    sender_name: Optional[str] = "The Team"
    recipient:   Optional[str] = ""

# ── Gmail-safe colour palette ─────────────────────────────────────────────────
C = {
    "header_bg":     "#1a73e8",
    "header_text":   "#ffffff",
    "body_bg":       "#f4f6f9",
    "card_bg":       "#ffffff",
    "accent_bar":    "#1a73e8",
    "section_title": "#0000cc",
    "intro_bg":      "#e8f0fe",
    "intro_border":  "#1a73e8",
    "text":          "#202124",
    "muted":         "#5f6368",
    "bullet":        "#1a73e8",
    "btn_bg":        "#1558d6",
    "btn_text":      "#ffffff",
    "divider":       "#e0e0e0",
    "footer_text":   "#9aa0a6",
}

FONT = "Arial, Helvetica, sans-serif"

# ── Helpers ───────────────────────────────────────────────────────────────────

def url_label(url: str) -> str:
    path = url.rstrip("/").split("/")[-1]
    return path.replace("_", " ").replace("-", " ").title() or "View"


def build_button(url: str) -> str:
    label = url_label(url)
    return (
        f'<a href="{url}" target="_blank" '
        f'style="display:inline-block;'
        f'background-color:{C["btn_bg"]};'
        f'color:{C["btn_text"]};'
        f'font-family:{FONT};'
        f'font-size:13px;'
        f'font-weight:bold;'
        f'text-decoration:none;'
        f'padding:9px 20px;'
        f'border-radius:4px;'
        f'mso-padding-alt:0;'
        f'margin-top:8px;'
        f'margin-bottom:4px;">'
        f'&#128279; {label}'
        f'</a>'
    )


def strip_outer_p(html_str: str) -> str:
    s = (html_str or "").strip()
    s = re.sub(r'^<p[^>]*>', '', s)
    s = re.sub(r'</p>$', '', s)
    return s.strip()


# ── Main HTML builder ─────────────────────────────────────────────────────────

def build_html(payload: EmailPayload) -> str:
    rows: List[str] = []

    # 1. Header banner
    rows.append(f"""
    <tr>
      <td bgcolor="{C['header_bg']}"
          style="background-color:{C['header_bg']};padding:28px 36px 24px 36px;">
        <p style="margin:0;font-family:{FONT};font-size:20px;font-weight:bold;
                  color:{C['header_text']};line-height:1.3;">
          {payload.subject}
        </p>
      </td>
    </tr>""")

    # 2. Greeting
    if payload.greeting:
        rows.append(f"""
    <tr>
      <td style="padding:24px 36px 0 36px;">
        <p style="margin:0;font-family:{FONT};font-size:16px;font-weight:bold;
                  color:{C['text']};line-height:1.5;">
          {payload.greeting}
        </p>
      </td>
    </tr>""")

    # 3. Intro block
    if payload.intro:
        intro_text = strip_outer_p(payload.intro)
        rows.append(f"""
    <tr>
      <td style="padding:12px 36px 20px 36px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="4" bgcolor="{C['intro_border']}"
                style="background-color:{C['intro_border']};border-radius:2px;"></td>
            <td bgcolor="{C['intro_bg']}"
                style="background-color:{C['intro_bg']};padding:12px 16px;">
              <p style="margin:0;font-family:{FONT};font-size:14px;
                        color:{C['text']};line-height:1.75;">
                {intro_text}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>""")

    # 4. Sections
    for section in payload.sections:
        has_title = bool(section.title and section.title.strip())
        has_lines = any(l.text.strip() or l.url for l in section.lines)
        if not has_title and not has_lines:
            continue

        if has_title:
            rows.append(f"""
    <tr>
      <td style="padding:20px 36px 6px 36px;">
        <table cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="5" bgcolor="{C['accent_bar']}"
                style="background-color:{C['accent_bar']};border-radius:3px;
                       font-size:1px;line-height:1px;">&nbsp;</td>
            <td style="padding-left:10px;">
              <p style="margin:0;font-family:{FONT};font-size:15px;font-weight:bold;
                        color:{C['section_title']};line-height:1.4;">
                {section.title}:
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>""")

        for line in section.lines:
            text = strip_outer_p(line.text)
            url  = (line.url or "").strip()
            if not text and not url:
                continue
            btn_html = f"<br>{build_button(url)}" if url else ""
            rows.append(f"""
    <tr>
      <td style="padding:3px 36px 3px 52px;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td width="14" valign="top"
                style="padding-top:6px;padding-right:8px;">
              <p style="margin:0;font-family:{FONT};font-size:16px;
                        color:{C['bullet']};line-height:1;">&#8226;</p>
            </td>
            <td valign="top"
                style="font-family:{FONT};font-size:14px;
                       color:{C['text']};line-height:1.75;">
              {text}{btn_html}
            </td>
          </tr>
        </table>
      </td>
    </tr>""")

    # 5. Closing
    if payload.closing and payload.closing.strip():
        closing_text = strip_outer_p(payload.closing)
        rows.append(f"""
    <tr>
      <td style="padding:18px 36px 4px 36px;">
        <p style="margin:0;font-family:{FONT};font-size:14px;
                  color:{C['text']};line-height:1.75;">
          {closing_text}
        </p>
      </td>
    </tr>""")

    # 6. Divider + footer
    rows.append(f"""
    <tr>
      <td style="padding:24px 36px 0 36px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td bgcolor="{C['divider']}" height="1"
                style="background-color:{C['divider']};font-size:1px;line-height:1px;"></td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:18px 36px 28px 36px;">
        <p style="margin:0;font-family:{FONT};font-size:13px;
                  color:{C['footer_text']};line-height:1.7;">
          Best regards,<br>
          <span style="font-weight:bold;color:{C['muted']};font-size:14px;">
            {payload.sender_name}
          </span>
        </p>
      </td>
    </tr>""")

    body = "\n".join(rows)

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{payload.subject}</title>
</head>
<body style="margin:0;padding:0;background-color:{C['body_bg']};">
  <!--[if mso]>
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr><td align="center">
  <![endif]-->
  <table align="center" width="600" cellpadding="0" cellspacing="0" border="0"
         style="width:600px;max-width:600px;background-color:{C['card_bg']};
                border-collapse:collapse;margin:32px auto;">
{body}
  </table>
  <!--[if mso]>
  </td></tr></table>
  <![endif]-->
</body>
</html>"""


# ── Routes ────────────────────────────────────────────────────────────────────

@app.post("/build-email")
async def build_email(payload: EmailPayload):
    html = build_html(payload)
    return {"html": html, "subject": payload.subject, "recipient": payload.recipient}


@app.get("/health")
async def health():
    return {"status": "ok"}
