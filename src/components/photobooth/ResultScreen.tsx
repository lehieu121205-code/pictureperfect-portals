import { QRCodeSVG } from "qrcode.react";
import { RotateCcw, Download, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

interface ResultScreenProps {
  framedPhotoUrl: string; // Đây là chuỗi Base64 từ màn hình trước
  onRestart: () => void;
}

const ResultScreen = ({ framedPhotoUrl, onRestart }: ResultScreenProps) => {
  const [onlineImageUrl, setOnlineImageUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(true);

  // API Key của bạn đã lấy từ ImgBB
  const IMGBB_API_KEY = "dbd48e3fe64c03a8a58efd878f07bca1"; 

  useEffect(() => {
    const uploadImage = async () => {
      try {
        setIsUploading(true);
        
        // 1. Tách bỏ phần đầu "data:image/png;base64," để lấy nội dung ảnh thuần túy
        const base64Content = framedPhotoUrl.split(",")[1];

        // 2. Chuẩn bị dữ liệu gửi lên ImgBB
        const formData = new FormData();
        formData.append("image", base64Content);

        // 3. Gọi API của ImgBB để tải ảnh lên
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
          method: "POST",
          body: formData,
        });

        const result = await response.json();

        if (result.success) {
          // 4. Lưu lại đường link ảnh online để gán vào mã QR
          setOnlineImageUrl(result.data.url);
        } else {
          console.error("Lỗi từ ImgBB:", result);
        }
      } catch (error) {
        console.error("Lỗi kết nối khi tải ảnh:", error);
      } finally {
        setIsUploading(false);
      }
    };

    if (framedPhotoUrl) {
      uploadImage();
    }
  }, [framedPhotoUrl]);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = framedPhotoUrl;
    link.download = `photobooth-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="flex flex-col lg:flex-row items-center justify-center min-h-screen bg-background p-6 gap-8">
      {/* Bên trái: Hiển thị ảnh vừa chụp */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-lg w-full">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
          Ảnh của bạn 🎉
        </h2>
        <div className="w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border-4 border-border">
          <img src={framedPhotoUrl} alt="Ảnh hoàn chỉnh" className="w-full h-full object-contain bg-muted" />
        </div>
      </div>

      {/* Bên phải: QR Code + Các nút thao tác */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-md w-full gap-8">
        <div className="text-center space-y-2">
          <h3 className="font-display text-2xl font-bold text-foreground">Quét mã QR</h3>
          <p className="text-muted-foreground font-body">Quét để tải ảnh về điện thoại</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg border border-border min-h-[260px] flex items-center justify-center">
          {isUploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 animate-spin text-academic-blue" />
              <p className="text-sm font-body text-muted-foreground">Đang tạo mã QR...</p>
            </div>
          ) : onlineImageUrl ? (
            <QRCodeSVG
              value={onlineImageUrl} // Mã QR giờ đây chứa link ảnh online xịn xò
              size={220}
              level="H" // Tăng mức độ sửa lỗi để quét dễ hơn
              includeMargin
            />
          ) : (
            <p className="text-destructive font-bold">Không thể tạo mã QR</p>
          )}
        </div>

        <div className="flex flex-col gap-4 w-full max-w-xs">
          <button
            onClick={handleDownload}
            className="flex items-center justify-center gap-3 bg-academic-blue text-white font-display font-bold text-xl px-10 py-5 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 min-h-[80px] w-full"
          >
            <Download className="w-6 h-6" />
            Tải ảnh
          </button>

          <button
            onClick={onRestart}
            className="flex items-center justify-center gap-3 bg-heritage-red text-white font-display font-bold text-xl px-10 py-5 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 min-h-[80px] w-full"
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
