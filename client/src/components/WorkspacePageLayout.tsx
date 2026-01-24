import { ReactNode } from "react";
import { WorkspaceSidebar } from "./WorkspaceSidebar";

interface WorkspacePageLayoutProps {
  children: ReactNode;
  userRole?: string;
}

export function WorkspacePageLayout({ children, userRole }: WorkspacePageLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <WorkspaceSidebar userRole={userRole} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
