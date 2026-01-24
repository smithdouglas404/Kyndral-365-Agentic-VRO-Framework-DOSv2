import { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface WorkspaceTab {
  id: string;
  label: string;
  icon?: ReactNode;
  content: ReactNode;
}

interface WorkspaceLayoutProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  tabs: WorkspaceTab[];
  defaultTab?: string;
  headerActions?: ReactNode;
  className?: string;
}

export function WorkspaceLayout({
  title,
  description,
  icon,
  tabs,
  defaultTab,
  headerActions,
  className,
}: WorkspaceLayoutProps) {
  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Workspace Header */}
      <div className="border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                {icon}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
              {description && (
                <p className="text-sm text-gray-500 mt-0.5">{description}</p>
              )}
            </div>
          </div>
          {headerActions && <div className="flex items-center gap-2">{headerActions}</div>}
        </div>
      </div>

      {/* Workspace Content with Tabs */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue={defaultTab || tabs[0]?.id} className="h-full flex flex-col">
          {/* Tab Navigation */}
          <div className="border-b bg-gray-50 px-6">
            <TabsList className="h-12 bg-transparent p-0 gap-1">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="data-[state=active]:bg-white data-[state=active]:border-t-2 data-[state=active]:border-t-blue-600 rounded-t-md rounded-b-none px-4 h-12 flex items-center gap-2"
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-auto bg-gray-50">
            {tabs.map((tab) => (
              <TabsContent
                key={tab.id}
                value={tab.id}
                className="h-full m-0 p-6 focus-visible:ring-0"
              >
                {tab.content}
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </div>
    </div>
  );
}
