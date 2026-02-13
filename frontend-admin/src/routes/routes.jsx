import { Routes, Route, Navigate } from "react-router-dom";
import Auth from "../features/Auth/pages/Auth";
import Dashboard from "../features/Dashboard/pages/Dashboard";
import MainLayout from "../layouts/MainLayout";
import Protected from "../routes/helper/Protectedroutes";
import Calender from "../features/Calender/pages/Calender";
import Games from "../features/Games/pages/Games";
import Tasks from "../features/Tasks/pages/Tasks";
import Users from "../features/Users/pages/Users";
import CreateUpdateTask from "../features/Tasks/pages/CreateUpdateTask";
import CreateUpdateGame from "../features/Games/pages/CreateUpdateGame";
import { ROUTES } from "./helper";
import Tags from "../features/Tag/pages/Tags";
import Puzzles from "../features/Puzzles/pages/Puzzles";
import RuleEngine from "../features/Map/RuleEngine";
import GameActivation from "../features/Game-Activations/pages/GameActivation";
import PlayerAdmin from "../features/PlayerAdmin/pages/PlayerAdmin";
import BlocklyEditor from "../features/Games/components/Blockly2";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path={"/auth"} element={<Auth />} />
      <Route path={"/rule-engine"} element={<RuleEngine />} />
      <Route path={"/blockly"} element={<BlocklyEditor />} />
      <Route
        element={
          <Protected>
            <MainLayout />
          </Protected>
        }
      >
        <Route path={ROUTES.ORIGIN} element={<Dashboard />} />
        <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
        <Route path={ROUTES.CALENDER} element={<Calender />} />
        <Route path={ROUTES.GAMES} element={<Games />} />
        <Route path={ROUTES.CREATE_GAME} element={<CreateUpdateGame />} />
        <Route path={ROUTES.UPDATE_GAME} element={<CreateUpdateGame />} />
        <Route path={ROUTES.TASKS} element={<Tasks />} />
        <Route path={ROUTES.CREATE_TASK} element={<CreateUpdateTask />} />
        <Route path={ROUTES.UPDATE_TASK} element={<CreateUpdateTask />} />
        <Route path={ROUTES.USERS} element={<Users />} />
        <Route path={ROUTES.TAGS} element={<Tags />} />
        <Route path={ROUTES.PUZZLES} element={<Puzzles />} />
        <Route path={ROUTES.GAME_ACTIVATION} element={<GameActivation />} />
        <Route path={ROUTES.PLAYER_ADMIN} element={<PlayerAdmin />} />
      </Route>

      {/* Catch-all route - redirect any unknown route to dashboard for authenticated users */}
      {/* <Route
        path="*"
        element={
          <Protected>
            <Navigate to="/" replace />
          </Protected>
        }
      /> */}
    </Routes>
  );
}
