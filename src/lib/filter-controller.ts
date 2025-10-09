// src/lib/filter-controller.ts

import { useCallback, useMemo } from 'react';
import type { Project } from '@/types';
import { getLogger } from '@/lib/logger';

const logger = getLogger('FilterController');

// 配列をシャッフルする関数（関数コンポーネントの外で定義）
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

interface UseFilterControllerProps {
  projects: Project[];
  selectedTags: string[];
  selectedImageTags: string[];
  type: 'project' | 'image';
  mediaType?: 'all' | 'image' | 'video'; // メディアタイプフィルターを追加
}

export function useFilterController({
  projects,
  selectedTags,
  selectedImageTags,
  type,
  mediaType = 'all'
}: UseFilterControllerProps) {
  
  // プロジェクトデータの詳細をログに出力
  const logProjectDetails = useCallback(() => {
    if (projects.length === 0) return;
    
    // 画像データの詳細を収集
    const imagesSummary = {
      total: 0,
      withShowInHome: 0,
      withStatus: 0,
      withTags: 0,
      withBothFlags: 0
    };

    // すべてのプロジェクトの画像を分析
    projects.forEach(project => {
      project.project_images.forEach(img => {
        imagesSummary.total++;
        if (img.show_in_home === true) imagesSummary.withShowInHome++;
        if (img.status === true) imagesSummary.withStatus++;
        if (img.tags && img.tags.length > 0) imagesSummary.withTags++;
        if (img.show_in_home === true && img.status === true) imagesSummary.withBothFlags++;
      });
    });
    
    // ログ出力
    logger.debug('Project data analysis', {
      totalProjects: projects.length,
      imagesSummary
    });
  }, [projects]);
  
  // コンポーネントマウント時にデータ分析を実行
  useMemo(() => {
    if (projects.length > 0) {
      logProjectDetails();
    }
  }, [projects, logProjectDetails]);

  const filterProjects = useCallback(() => {
    if (type === 'project') {
      return selectedTags.length > 0
        ? projects.filter(project => 
            project.tags?.some(tag => selectedTags.includes(tag))
          )
        : projects;
    } else {
      // フィルタ前の画像統計
      const allImages = projects.flatMap(p => p.project_images);
      const imageStats = {
        total: allImages.length,
        showInHome: allImages.filter(img => img.show_in_home === true).length,
        active: allImages.filter(img => img.status === true).length,
        both: allImages.filter(img => img.show_in_home === true && img.status === true).length
      };
      
      logger.debug('Before filtering', {
        selectedTags: selectedImageTags.length ? selectedImageTags : 'All',
        imageStats
      });
      
      // フィルタリング処理
      const filtered = projects.map(project => ({
        ...project,
        project_images: project.project_images.filter(img => {
          // 基本条件：アクティブステータス
          const isActive = img.status === true;
          
          // Allの場合 (selectedImageTags.length === 0)
          if (selectedImageTags.length === 0) {
            return isActive && img.show_in_home === true;
          }
          
          // タグが選択されている場合
          // tagsがundefinedまたは空の配列でないことを確認
          if (!img.tags || !Array.isArray(img.tags) || img.tags.length === 0) {
            return false;
          }
          
          // タグがマッチするか確認
          return isActive && img.tags.some(tag => selectedImageTags.includes(tag));
        })
      })).filter(project => project.project_images.length > 0);
      
      // フィルタリング後の統計
      const filteredImages = filtered.flatMap(p => p.project_images);
      logger.debug('After filtering', {
        projectCount: filtered.length,
        imageCount: filteredImages.length,
        selectedTags: selectedImageTags.length ? selectedImageTags : 'All'
      });
      
      return filtered;
    }
  }, [projects, selectedTags, selectedImageTags, type]);

  const getFilteredImages = useCallback(() => {
    if (type !== 'image') return [];

    // フィルタリング処理
    const filteredImages = projects.flatMap(project =>
      project.project_images
        .filter(img => {
          // 基本条件：アクティブステータス
          const isActive = img.status === true;
          
          // メディアタイプフィルター
          const mediaTypeMatch = mediaType === 'all' || 
            (mediaType === 'image' && (img.media_type === 'image' || !img.media_type)) ||
            (mediaType === 'video' && img.media_type === 'video');
          
          if (!mediaTypeMatch) {
            return false;
          }
          
          // Allの場合 (selectedImageTags.length === 0)
          if (selectedImageTags.length === 0) {
            return isActive && img.show_in_home === true;
          }
          
          // タグが選択されている場合
          // tagsがundefinedまたは空の配列でないことを確認
          if (!img.tags || !Array.isArray(img.tags) || img.tags.length === 0) {
            return false;
          }
          
          // タグがマッチするか確認
          return isActive && img.tags.some(tag => selectedImageTags.includes(tag));
        })
        .map(img => img.image_url)
    );

    // 常にシャッフル（初期表示・タグフィルタリング両方で一貫したランダム表示）
    const resultImages = shuffleArray([...filteredImages]);

    logger.debug('Filtered images', {
      selectedTags: selectedImageTags.length ? selectedImageTags : 'All',
      resultCount: resultImages.length,
      randomized: true
    });

    return resultImages;
  }, [projects, selectedImageTags, type, mediaType]);

  // Memoize the filtered results
  const filteredResults = useMemo(() => ({
    projects: filterProjects(),
    images: getFilteredImages()
  }), [projects, selectedTags, selectedImageTags, type, mediaType]);

  return {
    filterProjects: useCallback(() => filteredResults.projects, [filteredResults]),
    getFilteredImages: useCallback(() => filteredResults.images, [filteredResults])
  };
}