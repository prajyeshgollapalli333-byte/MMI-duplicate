'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function LeadReviewPage() {
  const { id } = useParams()
  const router = useRouter()

  const [lead, setLead] = useState<any>(null)
  const [form, setForm] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      const { data: leadData } = await supabase
        .from('temp_leads_basics')
        .select('*')
        .eq('id', id)
        .single()

      const { data: formData } = await supabase
        .from('temp_intake_forms')
        .select('*')
        .eq('lead_id', id)
        .eq('status', 'completed')
        .single()

      setLead(leadData)
      setForm(formData)
      setLoading(false)
    }

    loadData()
  }, [id])

  const handleAccept = async () => {
    setAccepting(true)

    // 1️⃣ Create client
    const { data: client } = await supabase
      .from('clients')
      .insert({
        phone: lead.phone,
        email: lead.email,
        assigned_csr: lead.assigned_csr,
      })
      .select()
      .single()

    // 2️⃣ Create insurance record
    await supabase.from('client_insurance_details').insert({
      client_id: client.id,
      insurance_category: lead.insurence_category,
      policy_type: lead.policy_type,
      full_data: form.form_data,
      verified_by: lead.assigned_csr,
    })

    // 3️⃣ Mark intake form reviewed
    await supabase
      .from('temp_intake_forms')
      .update({
        status: 'reviewed',
        reviewed_by: lead.assigned_csr,
        reviewed_at: new Date(),
      })
      .eq('id', form.id)

    // 4️⃣ Update lead status
    await supabase
      .from('temp_leads_basics')
      .update({ status: 'active' })
      .eq('id', id)

    setAccepting(false)
    router.push('/dashboard')
  }

  if (loading) return <div className="p-10">Loading...</div>

  if (!form)
    return (
      <div className="p-10">
        <h2 className="text-xl font-semibold">
          Waiting for client submission
        </h2>
      </div>
    )

  return (
    <div className="max-w-4xl mx-auto p-10">
      <h1 className="text-2xl font-semibold mb-6">
        Review Client Intake
      </h1>

      {/* Lead Summary */}
      <div className="mb-6 p-4 border rounded bg-gray-50">
        <p><b>Email:</b> {lead.email}</p>
        <p><b>Policy Type:</b> {lead.policy_type}</p>
        <p><b>Status:</b> {lead.status}</p>
      </div>

      {/* Intake Data */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">
          Submitted Form Data
        </h2>

        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
          {JSON.stringify(form.form_data, null, 2)}
        </pre>
      </div>

      <button
        onClick={handleAccept}
        disabled={accepting}
        className="w-full bg-green-600 text-white py-3 rounded"
      >
        {accepting ? 'Accepting...' : 'Accept Lead'}
      </button>
    </div>
  )
}
