import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function POST(req: Request) {
  try {
    const { leadId, stageId, stageMetadata } = await req.json()

    if (!leadId || !stageId) {
      return NextResponse.json(
        { error: 'Missing parameters' },
        { status: 400 }
      )
    }

    /* ================= FETCH LEAD ================= */
    const { data: lead, error: leadError } = await supabaseServer
      .from('temp_leads_basics')
      .select('id, stage_metadata')
      .eq('id', leadId)
      .single()

    if (leadError || !lead) {
      return NextResponse.json(
        { error: 'Invalid lead' },
        { status: 404 }
      )
    }

    /* ================= FETCH STAGE ================= */
    const { data: stage, error: stageError } = await supabaseServer
      .from('pipeline_stages')
      .select('stage_name, mandatory_fields')
      .eq('id', stageId)
      .single()

    if (stageError || !stage) {
      return NextResponse.json(
        { error: 'Invalid stage' },
        { status: 400 }
      )
    }

    const mandatoryFields = stage.mandatory_fields || {}

    const mergedMetadata = {
      ...(lead.stage_metadata || {}),
      ...(stageMetadata || {}),
    }

    /* ================= MANDATORY CHECKLIST VALIDATION ================= */
    const missingFields: string[] = []

    for (const key of Object.keys(mandatoryFields)) {
      const fieldConfig = mandatoryFields[key]
      const value = mergedMetadata[key]

      if (
        fieldConfig?.required === true &&
        (value === undefined || value === null || value === '')
      ) {
        missingFields.push(key)
      }
    }

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: 'Missing required checklist fields',
          missingFields,
        },
        { status: 400 }
      )
    }
    /* ================= DATE VALIDATION ================= */
if (stageMetadata?.target_completion_date) {
  const selectedDate = new Date(stageMetadata.target_completion_date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (selectedDate < today) {
    return NextResponse.json(
      { error: 'Backdated target completion date is not allowed' },
      { status: 400 }
    )
  }
}


    /* ================= BUSINESS RULE ================= */
    if (stage.stage_name === 'Quote Has Been Emailed') {
      const emailAlreadySent =
        lead.stage_metadata?.email_sent === true ||
        mergedMetadata.email_sent === true

      if (!emailAlreadySent) {
        return NextResponse.json(
          {
            error:
              'Initial email must be sent before moving to this stage',
          },
          { status: 400 }
        )
      }
    }

    /* ================= UPDATE LEAD ================= */
    const { error: updateError } = await supabaseServer
      .from('temp_leads_basics')
      .update({
        current_stage_id: stageId,
        stage_metadata: mergedMetadata,
      })
      .eq('id', leadId)

    if (updateError) {
      console.error(updateError)
      return NextResponse.json(
        { error: 'Failed to update stage' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
