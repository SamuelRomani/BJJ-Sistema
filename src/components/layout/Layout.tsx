import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'
import { useAutoSuspend } from '@/hooks/useAutoSuspend'
import { MobileNav } from './MobileNav'
import { GlobalSearch } from '@/components/GlobalSearch'
import { useEffect } from 'react'

export function Layout() {
  const { sidebarOpen, darkMode } = useStore()
  const location = useLocation()
  useAutoSuspend()

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  return (
    <div className={cn('min-h-screen flex', darkMode ? 'bg-slate-900' : 'bg-gray-50')}>
      <Sidebar />
      <div
        className={cn(
          'flex-1 flex flex-col min-w-0 transition-all duration-300',
          sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'
        )}
      >
        <Header />
        <main className="flex-1 p-4 sm:p-6 overflow-auto pb-20 lg:pb-6">
          <div key={location.pathname} className="animate-fade-in">
            <Outlet />
          </div>
        </main>
        <MobileNav />
      </div>
      <GlobalSearch />
    </div>
  )
}
