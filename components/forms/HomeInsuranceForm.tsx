'use client'

type Props = {
  data: any
  onChange: (field: string, value: any) => void
  disabled?: boolean
}

export default function HomeInsuranceForm({
  data,
  onChange,
  disabled = false,
}: Props) {
  return (
    <div className="bg-[#F1FFFB] border rounded-xl p-6 space-y-6">

      {/* ---------- HEADER ---------- */}
      <div className="flex items-center gap-3">
        <div className="bg-emerald-500 text-white p-2 rounded-lg">
          🏠
        </div>
        <div>
          <h2 className="text-lg font-semibold">
            Home Insurance Details
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
          label="Year Built"
          type="number"
          required
          value={data.year_built}
          disabled={disabled}
          onChange={v => onChange('year_built', Number(v))}
        />
      </div>

      {/* ---------- ROW 2 ---------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Square Footage"
          type="number"
          required
          value={data.square_footage}
          disabled={disabled}
          onChange={v => onChange('square_footage', Number(v))}
        />

        <Select
          label="Construction Type"
          required
          disabled={disabled}
          value={data.construction_type}
          onChange={v => onChange('construction_type', v)}
          options={['Wood', 'Brick', 'Concrete', 'Steel']}
        />
      </div>

      {/* ---------- ROW 3 ---------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Occupancy Type"
          required
          disabled={disabled}
          value={data.occupancy_type}
          onChange={v => onChange('occupancy_type', v)}
          options={['Owner Occupied', 'Tenant Occupied', 'Vacant']}
        />

        <Input
          label="Desired Coverage Amount ($)"
          type="number"
          required
          value={data.coverage_amount}
          disabled={disabled}
          onChange={v => onChange('coverage_amount', Number(v))}
        />
      </div>

      {/* ---------- PRIOR CLAIMS ---------- */}
      <Select
        label="Prior Claims"
        required
        disabled={disabled}
        value={data.prior_claims}
        onChange={v => onChange('prior_claims', v)}
        options={['None', '1 Claim', '2 Claims', 'More than 2']}
      />

      {/* ---------- DOCUMENT UPLOAD (WORKING) ---------- */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Upload Property Documents
        </label>

        <label className="block border-2 border-dashed rounded-lg p-6 text-center text-sm cursor-pointer bg-white hover:bg-emerald-50">
          <input
            type="file"
            disabled={disabled}
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={e =>
              onChange('uploaded_documents', e.target.files)
            }
          />
          <p className="font-medium text-emerald-600">
            Click to upload files
          </p>
          <p className="text-xs mt-1">
            PDF, PNG, JPG (max 10MB)
          </p>
        </label>
      </div>

      {/* ---------- TERMS ---------- */}
      <div className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          disabled={disabled}
          checked={data.terms_accepted || false}
          onChange={e =>
            onChange('terms_accepted', e.target.checked)
          }
        />
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

/* ================= INPUT ================= */

function Input({
  label,
  value,
  onChange,
  required,
  disabled,
  type = 'text',
}: any) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">
        {label} {required && '*'}
      </label>
      <input
        type={type}
        value={value ?? ''}
        disabled={disabled}
        onChange={e => onChange(e.target.value)}
        className="w-full border rounded-lg px-3 py-2 disabled:bg-gray-100"
        placeholder={`Enter ${label.toLowerCase()}`}
      />
    </div>
  )
}

/* ================= SELECT ================= */

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
