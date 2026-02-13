import { useEffect, useState } from "react";
import Sidebar from "../components/slider/Sidebar";
import DashboardIcon from "../components/svgs/DashboardIcon";
import { ROUTES } from "../routes/helper";
import { Outlet } from "react-router-dom";
import UsersIcon from "../components/svgs/UsersIcon";
import GameIcon from "../components/svgs/GameIcon";
import Topbar from "../components/Topbar";
import TaskIcon from "../components/svgs/Task";
import TagIcon from "../components/svgs/TagIcon";
import Puzzles from "../components/svgs/PuzzlesIcon";
import ActivationIcon from "../components/svgs/ActivationIcon";
import PlayerIcon from "../components/svgs/PlayerIcon";

const sidebars = () => [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: DashboardIcon,
    to: ROUTES.DASHBOARD,
    children: ["dashboard", ""],
  },
  {
    id: "users",
    label: "Users",
    icon: UsersIcon,
    to: ROUTES.USERS,
    children: ["users"],
  },
  {
    id: "games",
    label: "Games",
    icon: GameIcon,
    to: ROUTES.GAMES,
    children: ["games"],
  },
  {
    id: "tasks",
    label: "Tasks",
    icon: TaskIcon,
    to: ROUTES.TASKS,
    children: ["tasks"],
  },
  {
    id: "tags",
    label: "Tags",
    icon: TagIcon,
    to: ROUTES.TAGS,
    children: ["tags"],
  },
  {
    id: "puzzles",
    label: "Puzzles",
    icon: Puzzles,
    to: ROUTES.PUZZLES,
    children: ["puzzles"],
  },
  {
    id: "player-admin",
    label: "Player Admin",
    icon: PlayerIcon,
    to: ROUTES.PLAYER_ADMIN,
    children: ["player-admin"],
  },
  {
    id: "game-activation",
    label: "Game Tickets",
    icon: ActivationIcon,
    to: ROUTES.GAME_ACTIVATION,
    children: ["game-activation"],
  },
];
const MainLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const stored = localStorage.getItem("sidebar-collapsed");
    return stored === "true"; // default is false if not set
  });
  const [isTabletScreen, setIsTabletScreen] = useState(false);

  const handleToggle = () => {
    setIsCollapsed((prev) => {
      localStorage.setItem("sidebar-collapsed", !prev);
      return !prev;
    });
  };

  useEffect(() => {
    const handleResize = () => {
      const isTablet = window.innerWidth < 1024;
      setIsTabletScreen(isTablet);

      // Auto-collapse sidebar when screen becomes tablet size
      if (isTablet && !isCollapsed) {
        setIsCollapsed(true);
      }

      // When expanding from tablet to desktop, restore the stored preference
      if (!isTablet && isCollapsed) {
        const stored = localStorage.getItem("sidebar-collapsed");
        setIsCollapsed(stored === "true");
      }
    };

    window.addEventListener("resize", handleResize);

    // Clean up the event listener
    return () => window.removeEventListener("resize", handleResize);
  }, [isCollapsed]);

  return (
    // <div className="custom-container mx-auto border p-4 min-h-screen">
    //   <header>{/* Header content goes here */}</header>
    //   <main>{children}</main>
    //   <footer>{/* Footer content goes here */}</footer>
    // </div>
    <div className="relative flex">
      <div className="fixed">
        <Sidebar
          data={sidebars()}
          isCollapsed={isCollapsed}
          handleToggle={handleToggle}
          isTabletScreen={isTabletScreen}
        />
      </div>
      <main className="w-full">
        {/* page container */}
        <div
          className={`${
            isCollapsed ? "ml-[60px] lg:ml-[90px]" : "ml-[170px] lg:ml-[240px]"
          } transition-all duration-300`}
        >
          <div className="max-w-[1650px] w-[99%] py-1 mx-auto">
            {/* Scrollable content */}
            <Topbar />
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};
export default MainLayout;
