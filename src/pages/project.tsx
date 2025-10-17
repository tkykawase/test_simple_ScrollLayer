import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "../lib/supabase";
import { Layout, GridRow, GridItem } from "../components/layout";
import { getImageUrl, preloadImage, getMediaTypeFromUrl, getVideoUrl } from "../lib/image-utils";
import { Footer } from "../components/footer";
import { getLogger } from '../lib/logger';
// 型定義はtypes/index.tsにProject型がある前提で調整
import type { Project } from "../types";

const logger = getLogger('ProjectPage');
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function ProjectPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      if (!id || !UUID_REGEX.test(id)) {
        setError("Invalid project ID");
        setLoading(false);
        setTimeout(() => navigate('/works'), 2000);
        return;
      }
      try {
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
              caption,
              status,
              media_type,
              video_url,
              thumbnail_url
            )
          `)
          .eq('id', id)
          .eq('project_images.status', true)
          .single();
        if (error) throw error;
        const sortedImages = [...data.project_images].sort((a, b) => 
          a.in_project_order - b.in_project_order
        );
        const projectData = { ...data, project_images: sortedImages };
        setProject(projectData);
        sortedImages.slice(0, 3).forEach(img => {
          preloadImage(getImageUrl(img.image_url, { width: 1600, quality: 85 }));
        });
      } catch (err: unknown) {
        logger.error('Error fetching project:', err as Error);
        setError("Project not found");
        setTimeout(() => navigate('/works'), 2000);
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground mb-2">{error}</p>
          <p className="text-sm text-muted-foreground">Redirecting to projects...</p>
        </div>
      </div>
    );
  }
  if (!project) return null;
  const mainImage = project.project_images[0];
  const otherImages = project.project_images.slice(1);
  if (!mainImage) return null;
  return (
    <>
      <Layout showGrid={false}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="col-span-4 md:col-span-8 lg:col-span-12"
        >
          <GridRow>
            <GridItem colSpan={{ default: 4, md: 3, lg: 5 }}>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="sticky top-24"
              >
                <h1 className="font-brand text-2xl sm:text-3xl font-medium mb-4 break-words whitespace-pre-line">
                  {project.title}
                </h1>
                <div className="mt-8 flex items-start gap-3 text-muted-foreground">
                  <p className="text-xs leading-relaxed text-justify whitespace-pre-line">Year</p>
                  <p className="text-xs leading-relaxed text-justify whitespace-pre-line">{project.year}</p>
                </div>
                {project.description && (
                  <div className="prose prose-lg max-w-none mt-6">
                    <p className="text-xs leading-relaxed text-justify whitespace-pre-line">
                      {project.description}
                    </p>
                  </div>
                )}
              </motion.div>
            </GridItem>
            <GridItem colSpan={{ default: 4, md: 5, lg: 7 }}>
              <div className="space-y-8">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-2"
                >
                  {(() => {
                    const mediaType = mainImage.media_type || getMediaTypeFromUrl(mainImage.image_url);
                    const videoUrl = mainImage.video_url || (mediaType === 'video' ? getVideoUrl(mainImage.image_url) : undefined);
                    
                    return mediaType === 'video' && videoUrl ? (
                      <video
                        src={videoUrl}
                        poster={mainImage.thumbnail_url || getImageUrl(mainImage.image_url, { width: 1600, quality: 85 })}
                        className="w-full h-auto"
                        controls
                        preload="metadata"
                        onError={(e) => {
                          logger.error('Video failed to load:', { url: videoUrl });
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <img
                        src={getImageUrl(mainImage.image_url, { width: 1600, quality: 85 })}
                        alt={project.title}
                        className="w-full h-auto"
                        loading="eager"
                        decoding="async"
                        onError={(e) => {
                          logger.error('Image failed to load:', { url: mainImage.image_url });
                          e.currentTarget.src = 'https://via.placeholder.com/800x600?text=Image+Not+Found';
                        }}
                      />
                    );
                  })()}
                  {mainImage.caption && (
                    <p className="text-xs text-muted-foreground whitespace-pre-line">
                      {mainImage.caption}
                    </p>
                  )}
                </motion.div>
                {otherImages.map((image, index) => (
                  <motion.div
                    key={image.id}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="space-y-2"
                  >
                    {(() => {
                      const mediaType = image.media_type || getMediaTypeFromUrl(image.image_url);
                      const videoUrl = image.video_url || (mediaType === 'video' ? getVideoUrl(image.image_url) : undefined);
                      
                      return mediaType === 'video' && videoUrl ? (
                        <video
                          src={videoUrl}
                          poster={image.thumbnail_url || getImageUrl(image.image_url, { width: 1600, quality: 85 })}
                          className="w-full h-auto"
                          controls
                          preload="metadata"
                          onError={(e) => {
                            logger.error('Video failed to load:', { url: videoUrl });
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <img
                          src={getImageUrl(image.image_url, { width: 1600, quality: 85 })}
                          alt={`${project.title} - Detail ${index + 1}`}
                          className="w-full h-auto"
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            logger.error('Image failed to load:', { url: image.image_url });
                            e.currentTarget.src = 'https://via.placeholder.com/800x600?text=Image+Not+Found';
                          }}
                        />
                      );
                    })()}
                    {image.caption && (
                      <p className="text-xs text-muted-foreground whitespace-pre-line">
                        {image.caption}
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>
            </GridItem>
          </GridRow>
        </motion.div>
      </Layout>
      <Footer />
    </>
  );
} 