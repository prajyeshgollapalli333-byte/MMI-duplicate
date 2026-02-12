'use client'

import { useState } from 'react'
import Papa from 'papaparse'
import { supabase } from '@/lib/supabaseClient'

export default function RenewalImportPage() {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  /* ================================
     DATE FORMATTER (SAFE VERSION)
     Handles:
     - DD-MM-YYYY
     - DD/MM/YYYY
     - YYYY-MM-DD (already correct)
  ================================= */
  /* ================================
     DATE FORMATTER (ROBUST)
     Handles:
     - YYYY-MM-DD (ISO)
     - MM/DD/YYYY (US)
     - DD-MM-YYYY (EU/Common)
  ================================= */
  const formatDate = (dateString: string) => {
    if (!dateString) return null

    // 1. ISO Format (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString
    }

    const clean = dateString.trim()

    // 2. US Format Check (MM/DD/YYYY or M/D/YYYY)
    // We assume slashed dates are US format if not obvious otherwise, or simply standard US assumption
    if (clean.includes('/')) {
      const parts = clean.split('/')
      if (parts.length === 3) {
        // Assume MM/DD/YYYY
        let [m, d, y] = parts
        m = m.padStart(2, '0')
        d = d.padStart(2, '0')
        if (y.length === 2) y = '20' + y // simple 2-digit year handling
        return `${y}-${m}-${d}`
      }
    }

    // 3. Fallback / Dash Format (DD-MM-YYYY)
    if (clean.includes('-')) {
      const parts = clean.split('-')
      if (parts.length === 3) {
        // If first part is 4 digits, likely YYYY-MM-DD handled above or similar
        if (parts[0].length === 4) return clean

        // Assume DD-MM-YYYY
        const [d, m, y] = parts
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
      }
    }

    return null
  }

  /* ================================
     CSV PARSER
  ================================= */
  const handleFileUpload = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: result => setRows(result.data as any[]),
    })
  }

  /* ================================
     IMPORT FUNCTION
  ================================= */
  const handleImport = async () => {
    setLoading(true)
    setMessage(null)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setMessage('Not logged in')
      setLoading(false)
      return
    }

    // Get Renewal Pipeline
    const { data: pipeline, error: pipelineError } = await supabase
      .from('pipelines')
      .select('id')
      .eq('name', 'Personal Lines Renewal')
      .single()

    if (pipelineError || !pipeline) {
      setMessage('Renewal pipeline not found')
      setLoading(false)
      return
    }

    // Get First Stage (Quoting in Progress)
    const { data: stage, error: stageError } = await supabase
      .from('pipeline_stages')
      .select('id')
      .eq('pipeline_id', pipeline.id)
      .eq('stage_order', 1)
      .single()

    if (stageError || !stage) {
      setMessage('First stage not found')
      setLoading(false)
      return
    }

    // Prepare Payload
    const payload = rows.map(r => ({
      client_name: r['Client Name']?.trim(),
      phone: r['Phone']?.trim(),
      email: r['Email']?.trim(),
      policy_type: r['Policy Type']?.trim(),
      renewal_date: formatDate(r['Renewal Date']),
      carrier: r['Carrier']?.trim(),
      policy_number: r['Policy Number']?.trim(),
      current_premium: r['Total Premium']
        ? Number(r['Total Premium'])
        : null,
      renewal_premium: r['Renewal Premium']
        ? Number(r['Renewal Premium'])
        : null,
      referral: r['Referral']?.trim() || null,
      notes: r['Notes']?.trim() || null,
      policy_flow: 'renewal',
      insurence_category: 'personal',
      pipeline_id: pipeline.id,
      current_stage_id: stage.id,
      assigned_csr: user.id, // CSR testing mode
    }))

    const { error } = await supabase
      .from('temp_leads_basics')
      .insert(payload)

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Renewals imported successfully')
      setRows([])
    }

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
        onChange={e =>
          e.target.files && handleFileUpload(e.target.files[0])
        }
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

      {message && (
        <p className="mt-4 text-sm text-blue-600">
          {message}
        </p>
      )}
    </div>
  )
}
