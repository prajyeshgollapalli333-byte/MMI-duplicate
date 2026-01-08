'use client'

type Props = {
  data: any
  onChange: (field: string, value: any) => void
  disabled?: boolean
}

export default function LandlordHomeInsuranceForm({
  data,
  onChange,
  disabled = false,
}: Props) {
  return (
    <div className="bg-[#F1FFFB] border border-[#C7EDE3] rounded-xl p-6 space-y-6">

      {/* ---------- HEADER ---------- */}
      <div className="flex items-center gap-3">
        <div className="bg-emerald-500 text-white p-2 rounded-lg">
          🏠
        </div>
        <div>
          <h2 className="text-lg font-semibold">
            Landlord Home Insurance Details
          </h2>
          <p className="text-sm text-gray-500">
            Please provide the following details for your quote
          </p>
        </div>
      </div>

      {/* ---------- ROW 1 ---------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Property Address"
          required
          value={data.property_address}
          disabled={disabled}
          onChange={v => onChange('property_address', v)}
        />

        <Input
          label="Number of Units"
          required
          value={data.number_of_units}
          disabled={disabled}
          onChange={v => onChange('number_of_units', v)}
        />
      </div>

      {/* ---------- ROW 2 ---------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Rental Type"
          required
          value={data.rental_type}
          disabled={disabled}
          onChange={v => onChange('rental_type', v)}
          options={[
            'Single Family',
            'Multi Family',
            'Short Term Rental',
            'Long Term Rental',
          ]}
        />

        <Select
          label="Currently Tenant Occupied"
          required
          value={data.tenant_occupied}
          disabled={disabled}
          onChange={v => onChange('tenant_occupied', v)}
          options={['Yes', 'No']}
        />
      </div>

      {/* ---------- ROW 3 ---------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Coverage Amount ($)"
          required
          value={data.coverage_amount}
          disabled={disabled}
          onChange={v => onChange('coverage_amount', v)}
        />

        <Select
          label="Loss History (Past 5 Years)"
          required
          value={data.loss_history}
          disabled={disabled}
          onChange={v => onChange('loss_history', v)}
          options={[
            'None',
            '1 Claim',
            '2 Claims',
            '3+ Claims',
          ]}
        />
      </div>

      {/* ---------- DOCUMENT UPLOAD (UI ONLY FOR NOW) ---------- */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Document Upload
        </label>

        <div className="border-2 border-dashed rounded-lg p-6 text-center text-sm text-gray-500 bg-white">
          <p className="font-medium text-emerald-600">
            Click to upload
          </p>
          <p className="text-xs mt-1">
            PDF, PNG, JPG (max 10MB)
          </p>
          {/* Actual upload wiring later */}
        </div>
      </div>

      {/* ---------- TERMS ---------- */}
      <div className="flex items-center gap-2 text-sm">
        <input type="checkbox" disabled={disabled} />
        <span>
          I agree to the{' '}
          <span className="text-emerald-600 underline cursor-pointer">
            Terms & Conditions
          </span>{' '}
          and{' '}
          <span className="text-emerald-600 underline cursor-pointer">
            Privacy Policy
          </span>
        </span>
      </div>
    </div>
  )
}

/* ================= REUSABLE INPUT ================= */

function Input({
  label,
  value,
  onChange,
  required,
  disabled,
}: any) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">
        {label} {required && '*'}
      </label>
      <input
        value={value || ''}
        disabled={disabled}
        onChange={e => onChange(e.target.value)}
        className="w-full border rounded-lg px-3 py-2 disabled:bg-gray-100"
        placeholder={`Enter ${label.toLowerCase()}`}
      />
    </div>
  )
}

/* ================= REUSABLE SELECT ================= */

function Select({
  label,
  value,
  onChange,
  options,
  required,
  disabled,
}: any) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">
        {label} {required && '*'}
      </label>
      <select
        value={value || ''}
        disabled={disabled}
        onChange={e => onChange(e.target.value)}
        className="w-full border rounded-lg px-3 py-2 disabled:bg-gray-100"
      >
        <option value="">Select {label}</option>
        {options.map((opt: string) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  )
}
