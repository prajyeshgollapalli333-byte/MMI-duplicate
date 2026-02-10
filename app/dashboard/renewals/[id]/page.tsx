'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { validateStage } from '@/lib/renewals/validateStage'

type Stage = {
  id: string
  stage_name: string
  stage_order: number
  mandatory_fields: string[]
}

type Renewal = {
  id: string
  client_name: string
  policy_type: string
  renewal_date: string
  carrier?: string
  policy_number?: string
  total_premium?: number
  pipeline_id: string
  current_stage_id: string
  stage_metadata: Record<string, any>
  pipeline_stage: Stage
}

export default function RenewalDetailPage() {
  const { id } = useParams()
  const [lead, setLead] = useState<Renewal | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('temp_leads_basics')
        .select(`
          id,
          client_name,
          policy_type,
          renewal_date,
          carrier,
          policy_number,
          total_premium,
          pipeline_id,
          current_stage_id,
          stage_metadata,
          pipeline_stages (
            id,
            stage_name,
            stage_order,
            mandatory_fields
          )
        `)
        .eq('id', id)
        .single()

      if (error || !data) {
        console.error(error)
        setLoading(false)
        return
      }

      // ✅ NORMALIZE STAGE (CRITICAL FIX)
      const stage =
        Array.isArray(data.pipeline_stages)
          ? data.pipeline_stages[0]
          : data.pipeline_stages

      setLead({
        ...data,
        pipeline_stage: stage,
      })

      setLoading(false)
    }

    load()
  }, [id])

  /* ---------------- UPDATE METADATA ---------------- */
  const updateMetadata = async (key: string, value: any) => {
    if (!lead) return

    const updated = {
      ...(lead.stage_metadata || {}),
      [key]: value,
    }

    // Auto-calculate X-date if stage is Cancelled
    if (lead.pipeline_stage.stage_name === 'Cancelled' && !updated.x_date) {
      const renewalDate = new Date(lead.renewal_date)
      renewalDate.setDate(renewalDate.getDate() - 60)
      updated.x_date = renewalDate.toISOString().split('T')[0]
    }

    setLead({ ...lead, stage_metadata: updated })

    await supabase
      .from('temp_leads_basics')
      .update({ stage_metadata: updated })
      .eq('id', lead.id)
  }

  /* ---------------- MOVE TO NEXT STAGE ---------------- */
  const moveNext = async () => {
    if (!lead) return

    setMessage(null)

    const { data: nextStage } = await supabase
      .from('pipeline_stages')
      .select('*')
      .eq('pipeline_id', lead.pipeline_id)
      .eq('stage_order', lead.pipeline_stage.stage_order + 1)
      .single()

    if (!nextStage) {
      setMessage('This is the final stage')
      return
    }

    const validation = validateStage(
      nextStage.mandatory_fields || [],
      lead.stage_metadata || {}
    )

    if (!validation.valid) {
      setMessage(
        'Missing required fields: ' +
        validation.missing.join(', ')
      )
      return
    }

    await supabase
      .from('temp_leads_basics')
      .update({ current_stage_id: nextStage.id })
      .eq('id', lead.id)

    setLead({
      ...lead,
      pipeline_stage: nextStage,
      current_stage_id: nextStage.id,
    })

    setMessage('Moved to next stage successfully')
  }

  if (loading) return <div className="p-6">Loading…</div>
  if (!lead) return <div className="p-6">Not found</div>

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-4">
        {lead.client_name} — Renewal
      </h1>

      {/* Policy Details Header */}
      <div className="bg-gray-50 p-4 rounded-lg border mb-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <span className="block text-gray-500">Policy Type</span>
          <span className="font-medium capitalize">{lead.policy_type}</span>
        </div>
        <div>
          <span className="block text-gray-500">Renewal Date</span>
          <span className="font-medium">{lead.renewal_date}</span>
        </div>
        <div>
          <span className="block text-gray-500">Carrier</span>
          <span className="font-medium">{lead.carrier || '—'}</span>
        </div>
        <div>
          <span className="block text-gray-500">Policy Number</span>
          <span className="font-medium">{lead.policy_number || '—'}</span>
        </div>
        <div>
          <span className="block text-gray-500">Current Premium</span>
          <span className="font-medium">{lead.total_premium ? `$${lead.total_premium}` : '—'}</span>
        </div>
        <div>
          <span className="block text-gray-500">Current Stage</span>
          <span className="font-medium text-blue-600">{lead.pipeline_stage.stage_name}</span>
        </div>
      </div>

      {/* Dynamic Form based on Stage */}
      <div className="border p-6 rounded-lg bg-white shadow-sm mb-6">
        <h2 className="text-lg font-semibold mb-4 border-b pb-2">Stage Requirements</h2>

        {/* Stage 1: Quoting in Progress */}
        {lead.pipeline_stage.stage_name === 'Quoting in Progress' && (
          <div className="space-y-4">
            <BooleanField
              label="Have you updated the client’s profile in EZLynx?"
              value={lead.stage_metadata?.ezlynx_updated}
              onChange={(val) => updateMetadata('ezlynx_updated', val)}
            />
          </div>
        )}

        {/* Stage 2: Same Declaration Emailed */}
        {lead.pipeline_stage.stage_name === 'Same Declaration Emailed' && (
          <div className="space-y-4">
            <BooleanField
              label="Did you quote in multiple carriers?"
              value={lead.stage_metadata?.quoted_multiple_carriers}
              onChange={(val) => updateMetadata('quoted_multiple_carriers', val)}
            />
            <BooleanField
              label="Is the current policy set up on autopay?"
              value={lead.stage_metadata?.autopay_setup}
              onChange={(val) => updateMetadata('autopay_setup', val)}
            />
          </div>
        )}

        {/* Stage 3: Completed (Same) */}
        {lead.pipeline_stage.stage_name === 'Completed (Same)' && (
          <div className="space-y-4">
            <BooleanField
              label="Is the policy paid for the renewal term?"
              value={lead.stage_metadata?.paid_for_renewal}
              onChange={(val) => updateMetadata('paid_for_renewal', val)}
            />
          </div>
        )}

        {/* Stage 4: Quote Has been Emailed */}
        {lead.pipeline_stage.stage_name === 'Quote Has been Emailed' && (
          <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <DateField
              label="Follow-up Date"
              value={lead.stage_metadata?.follow_up_date}
              onChange={(val) => updateMetadata('follow_up_date', val)}
            />
            <BooleanField
              label="Have you finalized the quote?"
              value={lead.stage_metadata?.quote_finalized}
              onChange={(val) => updateMetadata('quote_finalized', val)}
            />
            <TextField
              label="Which carrier quote are you sending?"
              value={lead.stage_metadata?.carrier_quote_sent}
              onChange={(val) => updateMetadata('carrier_quote_sent', val)}
            />
            <NumberField
              label="What is the quoted premium?"
              value={lead.stage_metadata?.quoted_premium}
              onChange={(val) => updateMetadata('quoted_premium', val)}
            />
            <NumberField
              label="How much is the client saving by switching?"
              value={lead.stage_metadata?.savings_amount}
              onChange={(val) => updateMetadata('savings_amount', val)}
            />
          </div>
        )}

        {/* Stage 5: Consent Letter Sent */}
        {lead.pipeline_stage.stage_name === 'Consent Letter Sent' && (
          <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <DateField
              label="Follow-up Date"
              value={lead.stage_metadata?.follow_up_date}
              onChange={(val) => updateMetadata('follow_up_date', val)}
            />
            <SelectField
              label="What is the payment method?"
              options={['CC', 'ACH', 'ESCROW']}
              value={lead.stage_metadata?.payment_method}
              onChange={(val) => updateMetadata('payment_method', val)}
            />
            <SelectField
              label="What is the payment frequency?"
              options={['Full', '2-Pay', '4-Pay', 'Monthly']}
              value={lead.stage_metadata?.payment_frequency}
              onChange={(val) => updateMetadata('payment_frequency', val)}
            />
          </div>
        )}

        {/* Stage 6: Completed (Switch) */}
        {lead.pipeline_stage.stage_name === 'Completed (Switch)' && (
          <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label="Policy Number"
              value={lead.stage_metadata?.policy_number}
              onChange={(val) => updateMetadata('policy_number', val)}
            />
            <NumberField
              label="Bound Premium"
              value={lead.stage_metadata?.bound_premium}
              onChange={(val) => updateMetadata('bound_premium', val)}
            />
            <NumberField
              label="Expected Commission"
              value={lead.stage_metadata?.expected_commission}
              onChange={(val) => updateMetadata('expected_commission', val)}
            />
            <BooleanField
              label="Policy documents saved in EZLynx & File Center?"
              value={lead.stage_metadata?.docs_saved_ezlynx}
              onChange={(val) => updateMetadata('docs_saved_ezlynx', val)}
            />
            <BooleanField
              label="Have you sent the policy documents to client?"
              value={lead.stage_metadata?.docs_sent_to_client}
              onChange={(val) => updateMetadata('docs_sent_to_client', val)}
            />
            <BooleanField
              label="Did you cancel the renewal term in previous carrier?"
              value={lead.stage_metadata?.cancelled_prev_carrier}
              onChange={(val) => updateMetadata('cancelled_prev_carrier', val)}
            />
          </div>
        )}

        {/* Stage 7: Cancelled */}
        {lead.pipeline_stage.stage_name === 'Cancelled' && (
          <div className="space-y-4">
            <TextField
              label="Reason for Cancellation"
              value={lead.stage_metadata?.cancellation_reason}
              onChange={(val) => updateMetadata('cancellation_reason', val)}
            />
            <DateField
              label="X-Date (Auto-calculated: -60 days)"
              value={lead.stage_metadata?.x_date}
              readOnly={true}
              onChange={() => { }}
            />
          </div>
        )}

        <div className="mt-6 pt-4 border-t">
          <label className="block mb-2 font-medium text-gray-700">Notes / Details</label>
          <textarea
            className="w-full border rounded p-3 h-24"
            placeholder="Add any important updates regarding the client/policy..."
            value={lead.stage_metadata?.notes || ''}
            onChange={(e) => updateMetadata('notes', e.target.value)}
          />
        </div>

      </div>

      <div className="flex justify-end gap-4">
        <button
          onClick={moveNext}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-medium transition-colors"
        >
          Update Stage / Move Next
        </button>
      </div>

      {message && (
        <p className={`mt-4 p-3 rounded ${message.includes('success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message}
        </p>
      )}
    </div>
  )
}

/* --- HELPER COMPONENTS --- */

function BooleanField({ label, value, onChange }: { label: string, value: boolean | undefined, onChange: (val: boolean) => void }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded border">
      <span className="font-medium text-gray-700">{label}</span>
      <div className="flex gap-2">
        <button
          onClick={() => onChange(true)}
          className={`px-4 py-1 rounded text-sm font-medium ${value === true ? 'bg-green-600 text-white' : 'bg-white border text-gray-600'}`}
        >
          Yes
        </button>
        <button
          onClick={() => onChange(false)}
          className={`px-4 py-1 rounded text-sm font-medium ${value === false ? 'bg-red-600 text-white' : 'bg-white border text-gray-600'}`}
        >
          No
        </button>
      </div>
    </div>
  )
}

function TextField({ label, value, onChange }: { label: string, value: string | undefined, onChange: (val: string) => void }) {
  return (
    <div>
      <label className="block mb-1 font-medium text-gray-700">{label}</label>
      <input
        type="text"
        className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

function NumberField({ label, value, onChange }: { label: string, value: string | number | undefined, onChange: (val: string) => void }) {
  return (
    <div>
      <label className="block mb-1 font-medium text-gray-700">{label}</label>
      <input
        type="number"
        className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

function DateField({ label, value, onChange, readOnly }: { label: string, value: string | undefined, onChange: (val: string) => void, readOnly?: boolean }) {
  return (
    <div>
      <label className="block mb-1 font-medium text-gray-700">{label}</label>
      <input
        type="date"
        className={`w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none ${readOnly ? 'bg-gray-100' : ''}`}
        value={value || ''}
        readOnly={readOnly}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

function SelectField({ label, options, value, onChange }: { label: string, options: string[], value: string | undefined, onChange: (val: string) => void }) {
  return (
    <div>
      <label className="block mb-1 font-medium text-gray-700">{label}</label>
      <select
        className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select...</option>
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  )
}
