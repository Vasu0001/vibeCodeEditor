
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { getPlaygroundById, SaveUpdatedCode } from '@/features/playground/actions';
import type { TemplateFolder } from '@/features/playground/libs/path-to-json';

interface PlaygroundData {
  id: string;
  title?: string;
  name?: string;
  [key: string]: any;
}

interface UsePlaygroundReturn {
  playgroundData: PlaygroundData | null;
  templateData: TemplateFolder | null;
  isLoading: boolean;
  error: string | null;
  loadPlayground: () => Promise<void>;
  saveTemplateData: (data: TemplateFolder) => Promise<TemplateFolder>;
}

export const usePlayground = (id: string): UsePlaygroundReturn => {
  const [playgroundData, setPlaygroundData] = useState<PlaygroundData | null>(null);
  const [templateData, setTemplateData] = useState<TemplateFolder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPlayground = useCallback(async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      setError(null);

      const data = await getPlaygroundById(id);
      if (data) {
        setPlaygroundData({
          ...data,
          // keep backward compatibility with UI parts expecting `name`
          name: data.title,
        });
      }

      const rawContent = data?.templateFiles?.[0]?.content;
      if (typeof rawContent === "string") {
        const parsedContent = JSON.parse(rawContent);
        setTemplateData(parsedContent);
        toast.success("Playground loaded successfully");
        return;
      }

      // Load template from API if not in saved content
      const res = await fetch(`/api/template/${id}`);
      if (!res.ok) throw new Error(`Failed to load template: ${res.status}`);

      const templateRes = await res.json();
      // Normalize API response (we expect TemplateFolder)
      const apiTemplate = templateRes?.templateJson;
      if (apiTemplate && typeof apiTemplate === "object" && "items" in apiTemplate) {
        setTemplateData(apiTemplate as TemplateFolder);
      } else if (apiTemplate && Array.isArray(apiTemplate)) {
        // Backward compatibility: older API returned an array of items
        setTemplateData({ folderName: "Root", items: apiTemplate });
      } else {
        setTemplateData({ folderName: "Root", items: [] });
      }

      toast.success("Template loaded successfully");
    } catch (error) {
      console.error("Error loading playground:", error);
      setError("Failed to load playground data");
      toast.error("Failed to load playground data");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const saveTemplateData = useCallback(async (data: TemplateFolder) => {
    try {
      await SaveUpdatedCode(id, data);
      setTemplateData(data);
      toast.success("Changes saved successfully");
      return data;
    } catch (error) {
      console.error("Error saving template data:", error);
      toast.error("Failed to save changes");
      throw error;
    }
  }, [id]);

  useEffect(() => {
    loadPlayground();
  }, [loadPlayground]);

  return {
    playgroundData,
    templateData,
    isLoading,
    error,
    loadPlayground,
    saveTemplateData,
  };
};