import mailer from 'nodemailer'
import { DynamicObjectType } from '../../types'

export default async (
  transportData: DynamicObjectType,
  emailbody: DynamicObjectType
) => {
  try {
    console.log('[EMAIL] Creating transporter with config:', {
      host: transportData.host,
      port: transportData.port,
      secure: transportData.secure,
      user: transportData.auth?.user
    })
    
    // Use SendGrid Web API instead of SMTP for Render compatibility(Render blocks SMTP)
    if (transportData.host === 'smtp.sendgrid.net') {
      console.log('[EMAIL] Using SendGrid Web API instead of SMTP')
      return await sendViaSendGridAPI(transportData.auth.pass, emailbody)
    }
    
    const transporter = mailer.createTransport(transportData)
    
    console.log('[EMAIL] Sending email to:', emailbody.to)
    const res = await transporter.sendMail(emailbody)
    console.log('[EMAIL] Email sent successfully:', res.messageId)

    if (res && res.accepted && res.accepted.length) {
      return { success: true, messageId: res.messageId }
    }
    return { success: false, res }
  } catch (error) {
    console.error('[EMAIL] Failed to send email:', error)
    return { success: false, error }
  }
}

// SendGrid Web API implementation using fetch
async function sendViaSendGridAPI(apiKey: string, emailbody: DynamicObjectType) {
  try {
    // Handle both string and array formats for 'to' field
    const toEmail = Array.isArray(emailbody.to) ? emailbody.to[0] : emailbody.to;
    
    // Extract email from "Name <email>" format or use a verified sender email
    let fromEmail = emailbody.from;
    if (typeof fromEmail === 'string' && fromEmail.includes('<')) {
      // Extract email from "Name <email>" format
      const match = fromEmail.match(/<([^>]+)>/);
      fromEmail = match ? match[1] : fromEmail;
    }
    
    // Use a verified sender email for SendGrid
    if (fromEmail === 'apikey' || !fromEmail.includes('@')) {
      fromEmail = 'rimtechsolutions22@gmail.com'; // Verified sender email
    }
    
    console.log('[EMAIL] Sending to:', toEmail, 'from:', fromEmail);
    
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: toEmail }],
          subject: emailbody.subject
        }],
        from: { 
          email: fromEmail,
          name: 'IZI Morocco'
        },
        content: [{
          type: 'text/html',
          value: emailbody.html || emailbody.text
        }]
      })
    })
    
    if (response.ok) {
      console.log('[EMAIL] SendGrid API success:', response.status)
      return { success: true, messageId: 'sendgrid-api-' + Date.now() }
    } else {
      const errorData = await response.text()
      console.error('[EMAIL] SendGrid API error:', response.status, errorData)
      throw new Error(`SendGrid API error: ${response.status}`)
    }
    
  } catch (error: any) {
    console.error('[EMAIL] SendGrid API error:', error.message)
    throw error
  }
}
