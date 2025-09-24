import TabNav from "@/app/ui/dashboard/tabnav";
import { ProgressSidebar } from "@/app/ui/dashboard/progress-sidebar";
import { DashboardMetricsProvider } from "@/app/contexts/DashboardMetricsContext";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col">
      <DashboardMetricsProvider>
        <TabNav />
        <div className="flex flex-1 overflow-hidden">
          <ProgressSidebar />
          <div className="flex-1 p-6 md:p-12 overflow-y-auto">{children}</div>
        </div>
      </DashboardMetricsProvider>
    </div>
  );
}
