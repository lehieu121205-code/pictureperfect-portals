import { Camera } from "lucide-react";

interface StartScreenProps {
  onStart: () => void;
}

const StartScreen = ({ onStart }: StartScreenProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8 gap-12">
      <div className="text-center space-y-4">
        <h1 className="font-display text-5xl md:text-7xl font-extrabold text-foreground tracking-tight">
          VNU – USSH
        </h1>
        <p className="font-display text-2xl md:text-3xl font-semibold text-heritage-red">
          AI Photobooth
        </p>
        <p className="text-lg text-muted-foreground">
          Trường Đại học Khoa học Xã hội và Nhân văn
        </p>
      </div>

      <button
        onClick={onStart}
        className="group relative flex items-center justify-center gap-4 bg-heritage-red text-primary-foreground font-display font-bold text-2xl md:text-3xl px-16 py-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200 active:scale-95 min-h-[80px] min-w-[300px]"
      >
        <Camera className="w-8 h-8" />
        Bắt đầu chụp
      </button>

      <p className="text-muted-foreground text-sm">
        Chạm vào nút để bắt đầu • Tap to start
      </p>
    </div>
  );
};

export default StartScreen;
