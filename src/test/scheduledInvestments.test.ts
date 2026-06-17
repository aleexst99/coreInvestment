import { describe, it, expect } from 'vitest'

// We extract the getNextDate logic to test it independently
function getNextDate(date: Date, frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly'): Date {
  const next = new Date(date)
  switch (frequency) {
    case 'weekly':    next.setDate(next.getDate() + 7);   break
    case 'biweekly':  next.setDate(next.getDate() + 14);  break
    case 'monthly':   next.setMonth(next.getMonth() + 1); break
    case 'quarterly': next.setMonth(next.getMonth() + 3); break
  }
  return next
}

describe('getNextDate', () => {
  it('adds 7 days for weekly frequency', () => {
    const date = new Date('2025-01-01')
    const next = getNextDate(date, 'weekly')
    expect(next.toISOString().split('T')[0]).toBe('2025-01-08')
  })

  it('adds 14 days for biweekly frequency', () => {
    const date = new Date('2025-01-01')
    const next = getNextDate(date, 'biweekly')
    expect(next.toISOString().split('T')[0]).toBe('2025-01-15')
  })

  it('adds 1 month for monthly frequency', () => {
    const date = new Date('2025-01-01')
    const next = getNextDate(date, 'monthly')
    expect(next.toISOString().split('T')[0]).toBe('2025-02-01')
  })

  it('adds 3 months for quarterly frequency', () => {
    const date = new Date(2025, 0, 1) // Jan 1 2025 in local time
    const next = getNextDate(date, 'quarterly')
    expect(next.getMonth()).toBe(3) // April = month 3
    expect(next.getDate()).toBe(1)
  })

  it('does not mutate the original date', () => {
    const date = new Date('2025-01-01')
    const original = date.toISOString()
    getNextDate(date, 'monthly')
    expect(date.toISOString()).toBe(original)
  })
})
