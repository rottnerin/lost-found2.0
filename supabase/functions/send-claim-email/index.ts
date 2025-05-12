import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { SmtpClient } from 'https://deno.land/x/smtp@v0.7.0/mod.ts'
import { corsHeaders } from '../_shared/cors.ts'

interface ClaimData {
  firstName: string
  lastName: string
  childName: string
  childGrade: string
  itemId: string
  itemName: string
}

interface EmailRequest {
  to: string
  subject: string
  claimData: ClaimData
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, claimData } = await req.json() as EmailRequest

    // Create SMTP client
    const client = new SmtpClient()

    // Connect to SMTP server (using environment variables)
    await client.connectTLS({
      hostname: Deno.env.get('SMTP_HOSTNAME') || '',
      port: parseInt(Deno.env.get('SMTP_PORT') || '587'),
      username: Deno.env.get('SMTP_USERNAME') || '',
      password: Deno.env.get('SMTP_PASSWORD') || '',
    })

    // Create email content
    const emailContent = `
      New Item Claim Request

      Item Details:
      - Name: ${claimData.itemName}
      - ID: ${claimData.itemId}

      Claimant Information:
      - First Name: ${claimData.firstName}
      - Last Name: ${claimData.lastName}
      - Child's Name: ${claimData.childName}
      - Child's Grade: ${claimData.childGrade}

      Please review this claim and contact the claimant if the item belongs to their child.
    `.trim()

    // Send email
    await client.send({
      from: Deno.env.get('SMTP_FROM_EMAIL') || '',
      to: to,
      subject: subject,
      content: emailContent,
    })

    await client.close()

    return new Response(
      JSON.stringify({ message: 'Email sent successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error sending email:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to send email' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})