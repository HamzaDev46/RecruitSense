import AdminSidebar from './Sidebar'
import AdminTopBar from './AdminTopBar'

const AdminLayout = ({ children, onSearch }) => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Fixed Admin Sidebar */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="ml-64 flex-1 flex flex-col min-w-0">
        <AdminTopBar onSearch={onSearch} />
        <main className="flex-1 p-6 sm:p-8 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

export default AdminLayout