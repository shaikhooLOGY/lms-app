'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type TabLink = {
  href: string
  label: string
  icon?: React.ReactNode
}

type TabBarMobileProps = {
  tabs: TabLink[]
}

export default function TabBarMobile({ tabs }: TabBarMobileProps) {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-4 left-1/2 z-40 w-[92%] -translate-x-1/2 rounded-2xl border border-purple-700/50 bg-[#0f0a1a]/95 px-3 py-2 shadow-[0_20px_45px_-20px_rgba(124,58,237,0.8)] backdrop-blur md:hidden">
      <ul className="flex items-center justify-between text-xs font-medium text-purple-200">
        {tabs.map((tab) => {
          const active = pathname.startsWith(tab.href)
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={[
                  'flex flex-col items-center gap-1 rounded-xl px-3 py-2',
                  active ? 'bg-purple-600/30 text-white' : 'text-purple-300 hover:text-white',
                ].join(' ')}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
