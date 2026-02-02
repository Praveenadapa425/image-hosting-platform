import { type Upload } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Folder, Trash2, Edit2, ExternalLink } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useUpload } from "@/hooks/use-uploads";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function AdminUploadCard({ upload }: { upload: Upload }) {
  const { deleteUpload, updateUpload } = useUpload();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editPublic, setEditPublic] = useState(upload.publicText);
  const [editPrivate, setEditPrivate] = useState(upload.privateText || "");

  const handleDelete = async () => {
    try {
      await deleteUpload(upload.id);
      toast({ title: "Deleted", description: "Upload removed from database" });
    } catch {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  };

  const handleSave = async () => {
    try {
      await updateUpload({ 
        id: upload.id, 
        publicText: editPublic,
        privateText: editPrivate
      });
      setIsEditing(false);
      toast({ title: "Updated", description: "Details saved successfully" });
    } catch {
      toast({ title: "Error", description: "Failed to update", variant: "destructive" });
    }
  };

  return (
    <Card className="overflow-hidden group flex flex-col md:flex-row gap-0 md:gap-6 bg-card border-border/50 shadow-sm hover:shadow-md transition-all duration-200">
      {/* Thumbnail */}
      <div className="relative aspect-video md:aspect-square md:w-48 bg-muted shrink-0">
        <img 
          src={upload.thumbnailLink || upload.webViewLink} 
          alt={upload.publicText}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <a 
          href={upload.webViewLink} 
          target="_blank" 
          rel="noopener noreferrer"
          className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
          title="View on Drive"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 md:py-4 md:pr-4 md:pl-0 gap-3">
        {isEditing ? (
          <div className="space-y-3 flex-1">
            <Input 
              value={editPublic} 
              onChange={(e) => setEditPublic(e.target.value)} 
              placeholder="Public description"
              className="font-medium"
            />
            <Textarea 
              value={editPrivate} 
              onChange={(e) => setEditPrivate(e.target.value)} 
              placeholder="Private notes"
              className="text-sm h-20"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave}>Save</Button>
              <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Folder className="w-3.5 h-3.5" />
                <span>{upload.folderName}</span>
                <span>•</span>
                <span>{new Date(upload.createdAt || "").toLocaleDateString()}</span>
              </div>
              
              <h3 className="font-semibold text-foreground leading-tight">
                {upload.publicText}
              </h3>
              
              {upload.privateText && (
                <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950/30 rounded border border-amber-100 dark:border-amber-900/50 text-sm text-amber-800 dark:text-amber-200">
                  <span className="font-semibold text-xs uppercase tracking-wide opacity-70 block mb-0.5">Private Note</span>
                  {upload.privateText}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-auto pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 gap-1.5"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Upload?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove the record from the database. The file in Google Drive may remain depending on your settings.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
