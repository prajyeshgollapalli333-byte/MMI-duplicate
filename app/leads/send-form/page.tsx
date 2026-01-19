'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type EmailTemplate = {
  id: string
  name: string
  subject: string
  body: string
}

export default function SendFormPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const leadId = searchParams.get('id') // ✅ correct

  const [lead, setLead] = useState<any>(null)
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [templateId, setTemplateId] = useState('')
  const [formType, setFormType] = useState('')
  const [intakeId, setIntakeId] = useState<string | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /* ================= LOAD LEAD + TEMPLATES ================= */
  useEffect(() => {
    if (!leadId) return

    const loadData = async () => {
      // ✅ FETCH ALL LEAD FIELDS
      const { data: leadData, error: leadError } = await supabase
        .from('temp_leads_basics')
        .select(`
          id,
          client_name,
          phone,
          email,
          insurence_category,
          policy_type,
          policy_flow,
          status,
          created_at
        `)
        .eq('id', leadId)
        .single()

      if (leadError) {
        setError(leadError.message)
        return
      }

      // email templates
      const { data: templateData } = await supabase
        .from('email_templates')
        .select('*')
        .eq('is_active', true)

      setLead(leadData)
      setTemplates(templateData || [])
    }

    loadData()
  }, [leadId])

  /* ================= ENSURE INTAKE FORM ================= */
  const ensureIntakeForm = async () => {
    if (!leadId || !formType) return null

    // check existing
    const { data: existing } = await supabase
      .from('temp_intake_forms')
      .select('id')
      .eq('lead_id', leadId)
      .eq('form_type', formType)
      .single()

    if (existing?.id) {
      setIntakeId(existing.id)
      return existing.id
    }

    // create new
    const { data, error } = await supabase
      .from('temp_intake_forms')
      .insert({
        lead_id: leadId,
        form_type: formType,
        status: 'sent',
      })
      .select()
      .single()

    if (error) {
      setError(error.message)
      return null
    }

    setIntakeId(data.id)
    return data.id
  }

  /* ================= PREVIEW FORM ================= */
  const handlePreview = async () => {
    if (!formType) {
      setError('Select form type first')
      return
    }

    const id = await ensureIntakeForm()
    if (!id) return

    window.open(`/intake/${id}?preview=true`, '_blank')
  }

  /* ================= SEND INITIAL EMAIL ================= */
  const handleSend = async () => {
    if (!templateId || !formType || !leadId) {
      setError('Please select email template and form type')
      return
    }

    setLoading(true)
    setError(null)

    const template = templates.find(t => t.id === templateId)
    if (!template) {
      setError('Invalid email template')
      setLoading(false)
      return
    }

    const id = await ensureIntakeForm()
    if (!id) {
      setLoading(false)
      return
    }

    // update lead
    await supabase
      .from('temp_leads_basics')
      .update({
        status: 'form_sent',
        form_sent_at: new Date().toISOString(),
      })
      .eq('id', leadId)

    // email body
    const formLink = `${window.location.origin}/intake/${id}`
    const emailBody = template.body
      .replace('{{client_name}}', lead.client_name)
      .replace('{{form_link}}', formLink)

    // open outlook
    window.location.href = `mailto:${lead.email}?subject=${encodeURIComponent(
      template.subject
    )}&body=${encodeURIComponent(emailBody)}`

    setLoading(false)
    router.push('/leads')
  }

  if (!lead) return <div className="p-10">Loading...</div>

  /* ================= UI ================= */
  return (
    <div className="max-w-3xl mx-auto p-10">
      <h1 className="text-2xl font-semibold mb-6">
        Send Initial Email
      </h1>

      {/* ✅ FULL LEAD SUMMARY (NOW MATCHES NEW LEAD PAGE) */}
      <div className="mb-6 p-4 border rounded bg-gray-50 text-sm space-y-1">
        <p><b>Client Name:</b> {lead.client_name}</p>
        <p><b>Email:</b> {lead.email}</p>
        <p><b>Phone:</b> {lead.phone}</p>
        <p><b>Insurance Category:</b> {lead.insurence_category}</p>
        <p><b>Policy Type:</b> {lead.policy_type}</p>
        <p><b>Policy Flow:</b> {lead.policy_flow}</p>
        <p><b>Status:</b> {lead.status}</p>
      </div>

      {/* PREVIEW */}
      <button
        onClick={handlePreview}
        className="w-full mb-5 bg-gray-800 text-white py-2 rounded"
      >
        Preview Form (CSR View)
      </button>

      {/* EMAIL TEMPLATE */}
      <select
        value={templateId}
        onChange={e => setTemplateId(e.target.value)}
        className="w-full border p-3 rounded mb-4"
      >
        <option value="">Select Email Template</option>
        {templates.map(t => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>

      {/* FORM TYPE */}
      <select
        value={formType}
        onChange={e => setFormType(e.target.value)}
        className="w-full border p-3 rounded mb-4"
      >
        <option value="">Select Form Type</option>
        <option value="home">Home</option>
        <option value="auto">Auto</option>
        <option value="condo">Condo</option>
        <option value="landlord_home">Landlord Home</option>
      </select>

      {error && <p className="text-red-500 mb-3">{error}</p>}

      <button
        onClick={handleSend}
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 rounded"
      >
        {loading ? 'Preparing Email…' : 'Send Initial Email'}
      </button>
    </div>
  )
}
