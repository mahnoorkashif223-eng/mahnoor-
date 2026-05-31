import { Outlet, Link } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default function Layout() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/organizations"
            className="text-lg font-semibold tracking-tight hover:opacity-80 transition-opacity"
          >
            Admin Dashboard
          </Link>

          <div className="flex items-center gap-3">
            {user?.email && (
              <span className="text-sm text-muted-foreground truncate max-w-[200px] sm:max-w-xs">
                {user.email}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut()}
              className="shrink-0"
            >
              <LogOut className="h-4 w-4 mr-1.5" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
