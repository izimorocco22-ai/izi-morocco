import Modal from "../../../components/Modal";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import TableGrid from "../../../components/table/TableGrid";
import { HeaderType } from "../../../utils/types";
import { formatDateToReadable } from "../../../utils/common";
import TooltipWrapper from "../../../components/TooltipWrapper";
import QrIcon from "../../../components/svgs/QRIcon";
import { getCodesByBatch, resetApiStateFromGameActivation } from "../../../slices/gameActivationSlice";
import SpinnerIcon from "../../../components/svgs/SpinnerIcon";
import Button from "../../../components/Button";

const GroupCodesModal = ({ open = true, onOpenChange, data, onGenerateQr }) => {
  const dispatch = useDispatch();
  const { getCodesByBatchApi } = useSelector((state) => state.gameActivation);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (data?.batchId) {
      dispatch(getCodesByBatch(data.batchId));
    }
    return () => {
      dispatch(resetApiStateFromGameActivation("getCodesByBatchApi"));
    };
  }, [dispatch, data?.batchId]);

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
          onClick: (row) => onGenerateQr?.(row),
        },
      ],
    },
  ];

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={<span className="text-2xl">Activation Codes</span>}
      contentClassName="min-w-[90%] lg:min-w-[840px] min-h-[70vh] overflow-y-auto overflow-x-clip"
      className="overflow-y-scroll scrollbar-hide text-blue min-h-[200px]"
      showClose
    >
      <div className="flex items-center justify-between p-4">
        <div className="font-semibold">
          Group: {data?.gameName || "N/A"} • {data?.batchId}
        </div>
        <Button
          onClick={() => dispatch(getCodesByBatch(data?.batchId))}
          className="w-fit"
        >
          Refresh {getCodesByBatchApi.isLoading && <SpinnerIcon />}
        </Button>
      </div>
      <div className="p-4">
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
    </Modal>
  );
};

export default GroupCodesModal;
