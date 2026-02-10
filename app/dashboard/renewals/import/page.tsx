'use client'

import { useState } from 'react'
import Papa from 'papaparse'
import { supabase } from '@/lib/supabaseClient'

export default function RenewalImportPage() {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleFileUpload = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: result => setRows(result.data as any[]),
    })
  }

  const handleImport = async () => {
    setLoading(true)
    setMessage(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setMessage('Not logged in')
      setLoading(false)
      return
    }

    // Get Renewal Pipeline
    const { data: pipeline } = await supabase
      .from('pipelines')
      .select('id')
      .eq('name', 'Personal Lines Renewal')
      .single()

    // Get First Stage
    const { data: stage } = await supabase
      .from('pipeline_stages')
      .select('id')
      .eq('pipeline_id', pipeline.id)
      .eq('stage_order', 1)
      .single()

    const payload = rows.map(r => ({
      client_name: r['Client Name'],
      phone: r['Phone'],
      email: r['Email'],
      policy_type: r['Policy Type'],
      renewal_date: r['Renewal Date'],
      carrier: r['Carrier'],
      policy_number: r['Policy Number'],
      current_premium: Number(r['Total Premium']),
      renewal_premium: r['Renewal Premium']
        ? Number(r['Renewal Premium'])
        : null,
      referral: r['Referral'],
      notes: r['Notes'],
      policy_flow: 'renewal',
      insurence_category: 'personal',
      pipeline_id: pipeline.id,
      current_stage_id: stage.id,
      assigned_csr: user.id, // TEMP: admin logic later
    }))

    const { error } = await supabase
      .from('temp_leads_basics')
      .insert(payload)

    setMessage(error ? error.message : 'Renewals imported successfully')
    setLoading(false)
  }

  return (
    <div className="p-8 max-w-xl">
      <h1 className="text-xl font-bold mb-4">
        Import Personal Lines Renewals
      </h1>

      <input
        type="file"
        accept=".csv"
        onChange={e => e.target.files && handleFileUpload(e.target.files[0])}
      />

      {rows.length > 0 && (
        <button
          onClick={handleImport}
          disabled={loading}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
        >
          {loading ? 'Importing…' : 'Import'}
        </button>
      )}

      {message && <p className="mt-4">{message}</p>}
    </div>
  )
}
