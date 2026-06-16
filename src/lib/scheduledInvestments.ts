import { supabase } from './supabase'
import type { ScheduledInvestment } from '../types'

// Calcula la siguiente fecha según la frecuencia
function getNextDate(date: Date, frequency: ScheduledInvestment['frequency']): Date {
  const next = new Date(date)
  switch (frequency) {
    case 'weekly':    next.setDate(next.getDate() + 7);   break
    case 'biweekly':  next.setDate(next.getDate() + 14);  break
    case 'monthly':   next.setMonth(next.getMonth() + 1); break
    case 'quarterly': next.setMonth(next.getMonth() + 3); break
  }
  return next
}

// Procesa todas las aportaciones programadas pendientes
export async function processScheduledInvestments(
  scheduledInvestments: ScheduledInvestment[],
  userId: string
) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const newInvestments = []

  for (const scheduled of scheduledInvestments) {
    if (!scheduled.is_active) continue

    let nextDate = new Date(scheduled.next_date)
    nextDate.setHours(0, 0, 0, 0)

    // Mientras la next_date sea hoy o anterior, registramos la aportación
    while (nextDate <= today) {
      newInvestments.push({
        user_id: userId,
        asset_id: scheduled.asset_id,
        amount: scheduled.amount,
        date: nextDate.toISOString().split('T')[0],
        type: 'scheduled' as const,
        notes: `Scheduled contribution (${scheduled.frequency})`,
      })

      // Calculamos la siguiente fecha
      nextDate = getNextDate(nextDate, scheduled.frequency)
    }

    // Actualizamos next_date en Supabase con la próxima fecha futura
    await supabase
      .from('scheduled_investments')
      .update({ next_date: nextDate.toISOString().split('T')[0] })
      .eq('id', scheduled.id)
  }

  // Insertamos todas las aportaciones generadas de una vez
  if (newInvestments.length > 0) {
    const { data } = await supabase
      .from('investments')
      .insert(newInvestments)
      .select('*, asset:assets(*)')

    return data ?? []
  }

  return []
}
