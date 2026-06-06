import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { SidebarNav } from "@/components/ui/sidebar-nav";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex min-h-screen bg-paper">
      <SidebarNav user={session.user} />
      {/* sm:ml-56 = 224px offset matching sidebar w-56 */}
      <main className="flex-1 min-w-0 sm:ml-56 pb-20 sm:pb-0">
        {children}
      </main>
    </div>
  );
}
