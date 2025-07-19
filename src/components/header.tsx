import { Link } from "react-router-dom";
// useProjectStoreは未実装の場合はコメントアウト可
// import { useProjectStore } from "@/lib/store";

export function Header() {
  // const { setSelectedImageTags } = useProjectStore();
  // const location = useLocation();

  // const handleLogoClick = () => {
  //   if (location.pathname === '/') {
  //     setSelectedImageTags([]);
  //   }
  // };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-transparent mix-blend-difference">
      <div className="h-12 w-full flex justify-between items-center px-4 md:px-6">
        <Link
          to="/"
          // onClick={handleLogoClick}
          className="text-sm text-white text-left"
        >
          Study,Experience&Doodles
        </Link>
        <div className="flex items-center">
          <Link
            to="/works"
            className="text-sm text-white mr-4"
          >
            Works
          </Link>
          <Link
            to="/about"
            className="text-sm text-white"
          >
            About
          </Link>
        </div>
      </div>
    </header>
  );
} 