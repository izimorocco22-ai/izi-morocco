import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import Button from "../../../components/Button";
import { cn } from "../../../lib/utils";
import TableGrid from "../../../components/table/TableGrid";
import { HeaderType } from "../../../utils/types";
import { formatDateToReadable } from "../../../utils/common";
import TooltipWrapper from "../../../components/TooltipWrapper";
import QrIcon from "../../../components/svgs/QRIcon";
import { getCodesByGroup } from "../../../slices/gameActivationSlice";
import GenerateQrModal from "../modals/GenerateQrModal";

const BatchCodes = () => {
  const dispatch = useDispatch();
  const { groupId } = useParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrData, setQrData] = useState(null);

  const { getCodesByGroupApi } = useSelector((state) => state.gameActivation);
  const { data, isLoading } = getCodesByGroupApi;

  useEffect(() => {
    if (groupId) {
      dispatch(getCodesByGroup({ groupId, page: currentPage }));
    }
  }, [dispatch, groupId, currentPage]);

  const list =
    data?.response?.docs?.map((a) => ({
      ...a,
      createdAt: formatDateToReadable(a.createdAt, false, true),
      expiresAt: formatDateToReadable(a.expiresAt, false, true),
      gameTitle: a.gameDetails?.title || "N/A",
      playerName: a.playerDetails?.name || "N/A",
      playerEmail: a.playerDetails?.email || "N/A",
    })) || [];

  const handleExport = () => {
    const headers = ["Activation Code", "Game Title", "Created At", "Expires At"];
    const rows = list.map((r) => [
      r.activationCode || "",
      r.gameTitle || "",
      r.createdAt || "",
      r.expiresAt || "",
    ]);
    const csv = [headers, ...rows].map((row) =>
      row
        .map((val) => {
          const s = String(val ?? "");
          const needsQuotes = /[",\n]/.test(s);
          const escaped = s.replace(/"/g, '""');
          return needsQuotes ? `"${escaped}"` : escaped;
        })
        .join(",")
    ).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `batch_codes_${groupId}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

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
      <div className="common-page flex flex-col gap-4">
        <div
          className={cn(
            "common-page",
            "flex flex-row justify-between items-center"
          )}
        >
          <h1 className="text-2xl font-bold">Batch Codes</h1>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleExport}>Export</Button>
            <Button onClick={() => window.history.back()}>Back</Button>
          </div>
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

export default BatchCodes;
