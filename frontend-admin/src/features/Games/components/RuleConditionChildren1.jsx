import { useState } from "react";
import Button from "../../../components/Button";
import { DynamicGridRow } from "../../../components/DynamicGrid";
import QuestionPlacerMap from "../../Map/components/QuestionPlacerTester";
import SelectedQuestions from "./SelectedQuestions";
import QuestionPlacerCanvas from "./Canvas";
import { useSelector } from "react-redux";

const RuleConditionChildren1 = () => {
  const [tab, setTab] = useState("map");
  const { getGameInfobyIdApi } = useSelector((state) => state.games);
  const playgrounds =
    getGameInfobyIdApi?.data?.response?.playgrounds || [];

  const renderMainComponent = () => {
    if (tab === "map") return <QuestionPlacerMap />;
    if (tab === "canvas") return <QuestionPlacerCanvas />;
    if (tab.startsWith("playground_")) {
      const index = parseInt(tab.split("_")[1]);
      const playground = playgrounds[index];
      return <QuestionPlacerCanvas playgroundData={playground} />;
    }
    return <QuestionPlacerMap />;
  };

  return (
    <div className="flex flex-1 overflow-hidden flex-col h-full w-full">
      <div className="flex items-center gap-4 pb-4 overflow-x-auto">
        <Button
          variant={tab === "map" ? "dark" : "light"}
          onClick={() => setTab("map")}
        >
          Map
        </Button>
        <Button
          variant={tab === "canvas" ? "dark" : "light"}
          onClick={() => setTab("canvas")}
        >
          Canvas
        </Button>
        {playgrounds.map((pg, index) => (
          <Button
            key={index}
            variant={tab === `playground_${index}` ? "dark" : "light"}
            onClick={() => setTab(`playground_${index}`)}
            className="whitespace-nowrap"
          >
            {pg.name || `Playground ${index + 1}`}
          </Button>
        ))}
      </div>
      <DynamicGridRow
        children1={<div>{renderMainComponent()}</div>}
        childrend2={
          <div>
            <SelectedQuestions
              forWhat={tab.startsWith("playground_") ? "canvas" : tab}
              withSelection
            />
          </div>
        }
      />
    </div>
  );
};

export default RuleConditionChildren1;