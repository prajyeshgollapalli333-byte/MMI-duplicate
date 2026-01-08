'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

type Lead = {
  id: string
  phone: string
  email: string
  insurence_category: string
  policy_type: string
  policy_flow: string
  status: string
  created_at: string
}

export default function MyLeadsPage() {
  const searchParams = useSearchParams()
  const statusFilter = searchParams.get('status')
  const docsFilter = searchParams.get('docs')

  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadLeads = async () => {
      setLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      let query = supabase
        .from('temp_leads_basics')
        .select(`
          id,
          phone,
          email,
          insurence_category,
          policy_type,
          policy_flow,
          status,
          created_at
        `)
        .order('created_at', { ascending: false })

      // Filter by status (from dashboard cards)
      if (statusFilter) {
        query = query.eq('status', statusFilter)
      }

      const { data: leadData, error } = await query

      if (error || !leadData) {
        setLeads([])
        setLoading(false)
        return
      }

      // If filtering by documents uploaded
      if (docsFilter === 'true') {
        const leadIds = leadData.map(l => l.id)

        if (leadIds.length === 0) {
          setLeads([])
          setLoading(false)
          return
        }

        const { data: forms } = await supabase
          .from('temp_intake_forms')
          .select('lead_id')
          .in('lead_id', leadIds)

        const leadsWithDocs = forms?.map(f => f.lead_id) || []

        setLeads(leadData.filter(l => leadsWithDocs.includes(l.id)))
      } else {
        setLeads(leadData)
      }

      setLoading(false)
    }

    loadLeads()
  }, [statusFilter, docsFilter])

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">
          My Leads
          {statusFilter && (
            <span className="text-sm text-gray-500 ml-2">
              ({statusFilter.replace('_', ' ')})
            </span>
          )}
        </h1>

        <Link
          href="/leads/new"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          + New Lead
        </Link>
      </div>

      {loading ? (
        <p>Loading leads...</p>
      ) : leads.length === 0 ? (
        <p>No leads found.</p>
      ) : (
        <div className="overflow-x-auto border rounded">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left">Phone</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Flow</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Created</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>

            <tbody>
              {leads.map(lead => (
                <tr key={lead.id} className="border-t">
                  <td className="px-4 py-3">{lead.phone}</td>
                  <td className="px-4 py-3">{lead.email}</td>
                  <td className="px-4 py-3 capitalize">
                    {lead.insurence_category}
                  </td>
                  <td className="px-4 py-3 capitalize">
                    {lead.policy_flow}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={lead.status} />
                  </td>
                  <td className="px-4 py-3">
                    {new Date(lead.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 space-x-3">
                    <Link
                      href={`/leads/${lead.id}`}
                      className="text-blue-600 underline"
                    >
                      View
                    </Link>

                    {lead.status === 'new_lead' && (
                      <Link
                        href={`/leads/${lead.id}/send-form`}
                        className="text-green-600 underline"
                      >
                        Send Form
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const color =
    status === 'new_lead'
      ? 'bg-yellow-100 text-yellow-800'
      : status === 'form_sent'
      ? 'bg-blue-100 text-blue-800'
      : status === 'active'
      ? 'bg-green-100 text-green-800'
      : 'bg-gray-100 text-gray-800'

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${color}`}>
      {status.replace('_', ' ')}
    </span>
  )
}
