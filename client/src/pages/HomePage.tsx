import { Navigation } from "@/components/Navigation";
import { PublicGalleryGrid } from "@/components/PublicGalleryGrid";
import { usePublicUploads } from "@/hooks/use-uploads";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const { data: uploads, isLoading, error } = usePublicUploads();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-8 sm:mb-12 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-display tracking-tight text-foreground">
            Latest <span className="text-primary">Uploads</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl text-balance">
            Explore our curated collection of images directly from the field.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-24">
            <Loader2 className="w-10 h-10 animate-spin text-primary/50" />
          </div>
        ) : error ? (
          <div className="p-6 rounded-xl bg-destructive/5 text-destructive border border-destructive/20 text-center">
            Failed to load gallery. Please try again later.
          </div>
        ) : (
          <PublicGalleryGrid uploads={uploads || []} />
        )}
      </main>
      
      <footer className="border-t border-border/50 py-8 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Gallery App. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
