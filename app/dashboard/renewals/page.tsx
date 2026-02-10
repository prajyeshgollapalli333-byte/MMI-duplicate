'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

type Renewal = {
  id: string
  client_name: string
  policy_type: string
  renewal_date: string
  carrier?: string
  total_premium?: number
  assigned_csr?: string
  pipeline_stage: {
    stage_name: string
  } | null
}

export default function RenewalPipelinePage() {
  const [renewals, setRenewals] = useState<Renewal[]>([])
  const [loading, setLoading] = useState(true)
  const [monthFilter, setMonthFilter] = useState<string>(new Date().toISOString().slice(0, 7)) // Default to current month YYYY-MM

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      let query = supabase
        .from('temp_leads_basics')
        .select(`
          id,
          client_name,
          policy_type,
          renewal_date,
          carrier,
          total_premium,
          assigned_csr,
          pipeline_stage:pipeline_stages (
            stage_name
          )
        `)
        .eq('policy_flow', 'renewal')
        .eq('assigned_csr', user.id)
        .order('renewal_date', { ascending: true })

      // Apply Month Filter
      if (monthFilter) {
        const startOfMonth = `${monthFilter}-01`
        // Calculate end of month roughly or use Supabase date operators
        // Easier: filter safely by string prefix if date format is YYYY-MM-DD
        // Or use gte/lte
        const [year, month] = monthFilter.split('-')
        const nextMonth = month === '12' ? 1 : parseInt(month) + 1
        const nextYear = month === '12' ? parseInt(year) + 1 : parseInt(year)
        const nextDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`

        query = query.gte('renewal_date', startOfMonth).lt('renewal_date', nextDate)
      }

      const { data, error } = await query

      if (error) {
        console.error(error)
        setRenewals([])
      } else {
        const formatted = (data || []).map((row: any) => ({
          ...row,
          pipeline_stage: Array.isArray(row.pipeline_stage)
            ? row.pipeline_stage[0] ?? null
            : row.pipeline_stage,
        }))

        setRenewals(formatted)
      }

      setLoading(false)
    }

    load()
  }, [monthFilter])

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          Personal Lines Renewals
        </h1>
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/renewals/import"
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
          >
            Import CSV
          </Link>
          <div className="flex items-center gap-2">
            <label className="font-medium">Filter by Month:</label>
            <input
              type="month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="border rounded p-2"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-6">Loading renewals…</div>
      ) : (
        <table className="w-full border rounded shadow-sm bg-white">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 text-left font-semibold text-gray-600">Client</th>
              <th className="p-4 text-left font-semibold text-gray-600">Policy</th>
              <th className="p-4 text-left font-semibold text-gray-600">Renewal Date</th>
              <th className="p-4 text-left font-semibold text-gray-600">Carrier</th>
              <th className="p-4 text-left font-semibold text-gray-600">Premium</th>
              <th className="p-4 text-left font-semibold text-gray-600">Stage</th>
              <th className="p-4 text-left font-semibold text-gray-600">Action</th>
            </tr>
          </thead>

          <tbody>
            {renewals.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-gray-500">No renewals found for this month.</td>
              </tr>
            ) : (
              renewals.map(r => (
                <tr key={r.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-medium">{r.client_name}</td>
                  <td className="p-4 capitalize">{r.policy_type}</td>
                  <td className="p-4">{r.renewal_date}</td>
                  <td className="p-4">{r.carrier || '—'}</td>
                  <td className="p-4">{r.total_premium ? `$${r.total_premium}` : '—'}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                      {r.pipeline_stage?.stage_name || 'New'}
                    </span>
                  </td>
                  <td className="p-4">
                    <Link
                      href={`/dashboard/renewals/${r.id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                    >
                      Manage
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  )
}
