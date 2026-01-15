import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface ExportJob {
  id: string;
  exportType: string;
  format: string | null;
  status: string | null;
  filters: string | null;
  filePath: string | null;
  fileSize: number | null;
  rowCount: number | null;
  errorMessage: string | null;
  requestedBy: string | null;
  completedAt: string | null;
  expiresAt: string | null;
  createdAt: string | null;
}

export function useExportJobs() {
  return useQuery<ExportJob[]>({
    queryKey: ["export-jobs"],
    queryFn: async () => {
      const response = await fetch("/api/export-jobs");
      if (!response.ok) {
        throw new Error("Failed to fetch export jobs");
      }
      return response.json();
    },
  });
}

export function useCreateExportJob() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (job: {
      exportType: 'projects' | 'metrics' | 'reports' | 'full_backup';
      format?: 'csv' | 'excel' | 'json';
      filters?: string;
    }) => {
      const response = await fetch("/api/export-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(job),
      });
      if (!response.ok) {
        throw new Error("Failed to create export job");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["export-jobs"] });
    },
  });
}

export function useDownloadExport(jobId: string) {
  return {
    download: () => {
      window.open(`/api/export-jobs/${jobId}/download`, '_blank');
    }
  };
}
