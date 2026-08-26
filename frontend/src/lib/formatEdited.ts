const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const monthFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

export function formatEdited(iso: string | Date): string {
  const then = typeof iso === 'string' ? new Date(iso) : iso
  const now = new Date()
  const diff = now.getTime() - then.getTime()

  if (diff < HOUR) {
    const mins = Math.max(1, Math.floor(diff / MINUTE))
    return `Edited ${mins} minute${mins === 1 ? '' : 's'} ago`
  }
  if (diff < DAY) {
    const hrs = Math.floor(diff / HOUR)
    return `Edited ${hrs} hour${hrs === 1 ? '' : 's'} ago`
  }
  if (isYesterday(then, now)) return 'Edited Yesterday'
  if (diff < 7 * DAY) {
    const days = Math.floor(diff / DAY)
    return `Edited ${days} days ago`
  }
  return `Edited ${monthFmt.format(then)}`
}

function isYesterday(then: Date, now: Date): boolean {
  const y = new Date(now)
  y.setDate(y.getDate() - 1)
  return then.getFullYear() === y.getFullYear() && then.getMonth() === y.getMonth() && then.getDate() === y.getDate()
}
