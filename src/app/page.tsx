import { BottomNav } from "@/components/shared/BottomNav";
import { Sidebar } from "@/components/shared/Sidebar";
import { Dashboard } from "@/components/dashboard/Dashboard";

export default function HomePage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 pb-20 lg:pb-0">
        <Dashboard />
      </main>
      <BottomNav />
    </div>
  );
}
