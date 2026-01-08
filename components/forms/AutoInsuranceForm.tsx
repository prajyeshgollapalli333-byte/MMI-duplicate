'use client'

type Props = {
  data: any
  onChange: (field: string, value: any) => void
  disabled?: boolean
}

export default function AutoInsuranceForm({
  data,
  onChange,
  disabled = false,
}: Props) {
  return (
    <div className="bg-[#F1FFFB] border rounded-xl p-6 space-y-6">

      {/* ---------- HEADER ---------- */}
      <div className="flex items-center gap-3">
        <div className="bg-teal-500 text-white p-2 rounded-lg">
          🚗
        </div>
        <div>
          <h2 className="text-lg font-semibold">
            Auto Insurance Details
          </h2>
          <p className="text-sm text-gray-500">
            Please provide the following details for your quote
          </p>
        </div>
      </div>

      {/* ---------- ROW 1 ---------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Vehicle Make"
          required
          value={data.vehicle_make}
          disabled={disabled}
          onChange={v => onChange('vehicle_make', v)}
        />

        <Input
          label="Vehicle Model"
          required
          value={data.vehicle_model}
          disabled={disabled}
          onChange={v => onChange('vehicle_model', v)}
        />
      </div>

      {/* ---------- ROW 2 ---------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Year"
          required
          value={data.vehicle_year}
          disabled={disabled}
          onChange={v => onChange('vehicle_year', v)}
        />

        <Input
          label="VIN Number"
          required
          value={data.vin_number}
          disabled={disabled}
          onChange={v => onChange('vin_number', v)}
        />
      </div>

      {/* ---------- ROW 3 ---------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Usage Type"
          required
          disabled={disabled}
          value={data.usage_type}
          onChange={v => onChange('usage_type', v)}
          options={[
            'Personal',
            'Commercial',
            'Rideshare',
          ]}
        />

        <Input
          label="Primary Driver Name"
          required
          value={data.primary_driver_name}
          disabled={disabled}
          onChange={v => onChange('primary_driver_name', v)}
        />
      </div>

      {/* ---------- ROW 4 ---------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="License Number"
          required
          value={data.license_number}
          disabled={disabled}
          onChange={v => onChange('license_number', v)}
        />

        <Select
          label="Accident History (Past 5 Years)"
          required
          disabled={disabled}
          value={data.accident_history}
          onChange={v => onChange('accident_history', v)}
          options={[
            'None',
            '1 Accident',
            '2 Accidents',
            'More than 2',
          ]}
        />
      </div>

      {/* ---------- DOCUMENT UPLOAD (UI ONLY) ---------- */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Document Upload
        </label>

        <label
          className={`border-2 border-dashed rounded-lg p-6 text-center text-sm
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white cursor-pointer'}
          `}
        >
          <input
            type="file"
            disabled={disabled}
            className="hidden"
          />

          <p className="font-medium text-teal-600">
            Click to upload or drag and drop
          </p>
          <p className="text-xs mt-1 text-gray-500">
            PDF, PNG, JPG (max 10MB)
          </p>
        </label>
      </div>

      {/* ---------- TERMS ---------- */}
      <div className="flex items-center gap-2 text-sm">
        <input type="checkbox" disabled={disabled} />
        <span>
          I agree to the{' '}
          <span className="text-teal-600 underline cursor-pointer">
            Terms & Conditions
          </span>{' '}
          and{' '}
          <span className="text-teal-600 underline cursor-pointer">
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
