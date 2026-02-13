import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import TableGrid from "../../../components/table/TableGrid";
import { HeaderType } from "../../../utils/types";
import { formatDateToReadable } from "../../../utils/common";
import TooltipWrapper from "../../../components/TooltipWrapper";
import QrIcon from "../../../components/svgs/QRIcon";
import { getCodesByBatch, resetApiStateFromGameActivation } from "../../../slices/gameActivationSlice";
import Button from "../../../components/Button";

const BatchCodes = () => {
  const { batchId } = useParams();
  const dispatch = useDispatch();
  const { getCodesByBatchApi } = useSelector((state) => state.gameActivation);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (batchId) dispatch(getCodesByBatch(batchId));
    return () => {
      dispatch(resetApiStateFromGameActivation("getCodesByBatchApi"));
    };
  }, [dispatch, batchId]);

  const list =
    getCodesByBatchApi?.data?.response?.data?.map((a) => ({
      ...a,
      createdAt: formatDateToReadable(a.createdAt, false, true),
      expiresAt: formatDateToReadable(a.expiresAt, false, true),
      gameTitle: a.gameDetails?.title || "N/A",
      playerName: a.playerDetails?.name || "N/A",
      playerEmail: a.playerDetails?.email || "N/A",
    })) || [];

  const columns = [
    { value: "playerName", name: "Player Name" },
    { value: "playerEmail", name: "Player Email", _class: "col-span-2" },
    { value: "activationCode", name: "Activation Code", _class: "col-span-1" },
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
          label: "Generate QR Code",
          icon: (
            <TooltipWrapper
              content={"Generate QR Code"}
              place="right"
              className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-accent/10 cursor-pointer"
            >
              <QrIcon />
            </TooltipWrapper>
          ),
          onClick: () => {},
        },
      ],
    },
  ];

  return (
    <div className="common-page flex flex-col gap-4">
      <div className="common-page flex flex-row justify-between items-center">
        <h1 className="text-2xl font-bold">Activation Codes</h1>
        <Button onClick={() => dispatch(getCodesByBatch(batchId))}>
          Refresh
        </Button>
      </div>
      <TableGrid
        data={list}
        columns={columns}
        isCompressView={false}
        isLoading={getCodesByBatchApi.isLoading}
        allowPagination={false}
        currentPage={currentPage}
        totalPages={1}
        totalRecords={list.length}
        pageLimit={list.length}
        onPageChange={(newPage) => setCurrentPage(newPage)}
      />
    </div>
  );
};

export default BatchCodes;
