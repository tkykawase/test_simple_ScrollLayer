// src/pages/home.tsx
import { SimpleSwiper } from '../components/swiper';
import type { SwipeItem } from '../types';
// サンプルデータ
const sampleItems: SwipeItem[] = [
  {
    id: '1',
    imageUrl: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131',
    title: 'サンプル画像 1'
  },
  {
    id: '2',
    imageUrl: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee',
    title: 'サンプル画像 2'
  },
  {
    id: '3',
    imageUrl: 'https://images.unsplash.com/photo-1561948955-570b270e7c36',
    title: 'サンプル画像 3'
  },
  {
    id: '4',
    imageUrl: 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6',
    title: 'サンプル画像 4'
  }
  
];
const sampleProjects = sampleItems.map(item => ({
  ...item,
  title: item.title || 'Untitled Project',
  description: '',
  year: '2024',
  tags: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  company_name: '',
  user_id: 'sample-user',
  project_images: [{
    id: `img-${item.id}`,
    image_url: item.imageUrl,
    is_thumbnail: true,
    show_in_home: true,
    in_project_order: 0,
    status: true
  }]
}));
export function HomePage() {
  return (
    <div className="w-screen h-screen flex flex-col">
      <div className="flex flex-1">
        <div className="w-full">
          <SimpleSwiper 
            images={sampleItems.map(item => item.imageUrl)}
            projects={sampleProjects}
            side="left"
          />
        </div>
  
      </div>
    </div>
  );
}
