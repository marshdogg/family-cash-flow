import { BottomNav } from "@/components/shared/BottomNav";
import { Sidebar } from "@/components/shared/Sidebar";
import { Dashboard } from "@/components/dashboard/Dashboard";

export default function HomePage() {
  return (
    <div className="flex min-h-screen overflow-x-hidden">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-x-hidden pb-20 lg:pb-0">
        <Dashboard />
      </main>
      <BottomNav />
    </div>
  );
}
