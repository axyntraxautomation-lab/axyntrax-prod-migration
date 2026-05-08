import { Outlet } from 'react-router'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import AxiaChatWidget from '@/components/chat/AxiaChatWidget'

export function MainLayout() {
  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <div className="flex-1 ml-[260px] flex flex-col transition-all duration-200">
        <Topbar />
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <AxiaChatWidget />
    </div>
  )
}
