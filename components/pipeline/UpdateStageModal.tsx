'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Props = {
  leadId: string
  pipelineId: string
  onClose: () => void
  onSuccess: () => void
}

export default function UpdateStageModal({
  leadId,
  pipelineId,
  onClose,
  onSuccess,
}: Props) {
  const [stages, setStages] = useState<any[]>([])
  const [selectedStageId, setSelectedStageId] = useState<string>('')
  const [mandatoryFields, setMandatoryFields] = useState<Record<string, boolean>>({})
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  /* ================= LOAD STAGES ================= */
  useEffect(() => {
    if (!pipelineId) {
      alert('Pipeline ID missing. Please refresh the page.')
      return
    }
    loadStages()
  }, [pipelineId])

  async function loadStages() {
    setLoading(true)

    const { data, error } = await supabase
      .from('pipeline_stages')
      .select('*')
      .eq('pipeline_id', pipelineId)
      .order('stage_order')

    if (error) {
      console.error(error)
      alert('Failed to load pipeline stages')
      setLoading(false)
      return
    }

    setStages(data || [])
    setLoading(false)
  }

  /* ================= VALIDATION ================= */
  function validate() {
    for (const key in mandatoryFields) {
      if (mandatoryFields[key] && !formData[key]) {
        alert(`Please fill ${key.replaceAll('_', ' ')}`)
        return false
      }
    }
    return true
  }

  /* ================= SAVE ================= */
  async function handleSave() {
    if (!selectedStageId) {
      alert('Please select a status')
      return
    }

    if (!validate()) return

    /**
     * IMPORTANT:
     * - stage_metadata must ALWAYS be a full JSON object
     * - Never spread dynamic fields directly into table columns
     */
    const { error } = await supabase
      .from('temp_leads_basics')
      .update({
        current_stage_id: selectedStageId,
        stage_metadata: formData, // ✅ CORRECT JSON STORAGE
      })
      .eq('id', leadId)

    if (error) {
      console.error(error)
      alert('Failed to update stage')
      return
    }

    onSuccess()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded w-full max-w-lg space-y-4">
        <h2 className="text-lg font-semibold">Update Status</h2>

        {loading ? (
          <p>Loading stages...</p>
        ) : (
          <select
            className="w-full border p-2"
            value={selectedStageId}
            onChange={(e) => {
              const stageId = e.target.value
              setSelectedStageId(stageId)

              const stage = stages.find(s => s.id === stageId)

              setMandatoryFields(stage?.mandatory_fields || {})
              setFormData({}) // reset metadata for new stage
            }}
          >
            <option value="">Select new status</option>
            {stages.map(stage => (
              <option key={stage.id} value={stage.id}>
                {stage.stage_name}
              </option>
            ))}
          </select>
        )}

        {Object.keys(mandatoryFields).map(field => (
          <div key={field}>
            <label className="block text-sm font-medium">
              {field.replaceAll('_', ' ')}
            </label>
            <input
              className="w-full border p-2"
              value={formData[field] || ''}
              onChange={(e) =>
                setFormData({ ...formData, [field]: e.target.value })
              }
            />
          </div>
        ))}

        <div className="flex justify-end gap-3 pt-4">
          <button onClick={onClose} className="px-4 py-2 border rounded">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            Save Status
          </button>
        </div>
      </div>
    </div>
  )
}
