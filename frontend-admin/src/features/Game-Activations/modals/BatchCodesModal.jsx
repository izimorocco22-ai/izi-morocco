import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Modal from "../../../components/Modal";
import TableGrid from "../../../components/table/TableGrid";
import { HeaderType } from "../../../utils/types";
import { formatDateToReadable } from "../../../utils/common";
import TooltipWrapper from "../../../components/TooltipWrapper";
import QrIcon from "../../../components/svgs/QRIcon";
import Button from "../../../components/Button";
import { getCodesByGroup } from "../../../slices/gameActivationSlice";
import GenerateQrModal from "./GenerateQrModal";

const BatchCodesModal = ({ open = true, onOpenChange = () => {}, group }) => {
  const dispatch = useDispatch();
  const [currentPage, setCurrentPage] = useState(1);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrData, setQrData] = useState(null);
  const { getCodesByGroupApi } = useSelector((state) => state.gameActivation);
  const { data, isLoading } = getCodesByGroupApi;

  useEffect(() => {
    if (group?.groupId) {
      dispatch(getCodesByGroup({ groupId: group.groupId, page: currentPage }));
    }
  }, [dispatch, group?.groupId, currentPage]);

  const list =
    data?.response?.docs?.map((a) => ({
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
          onClick: (row) => {
            setQrData({
              id: row._id,
              playerId: row.playerId,
              playerEmail: row.playerEmail,
              gameId: row?.gameDetails?._id,
              activationCode: row.activationCode,
              gameName: row.gameTitle,
            });
            setQrOpen(true);
          },
        },
      ],
    },
  ];

  return (
    <>
      <Modal
        open={open}
        onOpenChange={onOpenChange}
        title={<span className="text-2xl">Batch Codes</span>}
        contentClassName="min-w-[90%] lg:min-w-[840px] min-h-[70vh] overflow-y-auto overflow-x-clip"
        className="overflow-y-scroll scrollbar-hide text-blue min-h-[200px]"
        showClose
      >
        <div className="p-4 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div className="text-sm">
              Group: {group?.groupId} • Codes: {group?.codeCount}
            </div>
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
          <TableGrid
            data={list}
            columns={columns}
            isCompressView={false}
            isLoading={isLoading}
            allowPagination={true}
            currentPage={currentPage}
            totalPages={1}
            totalRecords={list.length}
            pageLimit={list.length || 10}
            onPageChange={(newPage) => setCurrentPage(newPage)}
          />
        </div>
      </Modal>
      {qrOpen && (
        <GenerateQrModal
          open={qrOpen}
          onOpenChange={(v) => setQrOpen(v)}
          data={qrData}
        />
      )}
    </>
  );
};

export default BatchCodesModal;
