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
    insurence_category: '',
    policy_type: '',
    policy_flow: '',
  })

  /* ---------------- EMAIL SECTION ---------------- */
  const [sendEmail, setSendEmail] = useState(false)
  const [filteredTemplates, setFilteredTemplates] = useState<EmailTemplate[]>([])
  const [templateId, setTemplateId] = useState('')
  const [formType, setFormType] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /* ---------------- LOAD FILTERED EMAIL TEMPLATES ---------------- */
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
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  /* ---------------- CREATE CLIENT ---------------- */
  const handleCreateClient = async () => {
    setError(null)

    if (
      !form.client_name ||
      !form.phone ||
      !form.email ||
      !form.insurence_category ||
      !form.policy_type ||
      !form.policy_flow
    ) {
      setError('Please fill all required fields')
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

    const { data: lead, error: insertError } =
      await supabase
        .from('temp_leads_basics')
        .insert({
          client_name: form.client_name,
          phone: form.phone,
          email: form.email,
          insurence_category: form.insurence_category,
          policy_type: form.policy_type,
          policy_flow: form.policy_flow,
          assigned_csr: user.id,
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

  /* ---------------- UPDATE CLIENT ---------------- */
  const handleUpdateClient = async () => {
    if (!leadId) return

    setLoading(true)

    await supabase
      .from('temp_leads_basics')
      .update(form)
      .eq('id', leadId)

    setLoading(false)
    setIsLocked(true)
  }

  /* ---------------- ENSURE SINGLE INTAKE FORM (CRITICAL FIX) ---------------- */
  const ensureIntakeForm = async () => {
    if (!leadId || !formType) return null

    // 1️⃣ Check if intake already exists
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

    // 2️⃣ Create intake if not exists
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
    setError(null)

    if (!formType) {
      setError('Select form type before preview')
      return
    }

    const id = await ensureIntakeForm()
    if (!id) return

    window.open(`/intake/${id}?preview=true`, '_blank')
  }

  /* ---------------- SEND EMAIL ---------------- */
  const handleSendEmail = async () => {
    setError(null)

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

    await supabase
      .from('temp_leads_basics')
      .update({ status: 'form_sent' })
      .eq('id', leadId)

    const formLink = `${window.location.origin}/intake/${id}`

    const emailBody = template.body
      .replace('{{form_link}}', formLink)
      .replace('{{client_name}}', form.client_name)

    const mailtoUrl = `mailto:${form.email}?subject=${encodeURIComponent(
      template.subject
    )}&body=${encodeURIComponent(emailBody)}`

    window.location.href = mailtoUrl
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
      <h1 className="text-xl font-semibold mb-6 text-white bg-[#0F4C75] px-6 py-4 rounded-xl">
        Add New Client
      </h1>

      {/* CLIENT DETAILS */}
      <div className="border border-[#C7EDE3] rounded-xl p-6 mb-6 bg-white">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold">Client Details</h2>
          {leadId && isLocked && (
            <button
              onClick={() => setIsLocked(false)}
              className="text-sm underline text-[#0F4C75]"
            >
              Edit Client Details
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <input
            name="client_name"
            value={form.client_name}
            onChange={handleChange}
            disabled={isLocked}
            placeholder="Client Name *"
            className="border p-3 rounded-lg col-span-2 disabled:bg-gray-100"
          />

          <input name="phone" value={form.phone} onChange={handleChange} disabled={isLocked} placeholder="Phone *" className="border p-3 rounded-lg disabled:bg-gray-100" />
          <input name="email" value={form.email} onChange={handleChange} disabled={isLocked} placeholder="Email *" className="border p-3 rounded-lg disabled:bg-gray-100" />

          <select name="insurence_category" value={form.insurence_category} onChange={handleChange} disabled={isLocked} className="border p-3 rounded-lg disabled:bg-gray-100">
            <option value="">Insurance Category *</option>
            <option value="personal">Personal</option>
            <option value="commercial">Commercial</option>
          </select>

          <select name="policy_flow" value={form.policy_flow} onChange={handleChange} disabled={isLocked} className="border p-3 rounded-lg disabled:bg-gray-100">
            <option value="">Policy Flow *</option>
            <option value="new">New</option>
            <option value="renewal">Renewal</option>
          </select>

          <select name="policy_type" value={form.policy_type} onChange={handleChange} disabled={isLocked} className="border p-3 rounded-lg col-span-2 disabled:bg-gray-100">
            <option value="">Policy Coverage *</option>
            <option value="home">Home</option>
            <option value="auto">Auto</option>
            <option value="home_auto">Home + Auto</option>
            <option value="condo">Condo</option>
            <option value="landlord_home">Landlord Home</option>
            <option value="landlord_condo">Landlord Condo</option>
            <option value="motorcycle">Motorcycle</option>
            <option value="umbrella">Umbrella</option>
          </select>
        </div>

        {!leadId && (
          <button onClick={handleCreateClient} className="mt-6 bg-[#0F4C75] text-white px-6 py-3 rounded-lg">
            Create Client
          </button>
        )}

        {leadId && !isLocked && (
          <button onClick={handleUpdateClient} className="mt-6 bg-[#0F4C75] text-white px-6 py-3 rounded-lg">
            Save Changes
          </button>
        )}
      </div>

      {/* EMAIL SECTION */}
      {leadId && (
        <div className="border border-[#C7EDE3] rounded-xl p-6 bg-[#F0FFFA]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">Send Initial Email</h2>
            <input type="checkbox" checked={sendEmail} onChange={e => setSendEmail(e.target.checked)} />
          </div>

          {sendEmail && (
            <>
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

              <button
                onClick={handlePreview}
                disabled={!formType}
                className={`mb-4 text-sm underline ${
                  !formType ? 'text-gray-400 cursor-not-allowed' : 'text-[#0F4C75]'
                }`}
              >
                Preview Form
              </button>

              <button onClick={handleSendEmail} className="w-full bg-[#0F4C75] text-white py-3 rounded-lg">
                Send Initial Email
              </button>
            </>
          )}
        </div>
      )}

      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  )
}
