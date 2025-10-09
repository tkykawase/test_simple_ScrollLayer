import { useCallback, useState, useRef, useEffect } from 'react';
import { getLogger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import type { Project } from '@/types';

const logger = getLogger('useProjects');

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();
      
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          project_images!fk_project (
            id,
            image_url,
            is_thumbnail,
            show_in_home,
            in_project_order,
            photographer_name,
            status,
            tags,
            media_type,
            video_url,
            thumbnail_url
          )
        `)
        .eq('project_images.status', true)
        .eq('project_images.show_in_home', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      setProjects(data || []);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      setError(err instanceof Error ? err : new Error('Failed to fetch projects'));
      logger.error('Failed to fetch projects:', err instanceof Error ? err : { message: String(err) });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return { projects, loading, error, fetchProjects };
} 