import { Flame, Link as LinkIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { GetWriterDesk } from '../../wailsjs/go/main/App'
import type { main } from '../../wailsjs/go/models'
import AllResearchModal from './AllResearchModal'
import ProgressRing from './ProgressRing'
import { formatNumber } from '../lib/formatNumber'
import { hostFromURL } from '../lib/hostFromURL'

export default function WritersDesk() {
  const [desk, setDesk] = useState<main.WriterDesk | null>(null)
  const [allOpen, setAllOpen] = useState(false)

  useEffect(() => {
    GetWriterDesk().then(setDesk).catch(() => setDesk(null))
  }, [])

  if (!desk) return <div className="h-full" />

  const pct = desk.dailyGoal > 0 ? (desk.wordsToday / desk.dailyGoal) * 100 : 0

  return (
    <aside className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-night-500/60 dark:bg-night-700/70">
      <h2 className="font-serif text-lg text-neutral-900 dark:text-neutral-50">Writer's Desk</h2>

      <section className="mt-5 flex items-start gap-3 rounded-xl bg-neutral-50 p-3 dark:bg-night-600/60">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-500/15">
          <Flame className="h-5 w-5 text-accent-500" />
        </div>
        <div>
          <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
            {desk.streakDays}-Day Writing Streak
          </div>
          <div className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">{desk.streakMessage}</div>
        </div>
      </section>

      <section className="mt-6">
        <div className="text-[11px] font-semibold tracking-wider text-neutral-400 dark:text-neutral-500">
          TODAY'S PROGRESS
        </div>
        <div className="mt-3 flex items-center gap-4">
          <ProgressRing pct={pct} />
          <div>
            <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
              {formatNumber(desk.wordsToday)} / {formatNumber(desk.dailyGoal)} words
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">Daily session target</div>
          </div>
        </div>
      </section>

      <section className="mt-6">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-semibold tracking-wider text-neutral-400 dark:text-neutral-500">
            QUICK RESEARCH LINKS
          </div>
          <button
            onClick={() => setAllOpen(true)}
            className="text-xs font-medium text-accent-500 hover:underline"
          >
            View All
          </button>
        </div>
        <ul className="mt-3 space-y-2">
          {desk.quickResearch.map(link => (
            <li key={link.id} className="flex items-start gap-2 rounded-lg bg-neutral-50 p-3 dark:bg-night-600/60">
              <span className="mt-0.5">
                <LinkIcon className="h-3.5 w-3.5 text-accent-500" />
              </span>
              <div className="min-w-0">
                <div className="truncate text-sm text-neutral-800 dark:text-neutral-100">{link.title}</div>
                <div className="truncate text-[11px] text-neutral-400 dark:text-neutral-500">
                  {hostFromURL(link.url)}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <AllResearchModal open={allOpen} onOpenChange={setAllOpen} />
    </aside>
  )
}
