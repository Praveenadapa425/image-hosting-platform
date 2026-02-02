import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertUpload } from "@shared/routes";

// --- PUBLIC HOOKS ---

export function usePublicUploads() {
  return useQuery({
    queryKey: [api.uploads.listPublic.path],
    queryFn: async () => {
      const res = await fetch(api.uploads.listPublic.path);
      if (!res.ok) throw new Error("Failed to fetch public uploads");
      return api.uploads.listPublic.responses[200].parse(await res.json());
    },
  });
}

// --- ADMIN HOOKS ---

export function useAdminUploads(folder?: string) {
  return useQuery({
    queryKey: [api.uploads.listAll.path, folder],
    queryFn: async () => {
      const url = folder 
        ? `${api.uploads.listAll.path}?folder=${encodeURIComponent(folder)}`
        : api.uploads.listAll.path;
        
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch uploads");
      return api.uploads.listAll.responses[200].parse(await res.json());
    },
  });
}

export function useUpload() {
  const queryClient = useQueryClient();

  // Create - Accepts FormData directly
  const createMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch(api.uploads.create.path, {
        method: api.uploads.create.method,
        body: formData, // Browser sets Content-Type to multipart/form-data automatically
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to upload file");
      }
      return api.uploads.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.uploads.listAll.path] });
      queryClient.invalidateQueries({ queryKey: [api.uploads.listPublic.path] });
    },
  });

  // Update
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<InsertUpload>) => {
      const url = buildUrl(api.uploads.update.path, { id });
      const validated = api.uploads.update.input.parse(updates);
      
      const res = await fetch(url, {
        method: api.uploads.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to update upload");
      return api.uploads.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.uploads.listAll.path] });
      queryClient.invalidateQueries({ queryKey: [api.uploads.listPublic.path] });
    },
  });

  // Delete
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.uploads.delete.path, { id });
      const res = await fetch(url, { 
        method: api.uploads.delete.method,
        credentials: "include" 
      });

      if (!res.ok) throw new Error("Failed to delete upload");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.uploads.listAll.path] });
      queryClient.invalidateQueries({ queryKey: [api.uploads.listPublic.path] });
    },
  });

  return {
    createUpload: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateUpload: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteUpload: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}
