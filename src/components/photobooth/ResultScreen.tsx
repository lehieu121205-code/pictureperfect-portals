import { QRCodeSVG } from "qrcode.react";
import { RotateCcw, Download } from "lucide-react";
import { useState, useEffect } from "react";

interface ResultScreenProps {
  framedPhotoUrl: string;
  onRestart: () => void;
}

const ResultScreen = ({ framedPhotoUrl, onRestart }: ResultScreenProps) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    // Convert data URL to a smaller JPEG for QR encoding
    const canvas = document.createElement("canvas");
    const img = new Image();
    img.onload = () => {
      // Resize to small for QR-friendly data URL
      const maxDim = 200;
      const scale = Math.min(maxDim / img.width, maxDim / img.height);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const smallDataUrl = canvas.toDataURL("image/jpeg", 0.3);
        // If still too large for QR, just use a placeholder message
        if (smallDataUrl.length > 2500) {
          setQrDataUrl(framedPhotoUrl.substring(0, 2500));
        } else {
          setQrDataUrl(smallDataUrl);
        }
      }
    };
    img.src = framedPhotoUrl;
  }, [framedPhotoUrl]);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = framedPhotoUrl;
    link.download = `photobooth-${Date.now()}.png`;
    link.click();
  };


  return (
    <div className="flex flex-col lg:flex-row items-center justify-center min-h-screen bg-background p-6 gap-8">
      {/* Left: Photo */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-lg w-full">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
          Ảnh của bạn 🎉
        </h2>
        <div className="w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border-4 border-border">
          <img src={framedPhotoUrl} alt="Ảnh hoàn chỉnh" className="w-full h-full object-contain bg-muted" />
        </div>
      </div>

      {/* Right: QR + Actions */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-md w-full gap-8">
        <div className="text-center space-y-2">
          <h3 className="font-display text-2xl font-bold text-foreground">Quét mã QR</h3>
          <p className="text-muted-foreground font-body">Quét để tải ảnh về điện thoại</p>
        </div>

        <div className="bg-card p-6 rounded-2xl shadow-lg border border-border">
          <QRCodeSVG
            value={qrDataUrl}
            size={220}
            level="L"
            includeMargin
          />
        </div>

        <div className="flex flex-col gap-4 w-full max-w-xs">
          <button
            onClick={handleDownload}
            className="flex items-center justify-center gap-3 bg-academic-blue text-secondary-foreground font-display font-bold text-xl px-10 py-5 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 min-h-[80px] w-full"
          >
            <Download className="w-6 h-6" />
            Tải ảnh
          </button>

          <button
            onClick={onRestart}
            className="flex items-center justify-center gap-3 bg-heritage-red text-primary-foreground font-display font-bold text-xl px-10 py-5 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 min-h-[80px] w-full"
          >
            <RotateCcw className="w-6 h-6" />
            Bắt đầu lại
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultScreen;
