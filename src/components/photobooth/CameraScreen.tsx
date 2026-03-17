import { useRef, useState, useEffect, useCallback } from "react";
import { ArrowLeft, Camera, Timer } from "lucide-react";
import type { FrameId } from "./FrameSelectScreen";

export const FRAME_SLOT_COUNT: Record<FrameId, number> = {
  freshman: 3,
  k71: 4,
  "bronze-drum": 4,
};

interface CameraScreenProps {
  frameId: FrameId;
  currentSlot: number;
  totalSlots: number;
  onCapture: (photoDataUrl: string) => void;
  onBack: () => void;
}

const CameraScreen = ({ frameId, currentSlot, totalSlots, onCapture, onBack }: CameraScreenProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showFlash, setShowFlash] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraReady(true);
        }
      } catch {
        setError("Không thể truy cập camera. Vui lòng cho phép quyền truy cập camera.");
      }
    };
    startCamera();
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 500);
    const dataUrl = canvas.toDataURL("image/png");
    onCapture(dataUrl);
  }, [onCapture]);

  const handleInstantCapture = () => {
    if (countdown !== null) return;
    capturePhoto();
  };

  const startCountdown = () => {
    if (countdown !== null) return;
    let count = 5;
    setCountdown(count);
    const interval = setInterval(() => {
      count--;
      if (count <= 0) {
        clearInterval(interval);
        setCountdown(null);
        capturePhoto();
      } else {
        setCountdown(count);
      }
    }, 1000);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8 gap-6">
        <p className="text-destructive text-xl font-display font-semibold text-center">{error}</p>
        <button onClick={onBack} className="bg-heritage-red text-primary-foreground font-display font-bold text-xl px-12 py-4 rounded-2xl min-h-[80px]">
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-foreground">
      <button
        onClick={onBack}
        className="absolute top-4 left-4 z-20 flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground transition-colors min-h-[48px] px-3"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-body">Quay lại</span>
      </button>

      {/* Slot indicator */}
      <div className="absolute top-4 right-4 z-20 bg-foreground/60 text-primary-foreground font-display font-bold text-lg px-5 py-2 rounded-xl backdrop-blur-sm">
        Ảnh {currentSlot} / {totalSlots}
      </div>

      {/* Camera feed */}
      <div className="relative w-full max-w-3xl aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover scale-x-[-1]"
        />

        {countdown !== null && (
          <div className="absolute inset-0 flex items-center justify-center bg-foreground/40 z-10">
            <span
              key={countdown}
              className="font-display text-[120px] md:text-[180px] font-extrabold text-primary-foreground animate-countdown drop-shadow-2xl"
            >
              {countdown}
            </span>
          </div>
        )}

        {showFlash && (
          <div className="absolute inset-0 bg-primary-foreground animate-flash z-20" />
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* Two capture buttons */}
      {cameraReady && countdown === null && (
        <div className="mt-8 flex gap-6">
          <button
            onClick={handleInstantCapture}
            className="flex items-center gap-3 bg-heritage-red text-primary-foreground font-display font-bold text-xl px-10 py-5 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200 active:scale-95 min-h-[80px]"
          >
            <Camera className="w-7 h-7" />
            Chụp ngay
          </button>
          <button
            onClick={startCountdown}
            className="flex items-center gap-3 bg-academic-blue text-secondary-foreground font-display font-bold text-xl px-10 py-5 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200 active:scale-95 min-h-[80px]"
          >
            <Timer className="w-7 h-7" />
            Hẹn giờ 5s
          </button>
        </div>
      )}
    </div>
  );
};

export default CameraScreen;
