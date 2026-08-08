import { useState } from 'react'
import CompanySidebar from './CompanySidebar'
import AppTopBar from '../AppTopBar'

const CompanyLayout = ({ children }) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <AppTopBar role="company" onOpenSidebar={() => setMobileSidebarOpen(true)} />

      <CompanySidebar mobileOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />

      {mobileSidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-gray-900/45 md:hidden"
        />
      )}

      <main className="min-w-0 md:ml-64 flex-1 px-4 pb-6 pt-20 sm:px-6 md:px-8 md:pb-8 md:pt-24">
        {children}
      </main>
    </div>
  )
}

export default CompanyLayout
