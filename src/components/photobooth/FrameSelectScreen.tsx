import { ArrowLeft } from "lucide-react";
import frameFreshman from "@/assets/frame-freshman.png";
import frameK71 from "@/assets/frame-k71.png";
import frameBronzeDrum from "@/assets/frame-bronze-drum.png";
import frameNew from "@/assets/IMG_4734.png";

export type FrameId = "freshman" | "k71" | "bronze-drum" | "new";

interface Frame {
  id: FrameId;
  name: string;
  description: string;
  image: string;
}

const frames: Frame[] = [
  { id: "freshman", name: "Tân Sinh Viên", description: "Chủ đề chào đón tân sinh viên", image: frameFreshman },
  { id: "k71", name: "Nhà Ấm K71", description: "Khung kỷ niệm K71", image: frameK71 },
  { id: "bronze-drum", name: "VNU – USSH", description: "Khung trống đồng – văn hóa Việt", image: frameBronzeDrum },

  // 👇 THÊM MỚI
  { id: "new", name: "Lịch 2027", description: "Khung lịch mới", image: frameNew },
];

interface FrameSelectScreenProps {
  onSelect: (frameId: FrameId) => void;
  onBack: () => void;
}

const FrameSelectScreen = ({ onSelect, onBack }: FrameSelectScreenProps) => {
  return (
    <div className="flex flex-col min-h-screen bg-background p-6 md:p-10">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 self-start min-h-[48px]"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-body text-lg">Quay lại</span>
      </button>

      <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-2 text-foreground">
        Chọn khung ảnh
      </h2>
      <p className="text-center text-muted-foreground mb-8">Chọn một khung ảnh bạn thích</p>

      <div className="flex-1 flex items-center justify-center">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-6xl w-full">
          {frames.map((frame) => (
            <button
              key={frame.id}
              onClick={() => onSelect(frame.id)}
              className="group flex flex-col items-center bg-card rounded-2xl border-2 border-border hover:border-heritage-red shadow-md hover:shadow-xl transition-all duration-200 active:scale-[0.97] overflow-hidden p-4"
            >
              <div className="w-full aspect-[3/4] rounded-xl overflow-hidden mb-4 bg-muted">
                <img
                  src={frame.image}
                  alt={frame.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </div>
              <h3 className="font-display text-xl font-bold text-foreground">{frame.name}</h3>
              <p className="text-sm text-muted-foreground">{frame.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FrameSelectScreen;
