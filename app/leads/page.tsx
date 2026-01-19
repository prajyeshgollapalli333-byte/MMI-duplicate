'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

type Lead = {
  id: string
  client_name: string
  phone: string
  email: string
  insurence_category: string
  policy_flow: string
  status: string
  created_at: string
}

/* ✅ ALL FILTERS */
const STATUS_FILTERS = [
  { label: 'All', value: null },
  { label: 'New Leads', value: 'new_lead' },
  { label: 'Form Sent', value: 'form_sent' },
  { label: 'Form Submitted', value: 'form_submitted' },
  { label: 'Active', value: 'active' },
]

export default function MyLeadsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const statusFilter = searchParams.get('status')

  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  /* ================= LOAD LEADS ================= */
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
          client_name,
          phone,
          email,
          insurence_category,
          policy_flow,
          status,
          created_at
        `)
        .eq('assigned_csr', user.id)
        .order('created_at', { ascending: false })

      if (statusFilter) {
        query = query.eq('status', statusFilter)
      }

      const { data, error } = await query

      setLeads(error ? [] : data || [])
      setLoading(false)
    }

    loadLeads()
  }, [statusFilter])

  /* ================= FILTER HANDLER ================= */
  const applyFilter = (status: string | null) => {
    if (!status) {
      router.push('/leads')
    } else {
      router.push(`/leads?status=${status}`)
    }
  }

  /* ================= ACTION HANDLERS ================= */
  const handleAccept = async (leadId: string) => {
    await supabase
      .from('temp_leads_basics')
      .update({ status: 'active' })
      .eq('id', leadId)

    router.refresh()
  }

  const handleReject = async (leadId: string) => {
    await supabase
      .from('temp_leads_basics')
      .update({ status: 'rejected' })
      .eq('id', leadId)

    router.refresh()
  }

  return (
    <div className="p-8">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">My Leads</h1>

        <Link
          href="/leads/new"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
        >
          + New Lead
        </Link>
      </div>

      {/* FILTER TABS */}
      <div className="flex gap-3 mb-6">
        {STATUS_FILTERS.map(filter => {
          const isActive =
            (!filter.value && !statusFilter) ||
            filter.value === statusFilter

          return (
            <button
              key={filter.label}
              onClick={() => applyFilter(filter.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium border
                ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }
              `}
            >
              {filter.label}
            </button>
          )
        })}
      </div>

      {/* TABLE */}
      {loading ? (
        <p>Loading leads...</p>
      ) : leads.length === 0 ? (
        <p>No leads found.</p>
      ) : (
        <div className="overflow-x-auto bg-white border rounded-xl shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="px-4 py-3 text-left">Client Name</th>
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
                <tr key={lead.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">
                    {lead.client_name}
                  </td>
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

                  {/* ACTIONS */}
                  <td className="px-4 py-3 space-x-3">
                    <Link
                      href={`/leads/${lead.id}`}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      View
                    </Link>

                    {lead.status === 'new_lead' && (
                      <Link
                        href={`/leads/send-form?id=${lead.id}`}
                        className="text-green-600 hover:underline font-medium"
                      >
                        Send Initial Email
                      </Link>
                    )}

                    {lead.status === 'form_sent' && (
                      <span className="text-gray-400 text-sm">
                        Waiting for client
                      </span>
                    )}

                    {lead.status === 'form_submitted' && (
                      <>
                        <button
                          onClick={() => handleAccept(lead.id)}
                          className="text-green-600 hover:underline font-medium"
                        >
                          Accept
                        </button>

                        <button
                          onClick={() => handleReject(lead.id)}
                          className="text-red-600 hover:underline font-medium"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {lead.status === 'active' && (
                      <span className="text-green-700 font-medium text-sm">
                        Active
                      </span>
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

/* ================= STATUS BADGE ================= */
function StatusBadge({ status }: { status: string }) {
  const color =
    status === 'new_lead'
      ? 'bg-yellow-100 text-yellow-800'
      : status === 'form_sent'
      ? 'bg-blue-100 text-blue-800'
      : status === 'form_submitted'
      ? 'bg-purple-100 text-purple-800'
      : status === 'active'
      ? 'bg-green-100 text-green-800'
      : 'bg-gray-100 text-gray-800'

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${color}`}>
      {status.replace('_', ' ')}
    </span>
  )
}
