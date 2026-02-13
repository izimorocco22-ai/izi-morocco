import { useEffect, useState } from "react";
import Button from "../../../components/Button";
import { cn } from "../../../lib/utils";
import { useDispatch, useSelector } from "react-redux";
import { getGroupedActivations } from "../../../slices/gameActivationSlice";
import { HeaderType } from "../../../utils/types";
import { formatDateToReadable } from "../../../utils/common";
import TableGrid from "../../../components/table/TableGrid";
import CreateGameActivationModal from "../modals/CreateGameActivationModal";
import useNavigateTo from "../../../hooks/useNavigateTo";
import TooltipWrapper from "../../../components/TooltipWrapper";
import ArrowIcon from "../../../components/svgs/ArrowIcon";

const GameActivation = () => {
  const dispatch = useDispatch();
  const [currentPage, setCurrentPage] = useState(1);
  const [openModal, setOpenModal] = useState(false);
  const goTo = useNavigateTo();
  const { getGroupedActivationsApi } = useSelector(
    (state) => state.gameActivation
  );
  const { data, isLoading } = getGroupedActivationsApi;

  const gameActivationsList =
    data?.response?.data?.map((a) => {
      return {
        ...a,
        createdAt: formatDateToReadable(a.createdAt, false, true),
        expiresAt: formatDateToReadable(a.expiresAt, false, true),
        gameTitle: a.gameDetails?.title || "N/A",
        playerName: a.playerDetails?.name || "N/A",
        playerEmail: a.playerDetails?.email || "N/A",
      };
    }) || [];

  const totalPages = data?.response?.totalPages || 1;
  const totalRecords = data?.response?.totalDocs || 0;
  const limit = data?.response?.limit || 10;

  // console.log({ gameActivationsList });

  const columns = [
    { value: "playerName", name: "Player Name" },
    { value: "playerEmail", name: "Player Email", _class: "col-span-2" },
    { value: "codeCount", name: "Code Count", _class: "col-span-1" },
    { value: "gameTitle", name: "Game Title", _class: "col-span-3" },
    {
      value: "createdAt",
      name: "Created At",
      _class: "col-span-2",
      type: HeaderType.date,
    },
    {
      value: "expiresAt",
      name: "Expires At",
      _class: "col-span-2",
      type: HeaderType.date,
    },
    {
      name: "Actions",
      value: "actions",
      type: HeaderType.dynamicAction,
      actions: [
        {
          label: "View Codes",
          icon: (
            <TooltipWrapper
              content={"View Codes"}
              place="right"
              className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-accent/10 cursor-pointer"
            >
              <ArrowIcon />
            </TooltipWrapper>
          ),
          onClick: (row) => {
            goTo(`/game-activation/group/${row.groupId}`);
          },
        },
        // {
        //   label: "Delete",
        //   icon: (
        //     <TooltipWrapper
        //       content={"Delete Question"}
        //       place="right"
        //       className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-accent/10 cursor-pointer"
        //     >
        //       <DeleteIcon />
        //     </TooltipWrapper>
        //   ),
        //   onClick: (row) => handleDeleteClick(row._id),
        // },
        // {
        //   label: "Clone",
        //   icon: (
        //     <DisabledWrapper where={saveCooldown}>
        //       <TooltipWrapper
        //         content={"Clone Task"}
        //         place="right"
        //         className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-accent/10 cursor-pointer"
        //       >
        //         <CloneIcon />
        //       </TooltipWrapper>
        //     </DisabledWrapper>
        //   ),
        //   onClick: (row) => handleCloneClick(row._id),
        // },
      ],
    },
  ];

  useEffect(() => {
    dispatch(getGroupedActivations({ page: currentPage }));
  }, [dispatch, currentPage]);

  return (
    <>
      <div className="common-page flex flex-col gap-4">
        <div
          className={cn(
            "common-page",
            "flex flex-row justify-between items-center"
          )}
        >
          <h1 className="text-2xl font-bold">Game Activation</h1>
          <Button onClick={() => setOpenModal(true)}>
            Create Game Activation
          </Button>
        </div>
        <TableGrid
          data={gameActivationsList}
          columns={columns}
          isCompressView={false}
          isLoading={isLoading}
          allowPagination={true}
          currentPage={currentPage}
          totalPages={totalPages}
          totalRecords={totalRecords}
          pageLimit={limit}
          onPageChange={(newPage) => setCurrentPage(newPage)}
        />
      </div>
      {openModal && (
        <CreateGameActivationModal
          onClose={() => {
            setOpenModal(false);
          }}
        />
      )}
      
    </>
  );
};

export default GameActivation;
