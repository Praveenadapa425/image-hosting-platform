import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload as UploadIcon, Loader2, ImagePlus } from "lucide-react";
import { useUpload } from "@/hooks/use-uploads";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  publicText: z.string().min(1, "Public description is required"),
  privateText: z.string().optional(),
  folderName: z.string().default("General"),
  // File is handled manually
});

type FormData = z.infer<typeof formSchema>;

export function UploadModal() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  
  const { createUpload, isCreating } = useUpload();
  const { toast } = useToast();
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      publicText: "",
      privateText: "",
      folderName: "General",
    },
  });

  // Reset when closed
  useEffect(() => {
    if (!open) {
      form.reset();
      setFile(null);
      setPreview(null);
    }
  }, [open, form]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      const objectUrl = URL.createObjectURL(selected);
      setPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!file) {
      toast({ title: "Image required", description: "Please select an image to upload", variant: "destructive" });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("publicText", data.publicText);
      if (data.privateText) formData.append("privateText", data.privateText);
      formData.append("folderName", data.folderName);

      await createUpload(formData);
      
      toast({ title: "Success", description: "Image uploaded successfully" });
      setOpen(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
          <UploadIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Upload New</span>
          <span className="sm:hidden">Upload</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-display">Upload Image</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
          
          {/* File Input Area */}
          <div className="space-y-2">
            <Label>Image</Label>
            <div className={`
              relative flex flex-col items-center justify-center w-full h-48 rounded-xl border-2 border-dashed 
              transition-colors duration-200 cursor-pointer overflow-hidden
              ${file ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/50'}
            `}>
              <input 
                type="file" 
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
              />
              
              {preview ? (
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <ImagePlus className="h-10 w-10" />
                  <span className="text-sm font-medium">Tap to select image</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="publicText">Public Description <span className="text-red-500">*</span></Label>
              <Input 
                id="publicText" 
                placeholder="Visible to everyone..." 
                {...form.register("publicText")}
              />
              {form.formState.errors.publicText && (
                <p className="text-xs text-destructive">{form.formState.errors.publicText.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="privateText" className="flex items-center gap-2">
                Private Note
                <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">Admin Only</span>
              </Label>
              <Textarea 
                id="privateText" 
                placeholder="Internal notes, dates, details..." 
                className="resize-none h-20"
                {...form.register("privateText")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="folderName">Drive Folder</Label>
              <Input 
                id="folderName" 
                placeholder="e.g. 2024-Events" 
                {...form.register("folderName")}
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isCreating}>
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload to Drive"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
