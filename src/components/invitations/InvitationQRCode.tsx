import { uiText } from "../../i18n/uiText";
import { useEffect, useState } from "react";
import { Modal } from "../ui/Modal";
import { toast } from "sonner";
import { errorMessage } from "../../utils";
export function InvitationQRCode({
  url,
  title,
  onClose,
}: {
  url: string;
  title: string;
  onClose: () => void;
}) {
  const [image, setImage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let cancelled = false;
    import("qrcode")
      .then((module) =>
        module.toDataURL(url, {
          width: 1024,
          margin: 4,
          errorCorrectionLevel: "M",
          color: { dark: "#004b3d", light: "#ffffff" },
        }),
      )
      .then((result) => {
        if (!cancelled) setImage(result);
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err));
      });
    return () => {
      cancelled = true;
    };
  }, [url]);
  function download() {
    const link = document.createElement("a");
    link.href = image;
    link.download = "invitation-qr.png";
    link.click();
  }
  return (
    <Modal title={uiText("ui.e6aa1cb87f29")} onClose={onClose}>
      <p>{title}</p>
      <p className="helper">{uiText("ui.2849d63112fe")}</p>
      {image ? (
        <img
          className="invitation-qr-image"
          src={image}
          alt={uiText("ui.6cec2471e7dc")}
          width={256}
          height={256}
        />
      ) : (
        <p role="status">{error || "Generating QR code..."}</p>
      )}
      <div className="heading-actions">
        <button
          className="button outline"
          disabled={!image || busy}
          onClick={async () => {
            setBusy(true);
            try {
              const blob = await (await fetch(image)).blob(),
                file = new File([blob], "invitation-qr.png", {
                  type: "image/png",
                });
              if (navigator.canShare?.({ files: [file] }) && navigator.share)
                await navigator.share({
                  title: "Invitation QR code",
                  files: [file],
                });
              else {
                download();
                toast.info(uiText("ui.508b7ef2e55f"));
              }
            } catch (err) {
              if (!(err instanceof Error && err.name === "AbortError"))
                toast.error(errorMessage(err));
            } finally {
              setBusy(false);
            }
          }}
        >
          {uiText("ui.cd9c0d58426c")}
        </button>
        <button className="button primary" disabled={!image} onClick={download}>
          {uiText("ui.82c965655426")}
        </button>
        <button
          className="button outline"
          disabled={!image || busy}
          onClick={async () => {
            setBusy(true);
            try {
              const { jsPDF } = await import("jspdf");
              const pdf = new jsPDF({ unit: "mm", format: "a4" });
              pdf.addImage(image, "PNG", 45, 55, 120, 120);
              pdf.save("invitation-qr.pdf");
            } catch (err) {
              toast.error(errorMessage(err));
            } finally {
              setBusy(false);
            }
          }}
        >
          {uiText("ui.d5feeaa5880a")}
        </button>
      </div>
    </Modal>
  );
}
