'use client'

type Props = {
  data: any
  onChange: (field: string, value: any) => void
  disabled?: boolean
}

export default function CondoInsuranceForm({
  data,
  onChange,
  disabled = false,
}: Props) {
  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-green-100 text-green-600">
          🏢
        </div>
        <div>
          <h2 className="text-lg font-semibold">
            Condo Insurance Details
          </h2>
          <p className="text-sm text-gray-500">
            Please provide the following details for your quote
          </p>
        </div>
      </div>

      {/* FORM GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Condo Address */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Condo Address *
          </label>
          <input
            type="text"
            placeholder="Enter condo address"
            value={data.condo_address || ''}
            disabled={disabled}
            onChange={(e) => onChange('condo_address', e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {/* Unit Number */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Unit Number *
          </label>
          <input
            type="text"
            placeholder="Enter unit number"
            value={data.unit_number || ''}
            disabled={disabled}
            onChange={(e) => onChange('unit_number', e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {/* Square Footage */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Square Footage *
          </label>
          <input
            type="number"
            placeholder="Enter square footage"
            value={data.square_footage || ''}
            disabled={disabled}
            onChange={(e) => onChange('square_footage', e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {/* HOA Name */}
        <div>
          <label className="block text-sm font-medium mb-1">
            HOA Name *
          </label>
          <input
            type="text"
            placeholder="Enter HOA name"
            value={data.hoa_name || ''}
            disabled={disabled}
            onChange={(e) => onChange('hoa_name', e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {/* Interior Coverage */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Interior Coverage Amount ($) *
          </label>
          <input
            type="number"
            placeholder="Enter interior coverage amount ($)"
            value={data.interior_coverage || ''}
            disabled={disabled}
            onChange={(e) => onChange('interior_coverage', e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {/* Prior Claims */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Prior Claims *
          </label>
          <select
            value={data.prior_claims || ''}
            disabled={disabled}
            onChange={(e) => onChange('prior_claims', e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Select Prior Claims</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
      </div>

      {/* DOCUMENT UPLOAD (UI ONLY FOR NOW) */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Document Upload
        </label>
        <div className="border-2 border-dashed rounded-lg p-6 text-center text-sm text-gray-500">
          <div className="text-2xl mb-2">⬆️</div>
          <p>
            Click to upload or drag and drop
          </p>
          <p className="text-xs text-gray-400">
            PDF, PNG, JPG (max 10MB)
          </p>
        </div>
      </div>

      {/* TERMS */}
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          checked={data.terms_accepted || false}
          disabled={disabled}
          onChange={(e) => onChange('terms_accepted', e.target.checked)}
        />
        <p className="text-sm">
          I agree to the{' '}
          <span className="text-green-600 underline cursor-pointer">
            Terms & Conditions
          </span>{' '}
          and{' '}
          <span className="text-green-600 underline cursor-pointer">
            Privacy Policy
          </span>
        </p>
      </div>

    </div>
  )
}
