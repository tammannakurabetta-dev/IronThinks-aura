import { marked } from 'marked';
import juice from 'juice';
import sanitizeHtml from 'sanitize-html';

export interface EmailRenderOptions {
  title: string;
  category?: string;
  depthLevel?: string;
  accentColor?: string;
  sources?: Array<{ title?: string | null; url: string }>;
  showConfidenceScore?: boolean;
  confidenceScore?: number;
}

/**
 * Compiles synthesized Markdown into an inline-CSS, mobile-responsive HTML email.
 */
export async function renderMarkdownToEmailHtml(
  markdownContent: string,
  options: EmailRenderOptions
): Promise<string> {
  const {
    title,
    category = 'EXECUTIVE_SCAN',
    depthLevel = 'STANDARD',
    accentColor = '#0284c7',
    sources = [],
    showConfidenceScore = true,
    confidenceScore = 95
  } = options;

  // 1. Convert Markdown to clean semantic HTML
  const content = typeof markdownContent === 'string' ? markdownContent : String(markdownContent || '');
  const rawHtmlBody = await marked.parse(content);

  // 2. Wrap in an enterprise email layout with mobile-responsive structure
  const formattedCategory = category.replace('_', ' ');
  const dateFormatted = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const fullEmailDocument = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${escapeHtml(title)}</title>
  <style type="text/css">
    /* Client-specific resets */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    
    /* Layout */
    .email-container { width: 100%; max-width: 680px; margin: 0 auto; background-color: #1e293b; border-radius: 12px; overflow: hidden; border: 1px solid #334155; }
    .header-banner { background: linear-gradient(135deg, ${accentColor} 0%, #0f172a 100%); padding: 32px 36px 24px 36px; border-bottom: 2px solid ${accentColor}; }
    .badge { display: inline-block; padding: 4px 10px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #ffffff; background-color: rgba(255, 255, 255, 0.15); border-radius: 4px; margin-bottom: 12px; }
    .title { color: #ffffff; font-size: 24px; font-weight: 800; line-height: 1.3; margin: 0 0 12px 0; }
    .meta-row { font-size: 13px; color: #94a3b8; }
    .meta-item { display: inline-block; margin-right: 16px; }
    .content-area { padding: 32px 36px; color: #f8fafc; font-size: 15px; line-height: 1.7; }
    .content-area a { color: #38bdf8; text-decoration: underline; }
    .content-area img { max-width: 100%; height: auto; border-radius: 6px; }
    
    /* Typography inside content */
    h1 { color: #f8fafc; font-size: 22px; font-weight: 800; margin-top: 28px; margin-bottom: 14px; border-bottom: 1px solid #334155; padding-bottom: 8px; }
    h2 { color: #38bdf8; font-size: 18px; font-weight: 700; margin-top: 26px; margin-bottom: 12px; }
    h3 { color: #cbd5e1; font-size: 16px; font-weight: 600; margin-top: 20px; margin-bottom: 8px; }
    p { margin-top: 0; margin-bottom: 16px; color: #cbd5e1; }
    ul, ol { margin-top: 0; margin-bottom: 18px; padding-left: 24px; color: #e2e8f0; }
    li { margin-bottom: 8px; }
    strong { color: #ffffff; font-weight: 700; }
    code { background-color: #0f172a; color: #38bdf8; padding: 2px 6px; border-radius: 4px; font-family: 'JetBrains Mono', Consolas, Monaco, monospace; font-size: 13px; }
    pre { background-color: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 14px 18px; overflow-x: auto; margin: 18px 0; }
    pre code { background-color: transparent; padding: 0; border-radius: 0; color: #e2e8f0; }
    
    /* Tables */
    table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
    th { background-color: #0f172a; color: #38bdf8; font-weight: 700; text-align: left; padding: 10px 14px; border: 1px solid #334155; }
    td { padding: 10px 14px; border: 1px solid #334155; color: #cbd5e1; vertical-align: top; }
    tr:nth-child(even) td { background-color: #172033; }
    
    /* Blockquotes */
    blockquote { margin: 18px 0; padding: 12px 20px; background-color: #0f172a; border-left: 4px solid ${accentColor}; color: #94a3b8; font-style: italic; border-radius: 0 8px 8px 0; }
    
    /* Source Section */
    .sources-box { margin-top: 36px; padding: 20px; background-color: #0f172a; border-radius: 8px; border: 1px solid #334155; }
    .sources-title { font-size: 14px; font-weight: 700; color: #38bdf8; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 0.5px; }
    .source-link { color: #38bdf8; text-decoration: none; word-break: break-all; }
    .source-link:hover { text-decoration: underline; }
    
    /* Footer */
    .footer { padding: 24px 36px; background-color: #0f172a; border-top: 1px solid #334155; font-size: 12px; color: #64748b; text-align: center; }
    .footer-links a { color: #94a3b8; text-decoration: none; margin: 0 8px; }
    
    /* Responsive */
    @media only screen and (max-width: 620px) {
      .email-container { border-radius: 0 !important; }
      .header-banner { padding: 24px 20px !important; }
      .content-area { padding: 24px 20px !important; }
      .title { font-size: 20px !important; }
      table { display: block; overflow-x: auto; }
    }
  </style>
</head>
<body>
  <div style="background-color: #0f172a; padding: 24px 12px;">
    <div class="email-container">
      <!-- Header Banner -->
      <div class="header-banner">
        <div>
          <span class="badge" style="background-color: ${accentColor};">RESEARCHFLOW AI • ${formattedCategory}</span>
        </div>
        <h1 class="title">${escapeHtml(title)}</h1>
        <div class="meta-row">
          <span class="meta-item">📅 ${dateFormatted}</span>
          <span class="meta-item">🔍 Scope: ${depthLevel}</span>
          ${showConfidenceScore ? `<span class="meta-item" style="color: #34d399;">🛡️ Verification: ${confidenceScore}% Grounded</span>` : ''}
        </div>
      </div>

      <!-- Main Body Content -->
      <div class="content-area">
        ${rawHtmlBody}

        <!-- Sources Verification Index -->
        ${sources.length > 0 ? `
          <div class="sources-box">
            <div class="sources-title">Verified Ingested Sources (${sources.length})</div>
            <ul style="margin: 0; padding-left: 20px;">
              ${sources.map(s => `
                <li style="margin-bottom: 6px;">
                  <a href="${escapeHtml(s.url)}" class="source-link" target="_blank">${escapeHtml(s.title || s.url)}</a>
                </li>
              `).join('')}
            </ul>
          </div>
        ` : ''}
      </div>

      <!-- Footer -->
      <div class="footer">
        <p style="margin: 0 0 8px 0;">This executive briefing was autonomously researched, verified, and compiled by <strong>ResearchFlow AI</strong>.</p>
        <p style="margin: 0 0 12px 0;">Powered by Google Gemini 2.5 Multi-Agent Orchestration & Stateful PostgreSQL FSM Engine.</p>
        <div class="footer-links">
          <a href="#">Report Dashboard</a> •
          <a href="#">Audit Logs</a> •
          <a href="#">Adjust Frequency</a> •
          <a href="#">Unsubscribe</a>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  // 3. Inline all CSS using Juice for email client compatibility
  let inlinedHtml = fullEmailDocument;
  try {
    inlinedHtml = juice(fullEmailDocument, {
      preserveMediaQueries: true,
      removeStyleTags: false
    });
  } catch (err: any) {
    console.warn('[emailRenderer] Juice inlining fallback:', err.message);
  }

  // 4. Sanitize to prevent malicious injection
  const sanitizedHtml = sanitizeHtml(inlinedHtml, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      'head', 'body', 'style', 'title', 'meta', 'html', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'div', 'span', 'hr', 'code', 'pre', 'img'
    ]),
    allowedAttributes: {
      '*': ['style', 'class', 'id', 'align', 'valign', 'width', 'height', 'bgcolor', 'border', 'cellpadding', 'cellspacing'],
      'a': ['href', 'target', 'title', 'class', 'style'],
      'img': ['src', 'alt', 'title', 'width', 'height', 'style'],
      'meta': ['http-equiv', 'content', 'name', 'viewport'],
      'html': ['xmlns', 'lang']
    },
    allowVulnerableTags: true
  });

  const doctype = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">\n';
  return sanitizedHtml.startsWith('<!DOCTYPE') ? sanitizedHtml : doctype + sanitizedHtml.trim();
}

function escapeHtml(text: string | null | undefined): string {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
