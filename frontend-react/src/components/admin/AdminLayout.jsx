import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import AdminSidebar from './Sidebar'
import AdminTopBar from './AdminTopBar'

const AdminLayout = ({ children, onSearch }) => {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex selection:bg-indigo-500 selection:text-white">
      {/* Fixed Admin Sidebar */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="ml-64 flex-1 flex flex-col min-w-0">
        <AdminTopBar onSearch={onSearch} />
        <AnimatePresence mode="wait">
          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, y: 14, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
            transition={{
              duration: 0.28,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="flex-1 p-6 sm:p-8 max-w-[1600px] w-full mx-auto"
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default AdminLayout