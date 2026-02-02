import { type Upload } from "@shared/schema";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ZoomIn } from "lucide-react";

export function PublicGalleryGrid({ uploads }: { uploads: Upload[] }) {
  const [selectedUpload, setSelectedUpload] = useState<Upload | null>(null);

  if (uploads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mb-4">
          <ZoomIn className="w-10 h-10 text-muted-foreground/50" />
        </div>
        <h3 className="text-xl font-semibold text-foreground">Srinivas Gallery is Empty</h3>
        <p className="text-muted-foreground mt-2 max-w-sm">
          No public uploads found. Check back later!
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
        {uploads.map((upload, index) => (
          <motion.div
            key={upload.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            className="group cursor-pointer flex flex-col gap-3"
            onClick={() => setSelectedUpload(upload)}
          >
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted shadow-sm hover:shadow-lg transition-all duration-300">
              <img
                src={upload.thumbnailLink || upload.webViewLink}
                alt={upload.publicText}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
            </div>
            
            <div className="px-1">
              <p className="text-sm font-medium text-foreground leading-snug line-clamp-2">
                {upload.publicText}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(upload.createdAt || "").toLocaleDateString()}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <Dialog open={!!selectedUpload} onOpenChange={(open) => !open && setSelectedUpload(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/95 border-none text-white sm:rounded-2xl">
          <div className="relative flex flex-col md:flex-row h-full max-h-[90vh]">
            <div className="flex-1 relative bg-black flex items-center justify-center min-h-[300px]">
              {selectedUpload && (
                <img
                  src={selectedUpload.webViewLink}
                  alt={selectedUpload.publicText}
                  className="max-h-[80vh] w-auto max-w-full object-contain"
                />
              )}
            </div>
            
            {selectedUpload && (
              <div className="w-full md:w-80 p-6 flex flex-col gap-4 bg-background text-foreground md:border-l border-border h-full overflow-y-auto">
                <div>
                  <h3 className="text-lg font-bold font-display leading-tight">
                    {selectedUpload.publicText}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    {new Date(selectedUpload.createdAt || "").toLocaleDateString()}
                  </p>
                </div>
                
                <div className="mt-auto pt-4 border-t border-border">
                  <a 
                    href={selectedUpload.webViewLink} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                  >
                    Open original in Drive
                    <ZoomIn className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
