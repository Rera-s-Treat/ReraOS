const BRAND = {
  cream: '#FFF4E3',
  brown: '#3B2118',
  tomato: '#D94A32',
  gold: '#E9A83B',
  muted: '#8a7a6d',
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function bodyTextToHtml(text: string): string {
  return text
    .trim()
    .split(/\n\n+/)
    .map(
      (paragraph) =>
        `<p style="margin:0 0 16px;">${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`,
    )
    .join('');
}

/**
 * Wraps any plain-text email body in Rera's Treat's branded HTML layout -
 * used for every outbound email (order/payment notifications, community
 * welcome, event invites/feedback, password reset) so the brand is
 * consistent regardless of which flow sent it.
 */
export function buildBrandedEmailHtml(bodyText: string): string {
  const bodyHtml = bodyTextToHtml(bodyText);
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:${BRAND.cream};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.cream};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="background:${BRAND.brown};padding:28px 32px;text-align:center;">
                <div style="font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:bold;color:${BRAND.cream};">
                  Rera&#8217;s <span style="color:${BRAND.tomato};">Treat</span>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;line-height:1.7;color:${BRAND.brown};">
                ${bodyHtml}
                <p style="margin:24px 0 0;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:14px;color:${BRAND.gold};">
                  Love, served generously.
                </p>
              </td>
            </tr>
            <tr>
              <td style="background:${BRAND.cream};padding:20px 32px;text-align:center;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:${BRAND.muted};">
                <div>Ogijo, Ogun State, Nigeria &middot; 0912 480 0610</div>
                <div style="margin-top:4px;">&copy; ${year} Rera's Treat. All rights reserved.</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
