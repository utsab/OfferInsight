import TabNav from "@/app/ui/dashboard/tabnav";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col">
      <TabNav />
      <div className="flex-grow p-6 md:p-12 overflow-y-auto">{children}</div>
    </div>
  );
}
