import { ReactNode } from 'react';
import {
  LayoutDashboard,
  Upload,
  Activity,
  BookOpen,
  Settings,
} from 'lucide-react';

type TabType = 'ingestion' | 'monitor' | 'syllabus';

interface LayoutProps {
  children: ReactNode;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

interface NavItemProps {
  icon: ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function NavItem({ icon, label, isActive, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 w-full text-left rounded-lg transition-colors ${
        isActive
          ? 'bg-primary-600 text-white'
          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );
}

export function Layout({ children, activeTab, onTabChange }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 dark:text-white">WPI</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Control Tower</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          <NavItem
            icon={<Activity className="w-5 h-5" />}
            label="Workflow Monitor"
            isActive={activeTab === 'monitor'}
            onClick={() => onTabChange('monitor')}
          />
          <NavItem
            icon={<Upload className="w-5 h-5" />}
            label="Knowledge Ingestion"
            isActive={activeTab === 'ingestion'}
            onClick={() => onTabChange('ingestion')}
          />
          <NavItem
            icon={<BookOpen className="w-5 h-5" />}
            label="Syllabus Editor"
            isActive={activeTab === 'syllabus'}
            onClick={() => onTabChange('syllabus')}
          />
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button className="flex items-center gap-3 px-4 py-2 w-full text-left text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <Settings className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
