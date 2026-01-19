'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type EmailTemplate = {
  id: string
  name: string
  subject: string
  body: string
}

export default function NewLeadPage() {
  /* ---------------- STATE ---------------- */
  const [leadId, setLeadId] = useState<string | null>(null)
  const [intakeId, setIntakeId] = useState<string | null>(null)
  const [isLocked, setIsLocked] = useState(false)

  const [form, setForm] = useState({
    client_name: '',
    phone: '',
    email: '',
    request_type: '',
    insurence_category: '',
    policy_flow: '',
    policy_type: '',
    referral: '',
    notes: '',
  })

  /* ---------------- EMAIL SECTION ---------------- */
  const [sendEmail, setSendEmail] = useState(false)
  const [filteredTemplates, setFilteredTemplates] = useState<EmailTemplate[]>([])
  const [templateId, setTemplateId] = useState('')
  const [formType, setFormType] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /* ---------------- LOAD EMAIL TEMPLATES ---------------- */
  useEffect(() => {
    if (!leadId) return

    const loadTemplates = async () => {
      const { data } = await supabase
        .from('email_templates')
        .select('*')
        .eq('is_active', true)
        .eq('insurance_category', form.insurence_category)
        .eq('policy_type', form.policy_type)
        .eq('policy_flow', form.policy_flow)

      setFilteredTemplates(data || [])
    }

    loadTemplates()
  }, [leadId, form.insurence_category, form.policy_type, form.policy_flow])

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  /* ---------------- CREATE LEAD ---------------- */
  const handleCreateClient = async () => {
    setError(null)

    if (
      !form.client_name ||
      !form.phone ||
      !form.email ||
      !form.request_type ||
      !form.insurence_category ||
      !form.policy_flow ||
      !form.policy_type
    ) {
      setError('Please fill all mandatory fields')
      return
    }

    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError('User not authenticated')
      setLoading(false)
      return
    }

    const { data: lead, error: insertError } = await supabase
      .from('temp_leads_basics')
      .insert({
        client_name: form.client_name,
        phone: form.phone,
        email: form.email,
        request_type: form.request_type,
        insurence_category: form.insurence_category,
        policy_flow: form.policy_flow,
        policy_type: form.policy_type,
        referral: form.referral,
        notes: form.notes,
        assigned_csr: user.id,
        send_email: sendEmail,
        status: 'new_lead',
      })
      .select()
      .single()

    setLoading(false)

    if (insertError) {
      setError(insertError.message)
      return
    }

    setLeadId(lead.id)
    setIsLocked(true)
  }

  /* ---------------- ENSURE SINGLE INTAKE FORM ---------------- */
  const ensureIntakeForm = async () => {
    if (!leadId || !formType) return null

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

    const { data, error } = await supabase
      .from('temp_intake_forms')
      .insert({
        lead_id: leadId,
        form_type: formType,
        status: 'draft',
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

  /* ---------------- PREVIEW FORM ---------------- */
  const handlePreview = async () => {
    if (!formType) {
      setError('Select form type before preview')
      return
    }

    const id = await ensureIntakeForm()
    if (!id) return

    window.open(`/intake/${id}?preview=true`, '_blank')
  }

  /* ---------------- SEND EMAIL (TEMP: mailto, SMTP in Phase 4) ---------------- */
  const handleSendEmail = async () => {
    if (!templateId || !formType || !leadId) {
      setError('Select email template and form')
      return
    }

    const template = filteredTemplates.find(t => t.id === templateId)
    if (!template) return

    const id = await ensureIntakeForm()
    if (!id) return

    await supabase
      .from('temp_intake_forms')
      .update({ status: 'sent' })
      .eq('id', id)

    const formLink = `${window.location.origin}/intake/${id}`

    const emailBody = template.body
      .replace('{{form_link}}', formLink)
      .replace('{{client_name}}', form.client_name)

    window.location.href = `mailto:${form.email}?subject=${encodeURIComponent(
      template.subject
    )}&body=${encodeURIComponent(emailBody)}`
  }

  /* ---------------- FORM OPTIONS ---------------- */
  const formOptions =
    form.policy_type === 'home'
      ? ['home']
      : form.policy_type === 'auto'
      ? ['auto']
      : [
          'home',
          'auto',
          'home_auto',
          'condo',
          'landlord_home',
          'landlord_condo',
          'motorcycle',
          'umbrella',
        ]

  return (
    <div className="max-w-3xl mx-auto p-8 bg-[#F4FBF8] rounded-2xl shadow-lg border border-[#C7EDE3]">
      <h1 className="text-xl font-semibold mb-6 bg-[#0F4C75] text-white px-6 py-4 rounded-xl">
        Add New Personal Line Lead
      </h1>

      {/* CLIENT DETAILS */}
      <div className="bg-white p-6 rounded-xl border">
        <div className="grid grid-cols-2 gap-4">
          <input name="client_name" placeholder="Client Name *" onChange={handleChange} disabled={isLocked} />
          <input name="phone" placeholder="Phone *" onChange={handleChange} disabled={isLocked} />
          <input name="email" placeholder="Email *" onChange={handleChange} disabled={isLocked} />

          <select name="request_type" onChange={handleChange} disabled={isLocked}>
            <option value="">Request Type *</option>
            <option value="new_lead">New Lead</option>
            <option value="endorsement">Endorsement</option>
            <option value="cancellation">Cancellation</option>
            <option value="carrier_request">Carrier Request</option>
          </select>

          <select name="insurence_category" onChange={handleChange} disabled={isLocked}>
            <option value="">Insurance Category *</option>
            <option value="personal">Personal</option>
            <option value="commercial">Commercial</option>
          </select>

          <select name="policy_flow" onChange={handleChange} disabled={isLocked}>
            <option value="">Policy Flow *</option>
            <option value="new">New</option>
            <option value="renewal">Renewal</option>
          </select>

          <select name="policy_type" onChange={handleChange} disabled={isLocked} className="col-span-2">
            <option value="">Policy Coverage *</option>
            <option value="home">Home</option>
            <option value="auto">Auto</option>
            <option value="home_auto">Home + Auto</option>
          </select>

          <input name="referral" placeholder="Referral (optional)" onChange={handleChange} disabled={isLocked} />
          <textarea name="notes" placeholder="Notes" onChange={handleChange} disabled={isLocked} />
        </div>

        <label className="flex items-center gap-2 mt-4">
          <input type="checkbox" checked={sendEmail} onChange={e => setSendEmail(e.target.checked)} />
          Send email to client requesting documents
        </label>

        {!leadId && (
          <button onClick={handleCreateClient} className="mt-6 bg-[#0F4C75] text-white px-6 py-3 rounded-lg">
            Create Lead
          </button>
        )}
      </div>

      {/* EMAIL SECTION */}
      {leadId && sendEmail && (
        <div className="mt-6 p-6 bg-[#F0FFFA] border rounded-xl">
          <select value={templateId} onChange={e => setTemplateId(e.target.value)} className="border p-3 rounded-lg w-full mb-3">
            <option value="">Select Email Template</option>
            {filteredTemplates.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          <select value={formType} onChange={e => setFormType(e.target.value)} className="border p-3 rounded-lg w-full mb-4">
            <option value="">Select Form</option>
            {formOptions.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>

          <button onClick={handlePreview} className="text-sm underline text-[#0F4C75] mb-4">
            Preview Form
          </button>

          <button onClick={handleSendEmail} className="w-full bg-[#0F4C75] text-white py-3 rounded-lg">
            Send Initial Email
          </button>
        </div>
      )}

      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  )
}
