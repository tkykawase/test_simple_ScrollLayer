// src/lib/image-utils.ts

interface ImageOptions {
  width?: number;
  quality?: number;
}

export function getImageUrl(url: string, options?: ImageOptions): string {
  if (!url) {
    // テンプレートリテラルに変更し、ESLintのエラーを回避
    return `https://via.placeholder.com/800x600?text=Image Not Found`;
  }

  // 実際にはここで画像サービス（Cloudinary, Imgixなど）のURL変換ロジックが入ります。
  // 例: Cloudinaryの場合
  // const baseUrl = "https://res.cloudinary.com/your_cloud_name/image/upload/";
  // let transformations = [];
  // if (options?.width) transformations.push(`w_${options.width}`);
  // if (options?.quality) transformations.push(`q_${options.quality}`);
  // if (transformations.length > 0) {
  //   return `${baseUrl}${transformations.join(',')}/${url.split('/').pop()}`;
  // }

  // 現状は元のURLをそのまま返すか、オプションをクエリパラメータとして付与
  let finalUrl = url;
  const params = new URLSearchParams();
  if (options?.width) params.append('w', options.width.toString());
  if (options?.quality) params.append('q', options.quality.toString());

  if (params.toString()) {
    finalUrl = `${url}?${params.toString()}`;
  }

  return finalUrl;
}
