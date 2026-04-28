import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import yapeQrImage from "@assets/WhatsApp_Image_2026-04-25_at_5.55.43_PM_1777157780733.jpeg";

interface YapeQRProps {
  size?: number;
  showCaption?: boolean;
  className?: string;
}

export function YapeQR({ size = 96, showCaption = true, className }: YapeQRProps) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          data-testid="yape-qr-trigger"
          className={
            "group inline-flex flex-col items-center gap-1 rounded-md bg-white p-2 shadow-sm hover:ring-2 hover:ring-primary transition " +
            (className ?? "")
          }
          aria-label="Mostrar código QR de Yape para pagar"
        >
          <img
            src={yapeQrImage}
            alt="QR Yape · Miguel Angel Montero Garcia · 991 740 590"
            width={size}
            height={size}
            style={{ width: size, height: size, objectFit: "contain" }}
            className="rounded"
          />
          {showCaption && (
            <span className="text-[10px] font-medium uppercase tracking-wider text-purple-700">
              Yape · 991 740 590
            </span>
          )}
        </button>
      </DialogTrigger>
      <DialogContent
        className="max-w-md p-0 overflow-hidden bg-purple-700"
        data-testid="yape-qr-dialog"
      >
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-white">
            Paga con Yape · Miguel Angel Montero Garcia
          </DialogTitle>
          <DialogDescription className="text-purple-100">
            Escanea este código desde la app Yape o usa el número 991 740 590.
            Después avísanos por el chat de JARVIS para activar tu módulo.
          </DialogDescription>
        </DialogHeader>
        <div className="bg-purple-700 px-6 pb-6 pt-3 flex flex-col items-center gap-3">
          <img
            src={yapeQrImage}
            alt="QR Yape · Miguel Angel Montero Garcia · 991 740 590"
            className="w-full max-w-xs rounded-lg shadow-lg"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
