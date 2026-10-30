/**
 * SEOFix AI - ResendEmailService
 * Sends transactional alerts for score drops and critical SEO violations via Resend.
 */

import https from 'https';

export interface EmailAlertPayload {
  to: string;
  projectName: string;
  projectDomain: string;
  scoreOverall: number;
  criticalIssuesCount: number;
  criticalIssuesList: string[];
}

export class ResendEmailService {
  private static apiKey = process.env.RESEND_API_KEY || '';
  private static fromEmail = process.env.ALERT_EMAIL_FROM || 'alerts@seofix.ai';

  /**
   * Send an automated audit alert email.
   */
  public static async sendAuditAlert(payload: EmailAlertPayload): Promise<{ success: boolean; id?: string; error?: string }> {
    if (!this.apiKey || !this.apiKey.startsWith('re_')) {
      console.log(`[ResendEmailService] Resend API key unconfigured. Simulated alert for ${payload.to} on ${payload.projectDomain} (Score: ${payload.scoreOverall})`);
      return { success: true, id: 'simulated_' + Date.now() };
    }

    const issuesHtml = payload.criticalIssuesList.map(issue => `<li style="margin-bottom: 6px; color: #e11d48;"><strong>Critical:</strong> ${issue}</li>`).join('');

    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #030712; color: #f3f4f6; border-radius: 12px; border: 1px solid #1f2937;">
        <div style="display: flex; align-items: center; margin-bottom: 20px;">
          <h1 style="font-size: 20px; font-weight: bold; margin: 0; color: #818cf8;">⚡ SEOFix AI Alert</h1>
        </div>
        <p style="font-size: 14px; color: #9ca3af; margin-top: 0;">Automated audit report for <strong>${payload.projectDomain}</strong>.</p>
        
        <div style="background: #111827; border: 1px solid #374151; padding: 18px; border-radius: 8px; margin: 20px 0;">
          <div style="font-size: 12px; text-transform: uppercase; color: #9ca3af; font-weight: 600;">Overall SEO Health Score</div>
          <div style="font-size: 36px; font-weight: 800; color: ${payload.scoreOverall >= 80 ? '#34d399' : payload.scoreOverall >= 60 ? '#fbbf24' : '#f87171'};">
            ${payload.scoreOverall} <span style="font-size: 16px; font-weight: 400; color: #6b7280;">/ 100</span>
          </div>
          <div style="font-size: 13px; color: #e5e7eb; margin-top: 6px;">
            ${payload.criticalIssuesCount > 0 ? `⚠️ ${payload.criticalIssuesCount} critical SEO blockers require immediate attention.` : '✓ No critical blockers detected.'}
          </div>
        </div>

        ${payload.criticalIssuesCount > 0 ? `
          <h3 style="font-size: 14px; color: #f3f4f6; margin-bottom: 8px;">Key Issues Detected:</h3>
          <ul style="font-size: 13px; padding-left: 20px; line-height: 1.5;">
            ${issuesHtml}
          </ul>
        ` : ''}

        <div style="margin-top: 28px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" style="display: inline-block; background: #4f46e5; color: #ffffff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 600;">
            Open SEOFix AI Dashboard →
          </a>
        </div>
      </div>
    `;

    const postData = JSON.stringify({
      from: this.fromEmail,
      to: payload.to,
      subject: `[SEOFix AI] Audit Alert for ${payload.projectDomain} (Score: ${payload.scoreOverall})`,
      html: htmlBody,
    });

    return new Promise((resolve) => {
      const req = https.request(
        'https://api.resend.com/emails',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Length': Buffer.byteLength(postData),
          },
          timeout: 10000,
        },
        (res) => {
          let raw = '';
          res.on('data', chunk => (raw += chunk));
          res.on('end', () => {
            try {
              const parsed = JSON.parse(raw);
              if (res.statusCode && res.statusCode < 300) {
                resolve({ success: true, id: parsed.id });
              } else {
                resolve({ success: false, error: parsed.message || 'Resend API error' });
              }
            } catch {
              resolve({ success: false, error: raw });
            }
          });
        }
      );

      req.on('error', (err) => resolve({ success: false, error: err.message }));
      req.on('timeout', () => {
        req.destroy();
        resolve({ success: false, error: 'Resend request timeout' });
      });
      req.write(postData);
      req.end();
    });
  }
}
