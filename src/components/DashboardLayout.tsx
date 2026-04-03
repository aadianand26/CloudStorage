import { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopHeader } from "@/components/TopHeader";

interface DashboardLayoutProps {
  children: ReactNode;
  onSearch?: (term: string) => void;
}

export const DashboardLayout = ({ children, onSearch }: DashboardLayoutProps) => {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col min-w-0">
          <TopHeader onSearch={onSearch} />
          
          <main className="flex-1 bg-background overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
