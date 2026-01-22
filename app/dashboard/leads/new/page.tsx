'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import {
  User,
  Phone,
  Mail,
  FileText,
  Shield,
  Send,
  ChevronDown,
  CheckSquare,
  Square,
  StickyNote,
} from 'lucide-react'

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
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
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

    /* ✅ FIX: NO status FIELD ANYMORE */
    const { data: lead, error: insertError } = await supabase
      .from('temp_leads_basics')
      .insert({
        ...form,
        assigned_csr: user.id,
        send_email: sendEmail,
        // current_stage_id is auto-set by DB DEFAULT
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

    const { data } = await supabase
      .from('temp_intake_forms')
      .insert({
        lead_id: leadId,
        form_type: formType,
        status: 'draft',
      })
      .select()
      .single()

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

    window.open(`/dashboard/intake/${id}?preview=true`, '_blank')
  }

  /* ---------------- SEND EMAIL ---------------- */
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

    const formLink = `${window.location.origin}/dashboard/intake/${id}`

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
    <div className="min-h-screen bg-[#F4FBF8] py-10 px-4 flex justify-center">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-[#C7EDE3] overflow-hidden">

        {/* HEADER */}
        <div className="bg-gradient-to-r from-[#10B889] to-[#2E5C85] p-8 text-white">
          <h1 className="text-3xl font-bold">Add New Personal Line Lead</h1>
          <p className="text-white/80 mt-2">
            Enter client details to create a new lead
          </p>
        </div>

        {/* CONTENT */}
        <div className="p-8 space-y-8">

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* FORM GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input icon={<User />} name="client_name" placeholder="Client Name *" onChange={handleChange} disabled={isLocked} />
            <Input icon={<Phone />} name="phone" placeholder="Phone *" onChange={handleChange} disabled={isLocked} />
            <Input icon={<Mail />} name="email" placeholder="Email *" onChange={handleChange} disabled={isLocked} />

            <Select
              name="request_type"
              icon={<FileText />}
              disabled={isLocked}
              onChange={handleChange}
              placeholder="Request Type *"
              options={[
                { value: 'new_lead', label: 'New Lead' },
                { value: 'endorsement', label: 'Endorsement' },
                { value: 'cancellation', label: 'Cancellation' },
                { value: 'carrier_request', label: 'Carrier Request' },
              ]}
            />

            <Select
              name="insurence_category"
              icon={<Shield />}
              disabled={isLocked}
              onChange={handleChange}
              placeholder="Insurance Category *"
              options={[
                { value: 'personal', label: 'Personal' },
                { value: 'commercial', label: 'Commercial' },
              ]}
            />

            <Select
              name="policy_flow"
              icon={<Shield />}
              disabled={isLocked}
              onChange={handleChange}
              placeholder="Policy Flow *"
              options={[
                { value: 'new', label: 'New' },
                { value: 'renewal', label: 'Renewal' },
              ]}
            />
          </div>

          <Select
            name="policy_type"
            icon={<Shield />}
            disabled={isLocked}
            onChange={handleChange}
            placeholder="Policy Coverage *"
            options={[
              { value: 'home', label: 'Home' },
              { value: 'auto', label: 'Auto' },
              { value: 'home_auto', label: 'Home + Auto' },
            ]}
          />

          <Input icon={<User />} name="referral" placeholder="Referral (Optional)" onChange={handleChange} disabled={isLocked} />

          <div className="relative">
            <div className="absolute left-4 top-4 text-gray-400">
              <StickyNote size={18} />
            </div>
            <textarea
              name="notes"
              placeholder="Additional Notes..."
              onChange={handleChange}
              disabled={isLocked}
              rows={3}
              className="w-full pl-12 pr-4 py-3 border rounded-xl"
            />
          </div>

          {/* CHECKBOX */}
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => !isLocked && setSendEmail(!sendEmail)}
          >
            {sendEmail ? <CheckSquare className="text-[#10B889]" /> : <Square className="text-gray-400" />}
            <span>Send email to client requesting documents</span>
          </div>

          {!leadId && (
            <button
              onClick={handleCreateClient}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-[#10B889] to-[#2E5C85] text-white rounded-xl font-bold flex justify-center gap-2"
            >
              {loading ? 'Creating...' : 'Create Lead'}
              {!loading && <Send />}
            </button>
          )}

          {/* EMAIL SECTION */}
          {leadId && sendEmail && (
            <div className="p-6 bg-[#F0FFFA] border rounded-2xl">
              <select
                value={templateId}
                onChange={e => setTemplateId(e.target.value)}
                className="w-full p-3 mb-4 border rounded-lg"
              >
                <option value="">Select Email Template</option>
                {filteredTemplates.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>

              <select
                value={formType}
                onChange={e => setFormType(e.target.value)}
                className="w-full p-3 mb-4 border rounded-lg"
              >
                <option value="">Select Intake Form</option>
                {formOptions.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>

              <div className="flex gap-4">
                <button onClick={handlePreview} className="flex-1 py-3 border rounded-lg">
                  Preview Form
                </button>

                <button
                  onClick={handleSendEmail}
                  className="flex-1 py-3 bg-[#2E5C85] text-white rounded-lg flex justify-center gap-2"
                >
                  <Send size={18} />
                  Send Initial Email
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

/* ---------------- UI HELPERS ---------------- */

const Input = ({ icon, ...props }: any) => (
  <div className="relative">
    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
      {icon}
    </div>
    <input
      {...props}
      className="w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#10B889]/20"
    />
  </div>
)

const Select = ({ icon, options, placeholder, ...props }: any) => (
  <div className="relative">
    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
      {icon}
    </div>
    <select
      {...props}
      className="w-full pl-12 pr-10 py-3 border rounded-xl appearance-none focus:ring-2 focus:ring-[#10B889]/20"
    >
      <option value="">{placeholder}</option>
      {options.map((o: any) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
  </div>
)
