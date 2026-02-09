import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { getCorsHeaders, handleCorsPreflightResponse } from "../_shared/cors.ts"

// Email template for OTP
function generateEmailHTML(otp: string, appName: string = 'OrderFlow'): string {
  return `
<!DOCTYPE html>
<html lang="da">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Din engangskode - ${appName}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" style="width:100%;border-collapse:collapse;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" style="width:100%;max-width:480px;border-collapse:collapse;background:#ffffff;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding:32px 32px 24px;text-align:center;background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);border-radius:12px 12px 0 0;">
              <h1 style="margin:0;color:#2dd4bf;font-size:24px;font-weight:700;">${appName}</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 16px;color:#0f172a;font-size:20px;font-weight:600;">Din engangskode</h2>
              <p style="margin:0 0 24px;color:#64748b;font-size:15px;line-height:1.6;">
                Brug denne kode til at logge ind. Koden udlober om 10 minutter.
              </p>

              <!-- OTP Code Box -->
              <div style="background:#f8fafc;border:2px dashed #e2e8f0;border-radius:8px;padding:24px;text-align:center;margin-bottom:24px;">
                <span style="font-family:'Courier New',monospace;font-size:36px;font-weight:700;letter-spacing:8px;color:#0f172a;">${otp}</span>
              </div>

              <p style="margin:0 0 8px;color:#64748b;font-size:13px;">
                <strong>Sikkerhedstip:</strong>
              </p>
              <ul style="margin:0 0 24px;padding-left:20px;color:#64748b;font-size:13px;line-height:1.8;">
                <li>Del aldrig denne kode med andre</li>
                <li>Vi vil aldrig bede om din kode via telefon</li>
                <li>Hvis du ikke anmodede om denne kode, ignorer denne email</li>
              </ul>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;background:#f8fafc;border-radius:0 0 12px 12px;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">
                Denne email blev sendt af ${appName}.<br>
                Brug for hjaelp? <a href="mailto:support@orderflow.dk" style="color:#2dd4bf;text-decoration:none;">support@orderflow.dk</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// Plain text version
function generateEmailText(otp: string, appName: string = 'OrderFlow'): string {
  return `${appName} - Din engangskode

Din engangskode er: ${otp}

Koden udlober om 10 minutter.

SIKKERHEDSTIP:
- Del aldrig denne kode med andre
- Vi vil aldrig bede om din kode via telefon
- Hvis du ikke anmodede om denne kode, ignorer denne email

Med venlig hilsen,
${appName}
support@orderflow.dk`;
}

function generateWelcomeInviteHTML(
  setupLink: string,
  appName: string = 'OrderFlow',
  restaurantName: string = '',
  contactName: string = '',
  temporaryCode: string = ''
): string {
  const greeting = contactName ? `Hej ${contactName},` : 'Hej,';
  const restaurantLine = restaurantName
    ? `<p style="margin:0 0 16px;color:#64748b;font-size:15px;line-height:1.6;"><strong>${restaurantName}</strong> er nu oprettet i FLOW.</p>`
    : '';
  const codeBlock = temporaryCode
    ? `<div style="background:#f8fafc;border:2px dashed #e2e8f0;border-radius:8px;padding:16px;text-align:center;margin:16px 0;">
         <span style="font-family:'Courier New',monospace;font-size:26px;font-weight:700;letter-spacing:4px;color:#0f172a;">${temporaryCode}</span>
       </div>`
    : '';

  return `
<!DOCTYPE html>
<html lang="da">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Velkommen til ${appName}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" style="width:100%;border-collapse:collapse;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" style="width:100%;max-width:520px;border-collapse:collapse;background:#ffffff;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding:32px 32px 24px;text-align:center;background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);border-radius:12px 12px 0 0;">
              <h1 style="margin:0;color:#2dd4bf;font-size:24px;font-weight:700;">${appName}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 16px;color:#0f172a;font-size:20px;font-weight:600;">Velkommen til FLOW</h2>
              <p style="margin:0 0 12px;color:#64748b;font-size:15px;line-height:1.6;">${greeting}</p>
              ${restaurantLine}
              <p style="margin:0 0 20px;color:#64748b;font-size:15px;line-height:1.6;">
                Klik herunder for at oprette din adgangskode. Du bliver bedt om at indtaste adgangskoden to gange.
              </p>
              <p style="margin:0 0 20px;text-align:center;">
                <a href="${setupLink}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;">
                  Opret adgangskode
                </a>
              </p>
              ${codeBlock}
              <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.5;">
                Linket er personligt. Del det ikke med andre. Hvis du ikke forventede denne mail, kan du ignorere den.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;background:#f8fafc;border-radius:0 0 12px 12px;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">
                Sendt af ${appName}.<br>
                Support: <a href="mailto:support@orderflow.dk" style="color:#2dd4bf;text-decoration:none;">support@orderflow.dk</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function generateWelcomeInviteText(
  setupLink: string,
  appName: string = 'OrderFlow',
  restaurantName: string = '',
  contactName: string = '',
  temporaryCode: string = ''
): string {
  const greeting = contactName ? `Hej ${contactName},` : 'Hej,';
  const restaurantText = restaurantName ? `\nVirksomhed: ${restaurantName}\n` : '\n';
  const codeText = temporaryCode ? `\nMidlertidig kode: ${temporaryCode}\n` : '\n';

  return `${appName} - Velkommen

${greeting}
${restaurantText}Din konto er klar. Opret din adgangskode via linket her:
${setupLink}
${codeText}Du skal bekraefte adgangskoden ved at indtaste den to gange.

Hvis du ikke forventede denne mail, kan du ignorere den.

Med venlig hilsen,
${appName}
support@orderflow.dk`;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightResponse(req)
  }

  try {
    const payload = await req.json()
    const {
      to,
      otp,
      appName,
      subject,
      mode,
      setupLink,
      temporaryCode,
      restaurantName,
      contactName
    } = payload || {}
    const safeAppName = appName || 'OrderFlow'
    const isWelcomeInvite = mode === 'welcome_invite'

    if (!to || (!otp && !isWelcomeInvite)) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to and otp (or welcome mode)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (isWelcomeInvite && !setupLink) {
      return new Response(
        JSON.stringify({ error: 'Missing required field for welcome mode: setupLink' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get email provider config from environment
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY')
    const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'noreply@orderflow.dk'

    const emailSubject = isWelcomeInvite
      ? (subject || `${safeAppName}: Velkommen - opret din adgangskode`)
      : (subject || `${safeAppName}: Din engangskode`)
    const htmlContent = isWelcomeInvite
      ? generateWelcomeInviteHTML(setupLink, safeAppName, restaurantName, contactName, temporaryCode)
      : generateEmailHTML(otp, safeAppName)
    const textContent = isWelcomeInvite
      ? generateWelcomeInviteText(setupLink, safeAppName, restaurantName, contactName, temporaryCode)
      : generateEmailText(otp, safeAppName)

    let result

    // Try Resend first
    if (RESEND_API_KEY) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [to],
          subject: emailSubject,
          html: htmlContent,
          text: textContent
        })
      })

      result = await response.json()

      if (response.ok) {
        return new Response(
          JSON.stringify({
            success: true,
            provider: 'resend',
            messageId: result.id
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Try SendGrid as fallback
    if (SENDGRID_API_KEY) {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SENDGRID_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: FROM_EMAIL },
          subject: emailSubject,
          content: [
            { type: 'text/plain', value: textContent },
            { type: 'text/html', value: htmlContent }
          ]
        })
      })

      if (response.ok || response.status === 202) {
        return new Response(
          JSON.stringify({
            success: true,
            provider: 'sendgrid'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      result = await response.text()
    }

    // No provider configured or both failed
    if (!RESEND_API_KEY && !SENDGRID_API_KEY) {
      // Development mode - log OTP instead of sending
      if (isWelcomeInvite) {
        console.log(`📧 [DEV MODE] Welcome invite for ${to}: ${setupLink}`)
      } else {
        console.log(`📧 [DEV MODE] OTP for ${to}: ${otp}`)
      }
      return new Response(
        JSON.stringify({
          success: true,
          provider: 'dev',
          message: 'Email provider not configured. OTP logged to console.',
          _debug_otp: otp || null,
          _debug_setup_link: setupLink || null
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        error: 'Failed to send email',
        details: result
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Send OTP email error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
