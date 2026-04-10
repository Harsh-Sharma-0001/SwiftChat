import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Sidebar from './Sidebar';
import RightPanel from './RightPanel';
import ChatbotWidget from '../ai/ChatbotWidget';

export default function Layout() {
  const { isSidebarOpen, isRightPanelOpen } = useSelector((state) => state.ui);

  return (
    <div className="app-layout h-screen overflow-hidden">
      {isSidebarOpen && <Sidebar />}
      
      <main className="flex-1 overflow-y-auto relative bg-sc-bg">
        <Outlet />
      </main>
      
      {isRightPanelOpen && <RightPanel />}

      <ChatbotWidget />
    </div>
  );
}
