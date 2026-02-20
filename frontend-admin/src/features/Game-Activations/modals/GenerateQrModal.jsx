import React, { useMemo, useState } from "react";
import Modal from "../../../components/Modal";
import Button from "../../../components/Button";

const QR_API = (payload, size = 300) =>
  `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
    payload
  )}&size=${size}x${size}`;

const GenerateQrModal = ({ open = true, onOpenChange = () => {}, data }) => {
  const [size, setSize] = useState(300);

  const payload = useMemo(() => {
    // allow passing already-serialized strings or objects
    if (!data) return "";
    return typeof data === "string" ? data : JSON.stringify(data);
  }, [data]);

  const src = useMemo(() => QR_API(payload, size), [payload, size]);

  const handleDownload = async () => {
    try {
      const res = await fetch(src);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `qr_${data?.gameName}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed", err);
      alert("Failed to download QR image");
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(payload || "");
      alert("Payload copied to clipboard");
    } catch (err) {
      console.error("Copy failed", err);
      alert("Copy to clipboard failed");
    }
  };

  const handleShare = () => {
    if (!data) return;

    const email = data.playerEmail;
    if (!email || email === "N/A") {
      alert("Player email not available to share this code.");
      return;
    }

    const subject = `${data.gameName || "Game"} - ${
      data.activationCode || "Code"
    }`;
    const lines = [
      "Hello,",
      "",
      `Game: ${data.gameName || "Your game"}`,
      `Activation code: ${data.activationCode || ""}`,
      "",
      "Use this code to activate and start the game in the izi Morocco app.",
    ];

    const mailto = `mailto:${encodeURIComponent(
      email
    )}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
      lines.join("\n")
    )}`;

    try {
      window.open(mailto, "_blank", "noopener,noreferrer");
    } catch {
      window.location.href = mailto;
    }
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Generate QR Code">
      <div className="p-4">
        {!data ? (
          <div className="text-sm text-muted">No data provided.</div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <img src={src} alt="QR Code" className="w-64 h-64 object-contain" />

            <div className="flex gap-2 items-center">
              <label className="text-sm">Size</label>
              <select
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="border rounded px-2 py-1"
              >
                <option value={150}>150</option>
                <option value={200}>200</option>
                <option value={300}>300</option>
                <option value={500}>500</option>
              </select>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleDownload}>Download PNG</Button>
              <Button variant="outline" onClick={handleCopy}>
                Copy Payload
              </Button>
              <Button variant="outline" onClick={handleShare}>
                Share via Email
              </Button>
              <Button variant="secondary" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>

            {/* <details className="w-full max-w-xl mt-2">
              <summary className="text-sm font-medium">Payload (click to view)</summary>
              <pre className="text-xs whitespace-pre-wrap bg-slate-50 p-2 rounded mt-2 overflow-auto max-h-48">
                {payload}
              </pre>
            </details> */}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default GenerateQrModal;
