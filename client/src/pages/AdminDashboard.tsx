import { Navigation } from "@/components/Navigation";
import { AdminUploadCard } from "@/components/AdminUploadCard";
import { UploadModal } from "@/components/UploadModal";
import { useAdminUploads } from "@/hooks/use-uploads";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useLocation } from "wouter";

export default function AdminDashboard() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Redirect if not logged in
  if (!isAuthLoading && !user) {
    setLocation("/auth");
    return null;
  }

  const { data: uploads, isLoading: isUploadsLoading } = useAdminUploads();

  // Filter uploads locally for speed
  const filteredUploads = uploads?.filter(upload => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      upload.publicText.toLowerCase().includes(term) || 
      (upload.privateText || "").toLowerCase().includes(term) ||
      upload.folderName.toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold font-display">Dashboard</h1>
            <p className="text-muted-foreground text-sm">Manage your gallery content</p>
          </div>
          <UploadModal />
        </div>

        {/* Search / Filter Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search uploads by description, note, or folder..." 
            className="pl-10 bg-muted/20 border-border/60"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {isAuthLoading || isUploadsLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !filteredUploads?.length ? (
          <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
            <p className="text-muted-foreground">No uploads found.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredUploads.map((upload) => (
              <AdminUploadCard key={upload.id} upload={upload} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
