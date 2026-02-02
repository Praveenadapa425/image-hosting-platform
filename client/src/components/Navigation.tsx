import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutGrid, Shield, Menu, X } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Navigation() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [open, setOpen] = useState(false);

  const isAdmin = !!user;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo / Brand */}
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <LayoutGrid className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight font-display">Srinivas</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          <Link 
            href="/" 
            className={`text-sm font-medium transition-colors hover:text-primary ${location === "/" ? "text-primary" : "text-muted-foreground"}`}
          >
            Public View
          </Link>
          
          {isAdmin && (
            <Link 
              href="/admin" 
              className={`text-sm font-medium transition-colors hover:text-primary ${location.startsWith("/admin") ? "text-primary" : "text-muted-foreground"}`}
            >
              Dashboard
            </Link>
          )}

          {isAdmin ? (
            <Button variant="ghost" size="sm" onClick={() => logout()} className="gap-2 text-muted-foreground hover:text-destructive">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          ) : (
            <Link href="/auth">
              <Button variant="outline" size="sm" className="gap-2">
                <Shield className="h-4 w-4" />
                Admin Login
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col gap-6 mt-8">
                <Link href="/" onClick={() => setOpen(false)} className="text-lg font-medium hover:text-primary">
                  Public Gallery
                </Link>
                {isAdmin && (
                  <Link href="/admin" onClick={() => setOpen(false)} className="text-lg font-medium hover:text-primary">
                    Dashboard
                  </Link>
                )}
                <div className="h-px bg-border my-2" />
                {isAdmin ? (
                  <Button variant="destructive" className="w-full justify-start gap-2" onClick={() => { logout(); setOpen(false); }}>
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                ) : (
                  <Link href="/auth" onClick={() => setOpen(false)}>
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <Shield className="h-4 w-4" />
                      Admin Login
                    </Button>
                  </Link>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
