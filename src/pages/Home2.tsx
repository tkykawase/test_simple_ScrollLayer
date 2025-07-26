import React, { useEffect, useMemo } from 'react';
import { useProjectStore } from '@/lib/store';
import { useProjects } from '@/hooks/use-projects';
import { useFilterController } from '@/lib/filter-controller';
import { OneSimpleSwiper } from '../components/oneswiper/components/OneSimpleSwiper';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export const Home2: React.FC = () => {
  const { setProjects, selectedImageTags, setSelectedImageTags } = useProjectStore();
  const { projects, loading, fetchProjects } = useProjects();
  
  const filterController = useFilterController({
    projects,
    selectedTags: [],        // 追加（imageタイプでは使用しないが必須）
    selectedImageTags,
    type: 'image'
  });
  
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    setProjects(projects);
  }, [projects, setProjects]);

  useEffect(() => {
    setSelectedImageTags([]);
  }, [setSelectedImageTags]);

  const filteredImages = useMemo(() => {
    return filterController.getFilteredImages();
  }, [filterController, selectedImageTags]);

  const [leftImages, rightImages] = useMemo(() => {
    const midpoint = Math.ceil(filteredImages.length / 2);
    return [
      filteredImages.slice(0, midpoint),
      filteredImages.slice(midpoint)
    ];
  }, [filteredImages]);

  if (loading || filteredImages.length === 0) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
    <Header />
    <div className="h-screen w-full flex">
      {/* 左側スワイパー */}
      <div className="w-1/2 h-full border-r border-gray-300">
        <OneSimpleSwiper 
          images={leftImages} 
          projects={projects}
          side="left" 
        />
      </div>
      {/* 右側スワイパー */}
      <div className="w-1/2 h-full">
        <OneSimpleSwiper 
          images={rightImages} 
          projects={projects}
          side="right" 
        />
      </div>
    </div>
    <Footer />
    </>
  );
};