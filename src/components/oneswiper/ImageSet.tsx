import React from 'react';

// テスト用の画像URL配列
const testImages = [
  '/images/chris-weiher-5l-MpBeRElU-unsplash.jpg',
  '/images/hen-kaznelson-c_muxYU1DcE-unsplash.jpg',
  '/images/marija-zaric-RgAO8Y0ZI3I-unsplash.jpg',
  '/images/rodion-kutsaiev-049M_crau5k-unsplash.jpg',
  '/images/zhen-yao-JfuORsWVef8-unsplash.jpg',
];

interface ImageSetProps {
  setIndex: number;
}

export const ImageSet: React.FC<ImageSetProps> = ({ setIndex }) => {
  return (
    <div className="w-full">
      {testImages.map((image, index) => (
        <div key={`${setIndex}-${index}`} className="w-full">
          <img
            src={image}
            alt={`Image ${index + 1} from Set ${setIndex + 1}`}
            className="w-full"
          />
        </div>
      ))}
    </div>
  );
}; 