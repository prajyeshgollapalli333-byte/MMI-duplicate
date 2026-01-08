'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type EmailTemplate = {
  id: string
  name: string
  subject: string
  body: string
}

export default function SendFormPage() {
  const { id } = useParams()
  const router = useRouter()

  const [lead, setLead] = useState<any>(null)
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [formType, setFormType] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      const { data: leadData } = await supabase
        .from('temp_leads_basics')
        .select('id, email, policy_type')
        .eq('id', id)
        .single()

      const { data: templateData } = await supabase
        .from('email_templates')
        .select('*')
        .eq('is_active', true)

      setLead(leadData)
      setTemplates(templateData || [])
    }

    loadData()
  }, [id])

  const handleSend = async () => {
    if (!selectedTemplateId || !formType) {
      setError('Please select email template and form type')
      return
    }

    setLoading(true)
    setError(null)

    const template = templates.find(t => t.id === selectedTemplateId)
    if (!template) {
      setError('Invalid email template selected')
      setLoading(false)
      return
    }

    // 1️⃣ Update lead
    await supabase
      .from('temp_leads_basics')
      .update({
        status: 'form_sent',
        form_type: formType,
        form_sent_at: new Date(),
      })
      .eq('id', id)

    // 2️⃣ Generate intake link
    const formLink = `${window.location.origin}/intake/${id}`

    // 3️⃣ Replace placeholders
    let emailBody = template.body
      .replace('{{form_link}}', formLink)
      .replace('{{client_name}}', lead.email)

    // 4️⃣ Open Outlook
    const mailtoUrl = `mailto:${lead.email}?subject=${encodeURIComponent(
      template.subject
    )}&body=${encodeURIComponent(emailBody)}`

    window.location.href = mailtoUrl

    setLoading(false)
    router.push('/leads')
  }

  if (!lead) return <div className="p-10">Loading...</div>

  return (
    <div className="max-w-2xl mx-auto p-10">
      <h1 className="text-2xl font-semibold mb-6">
        Send Initial Email
      </h1>

      {/* Lead Info */}
      <div className="mb-6 p-4 rounded border bg-gray-50 text-sm space-y-1">
        <p><b>Email:</b> {lead.email}</p>
        <p><b>Policy Type:</b> {lead.policy_type}</p>
      </div>

      {/* 🔍 PREVIEW FORM (CSR) */}
      <button
        onClick={() =>
          window.open(`/intake/${id}?preview=true`, '_blank')
        }
        className="w-full mb-5 bg-gray-800 text-white py-2 rounded font-medium"
      >
        Preview Form (CSR View)
      </button>

      {/* Email Template */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          Email Template
        </label>
        <select
          value={selectedTemplateId}
          onChange={e => setSelectedTemplateId(e.target.value)}
          className="w-full border rounded px-3 py-2"
        >
          <option value="">Select Email Template</option>
          {templates.map(t => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {/* Form Type */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          Form Type
        </label>
        <select
          value={formType}
          onChange={e => setFormType(e.target.value)}
          className="w-full border rounded px-3 py-2"
        >
          <option value="">Select Form Type</option>
          <option value="home">Home Insurance</option>
          <option value="auto">Auto Insurance</option>
          <option value="home_auto">Home + Auto</option>
        </select>
      </div>

      {error && <p className="text-red-500 mb-3">{error}</p>}

      <button
        onClick={handleSend}
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 rounded font-medium"
      >
        {loading ? 'Preparing Email...' : 'Send Initial Email'}
      </button>
    </div>
  )
}
