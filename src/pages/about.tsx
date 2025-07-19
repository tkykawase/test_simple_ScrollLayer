import { motion } from "framer-motion";
import { Layout, GridItem } from "../components/layout";
import { Footer } from "../components/footer";

export function AboutPage() {
  return (
    <>
      <Layout showGrid={true} fullWidth={true}>
        <div className="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-12 gap-4 md:gap-6">
          <GridItem colSpan={{ default: 4, md: 4, lg: 7 }}>
            <motion.div>
              <h1 className="text-xl sm:text-2xl font-medium break-words leading-relaxed">
                Takuya Kawase
              </h1>
            </motion.div>
            <motion.div>
              <h1 className="text-xl sm:text-2xl font-medium break-words leading-relaxed">
                Graphic designer based in Osaka, Japan. Japanese calligraphy, 
                visual communication, graphic design, branding, web design, 
                UI/UX, flyers, posters, video editing, and illustration.
              </h1>
            </motion.div>
          </GridItem>

          <GridItem colSpan={{ default: 4, md: 4, lg: 5 }}>
            <motion.div>
              <p className="text-xs leading-relaxed text-justify mb-4">
                川瀬拓也
              </p>
            </motion.div>
            <motion.div>
              <p className="text-xs leading-relaxed text-justify">
                幼少期より書道教室に通う。専門学校でグラフィックデザインを専攻。卒業後、大阪のデザイン事務所にて6年間勤務。ブランドの立ち上げやリニューアルに際したWEB・UI設計から印刷物、映像制作まで多様な媒体でのビジュアルコミュニケーションを経験。同時期にクリエイティブユニットのメンバーとして展覧会への出展を継続し表現領域を拡げる。2025年、書道教室にて書道を教える立場となったことを契機にフリーランスとして独立。大阪にてグラフィックデザイナーとしての仕事・制作と書道教室での指導の双方で活動している。
              </p>
            </motion.div>
          </GridItem>
        </div>
      </Layout>
      <Footer />
    </>
  );
} 