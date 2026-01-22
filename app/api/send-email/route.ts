import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import nodemailer from 'nodemailer'

export async function POST(req: Request) {
  try {
    /* ================= READ REQUEST BODY ================= */
    const { leadId, templateId, formType } = await req.json()

    if (!leadId || !templateId || !formType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    /* ================= FETCH LEAD ================= */
    const { data: lead, error: leadError } = await supabaseServer
      .from('temp_leads_basics')
      .select('id, client_name, email')
      .eq('id', leadId)
      .single()

    if (leadError || !lead || !lead.email) {
      return NextResponse.json(
        { error: 'Invalid lead or missing email' },
        { status: 404 }
      )
    }

    /* ================= FETCH EMAIL TEMPLATE ================= */
    const { data: template, error: templateError } = await supabaseServer
      .from('email_templates')
      .select('id, subject, body')
      .eq('id', templateId)
      .eq('is_active', true)
      .single()

    if (templateError || !template) {
      return NextResponse.json(
        { error: 'Email template not found or inactive' },
        { status: 404 }
      )
    }

    /* ================= GENERATE FORM LINK ================= */
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
    if (!baseUrl) {
      return NextResponse.json(
        { error: 'NEXT_PUBLIC_SITE_URL not configured' },
        { status: 500 }
      )
    }

    const formLink = `${baseUrl}/intake/${leadId}?type=${formType}`

    /* ================= PREPARE EMAIL BODY ================= */
    const emailBody = template.body
      .replace(/{{\s*client_name\s*}}/g, lead.client_name || '')
      .replace(/{{\s*form_link\s*}}/g, formLink)

    /* ================= SMTP TRANSPORT (ETHEREAL / REAL SMTP) ================= */
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    /* ================= SEND EMAIL ================= */
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: lead.email,
      subject: template.subject,
      html: emailBody,
    })

    // 🔹 Ethereal preview link (VERY IMPORTANT FOR TESTING)
    console.log('Email preview URL:', nodemailer.getTestMessageUrl(info))

    /* ================= LOG EMAIL ================= */
    await supabaseServer.from('email_logs').insert({
      lead_id: lead.id,
      template_id: template.id,
      to_email: lead.email,
      subject: template.subject,
      status: 'sent',
    })

    /* ================= SET FOLLOW-UP DATE (+48 HOURS) ================= */
    const followUpDate = new Date()
    followUpDate.setHours(followUpDate.getHours() + 48)

    await supabaseServer
      .from('temp_leads_basics')
      .update({
        follow_up_date: followUpDate.toISOString(),
        status: 'email_sent',
      })
      .eq('id', lead.id)

    /* ================= SUCCESS RESPONSE ================= */
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Send email API error:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
