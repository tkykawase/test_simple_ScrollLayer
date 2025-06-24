import React from 'react';
import { OneSimpleSwiper } from '../components/oneswiper/components/OneSimpleSwiper';

// テスト用の画像URL配列
const testImages = [
  '/images/chris-weiher-5l-MpBeRElU-unsplash.jpg',
  '/images/hen-kaznelson-c_muxYU1DcE-unsplash.jpg',
  '/images/marija-zaric-RgAO8Y0ZI3I-unsplash.jpg',
  '/images/rodion-kutsaiev-049M_crau5k-unsplash.jpg',
  '/images/zhen-yao-JfuORsWVef8-unsplash.jpg',
];

export const Home2: React.FC = () => {
  return (
    <div className="h-screen w-full flex">
      {/* 左側スワイパー */}
      <div className="w-1/2 h-full border-r border-gray-300">
        <OneSimpleSwiper images={testImages} side="left" />
      </div>
      {/* 右側スワイパー */}
      <div className="w-1/2 h-full">
        <OneSimpleSwiper images={testImages} side="right" />
      </div>
    </div>
  );
};