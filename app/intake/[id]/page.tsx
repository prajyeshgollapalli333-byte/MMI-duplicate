'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

import HomeInsuranceForm from '@/components/forms/HomeInsuranceForm'
import AutoInsuranceForm from '@/components/forms/AutoInsuranceForm'
import CondoInsuranceForm from '@/components/forms/CondoInsuranceForm'

export default function IntakeFormPage() {
  const params = useParams()
  const intakeId = params.id as string

  const searchParams = useSearchParams()
  const isPreview = searchParams.get('preview') === 'true'

  const [formType, setFormType] = useState<string | null>(null)
  const [formData, setFormData] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /* ================= LOAD INTAKE FORM ================= */
  useEffect(() => {
    if (!intakeId) {
      setError('Invalid intake link')
      setLoading(false)
      return
    }

    const loadIntake = async () => {
      const { data, error } = await supabase
        .from('temp_intake_forms')
        .select('*')
        .eq('id', intakeId)
        .maybeSingle()

      if (error || !data) {
        setError('Form not found')
        setLoading(false)
        return
      }

      if (!data.form_type) {
        setError('Form type not assigned')
        setLoading(false)
        return
      }

      setFormType(data.form_type)
      setFormData(data.form_data || {})
      setLoading(false)
    }

    loadIntake()
  }, [intakeId])

  /* ================= FORM FIELD CHANGE ================= */
  const handleFieldChange = (field: string, value: any) => {
    if (isPreview) return

    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  /* ================= SUBMIT FORM ================= */
  const handleSubmit = async () => {
    if (isPreview) return

    setError(null)

    const { error: updateError } = await supabase
      .from('temp_intake_forms')
      .update({
        form_data: formData,
        status: 'completed',
        submitted_at: new Date().toISOString(),
      })
      .eq('id', intakeId)

    if (updateError) {
      setError(updateError.message)
      return
    }

    // Email / Edge function (optional for now)
    try {
      await fetch(
        'https://welhzcasuabhqoccfxtu.functions.supabase.co/notify-csr-on-submit',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ intake_id: intakeId }),
        }
      )
    } catch (err) {
      console.error('CSR email notification failed:', err)
    }

    setSubmitted(true)
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

  if (submitted) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-2xl font-semibold">Thank you!</h2>
        <p className="mt-2">
          Your form has been submitted successfully.
        </p>
      </div>
    )
  }

  /* ================= RENDER FORM ================= */
  return (
    <div className="max-w-3xl mx-auto p-10">
      <h1 className="text-2xl font-semibold mb-6">
        Insurance Intake Form
      </h1>

      {isPreview && (
        <div className="mb-6 p-3 bg-yellow-100 border rounded text-sm">
          🔍 Preview Mode — CSR only
        </div>
      )}

      {/* 🏠 HOME INSURANCE */}
      {formType === 'home' && (
        <HomeInsuranceForm
          data={formData}
          onChange={handleFieldChange}
          disabled={isPreview}
        />
      )}

      {/* 🚗 AUTO INSURANCE */}
      {formType === 'auto' && (
        <AutoInsuranceForm
          data={formData}
          onChange={handleFieldChange}
          disabled={isPreview}
        />
      )}

      {/* 🏢 CONDO INSURANCE */}
      {formType === 'condo' && (
        <CondoInsuranceForm
          data={formData}
          onChange={handleFieldChange}
          disabled={isPreview}
        />
      )}

      {!isPreview && (
        <button
          onClick={handleSubmit}
          className="mt-6 w-full bg-green-600 text-white py-3 rounded"
        >
          Submit Form
        </button>
      )}
    </div>
  )
}
