'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import UpdateStageModal from '@/components/pipeline/UpdateStageModal'

export default function LeadReviewPage() {
  const { id } = useParams()
  const router = useRouter()

  const [lead, setLead] = useState<any>(null)
  const [form, setForm] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showUpdateModal, setShowUpdateModal] = useState(false)

  /* ================= LOAD LEAD + FORM ================= */
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)

      /* LOAD LEAD WITH CURRENT PIPELINE STAGE */
      const { data: leadData, error: leadError } = await supabase
        .from('temp_leads_basics')
        .select(`
          *,
          pipeline_stages (
            id,
            stage_name
          )
        `)
        .eq('id', id)
        .single()

      if (leadError || !leadData) {
        setError('Lead not found')
        setLoading(false)
        return
      }

      /* LOAD LATEST COMPLETED FORM (IF ANY) */
      const { data: formData } = await supabase
        .from('temp_intake_forms')
        .select('*')
        .eq('lead_id', id)
        .eq('status', 'completed')
        .order('submitted_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      setLead(leadData)
      setForm(formData || null)
      setLoading(false)
    }

    if (id) loadData()
  }, [id])

  /* ================= ACCEPT LEAD ================= */
  const handleAccept = async () => {
    if (!lead || !form) return

    setAccepting(true)
    setError(null)

    try {
      /* CHECK IF CLIENT EXISTS */
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('email', lead.email)
        .maybeSingle()

      let clientId = existingClient?.id

      /* CREATE CLIENT IF NOT EXISTS */
      if (!clientId) {
        const { data: client, error: clientError } = await supabase
          .from('clients')
          .insert({
            phone: lead.phone,
            email: lead.email,
            assigned_csr: lead.assigned_csr,
          })
          .select()
          .single()

        if (clientError || !client) {
          throw new Error('Failed to create client')
        }

        clientId = client.id
      }

      /* CREATE INSURANCE RECORD */
      await supabase.from('client_insurance_details').insert({
        client_id: clientId,
        insurance_category: lead.insurence_category,
        policy_type: lead.policy_type,
        full_data: form.form_data,
        verified_by: lead.assigned_csr,
      })

      /* MARK FORM AS REVIEWED */
      await supabase
        .from('temp_intake_forms')
        .update({
          status: 'reviewed',
          reviewed_by: lead.assigned_csr,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', form.id)

      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setAccepting(false)
    }
  }

  /* ================= UI STATES ================= */
  if (loading) {
    return <div className="p-10">Loading...</div>
  }

  if (error) {
    return (
      <div className="p-10 text-red-600 font-medium">
        {error}
      </div>
    )
  }

  /* ================= NO FORM SUBMITTED ================= */
  if (!form) {
    return (
      <div className="max-w-4xl mx-auto p-10 space-y-6">
        <h1 className="text-2xl font-semibold">Lead Details</h1>

        <div className="p-4 border rounded bg-gray-50 space-y-1">
          <p><b>Email:</b> {lead.email}</p>
          <p><b>Policy Type:</b> {lead.policy_type}</p>
          <p>
            <b>Current Status:</b>{' '}
            {lead.pipeline_stages?.stage_name || 'N/A'}
          </p>
        </div>

        <button
          onClick={() => {
            if (!lead.pipeline_id) {
              alert('Pipeline not assigned to this lead')
              return
            }
            setShowUpdateModal(true)
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Update Status
        </button>

        <div className="p-4 border rounded bg-yellow-50 text-yellow-800">
          Waiting for client to submit intake form.
        </div>

        {showUpdateModal && (
          <UpdateStageModal
            leadId={lead.id}
            pipelineId={lead.pipeline_id}
            onClose={() => setShowUpdateModal(false)}
            onSuccess={() => router.refresh()}
          />
        )}
      </div>
    )
  }

  /* ================= FORM SUBMITTED ================= */
  return (
    <div className="max-w-4xl mx-auto p-10 space-y-6">
      <h1 className="text-2xl font-semibold">Review Client Intake</h1>

      <div className="p-4 border rounded bg-gray-50 space-y-1">
        <p><b>Email:</b> {lead.email}</p>
        <p><b>Policy Type:</b> {lead.policy_type}</p>
        <p>
          <b>Current Status:</b>{' '}
          {lead.pipeline_stages?.stage_name || 'N/A'}
        </p>
      </div>

      <button
        onClick={() => {
          if (!lead.pipeline_id) {
            alert('Pipeline not assigned to this lead')
            return
          }
          setShowUpdateModal(true)
        }}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Update Status
      </button>

      <div>
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
        className="w-full bg-green-600 text-white py-3 rounded disabled:opacity-60"
      >
        {accepting ? 'Accepting...' : 'Accept Lead'}
      </button>

      {showUpdateModal && (
        <UpdateStageModal
          leadId={lead.id}
          pipelineId={lead.pipeline_id}
          onClose={() => setShowUpdateModal(false)}
          onSuccess={() => router.refresh()}
        />
      )}
    </div>
  )
}
