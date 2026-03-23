import { Check, RotateCcw } from "lucide-react";
import frameFreshman from "@/assets/frame-freshman.png";
import frameK71 from "@/assets/frame-k71.png";
import frameBronzeDrum from "@/assets/frame-bronze-drum.png";
import type { FrameId } from "./FrameSelectScreen";
import { useRef, useEffect, useState } from "react";
import frameNew from "@/assets/IMG_4734.png";

const frameImages: Record<FrameId, string> = {
  freshman: frameFreshman,
  k71: frameK71,
  "bronze-drum": frameBronzeDrum,
  new: frameNew,
};

type SlotRect = { x: number; y: number; w: number; h: number };

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

/**
 * Scan the frame image to find transparent (or near-white) rectangular regions.
 * Returns bounding boxes as fractional coordinates.
 */
function detectSlots(frameImg: HTMLImageElement, expectedCount: number): SlotRect[] {
  const w = frameImg.naturalWidth;
  const h = frameImg.naturalHeight;

  // Draw frame to a temp canvas to read pixels
  const tmpCanvas = document.createElement("canvas");
  tmpCanvas.width = w;
  tmpCanvas.height = h;
  const tmpCtx = tmpCanvas.getContext("2d")!;
  tmpCtx.drawImage(frameImg, 0, 0);
  const imageData = tmpCtx.getImageData(0, 0, w, h);
  const data = imageData.data;

  // Create a binary mask: 1 = transparent or white (slot area)
  const isSlotPixel = (px: number, py: number): boolean => {
    const idx = (py * w + px) * 4;
    const r = data[idx], g = data[idx + 1], b = data[idx + 2], a = data[idx + 3];
    // Transparent pixel
    if (a < 30) return true;
    // Near-white pixel (could be slot background)
    if (a > 200 && r > 230 && g > 230 && b > 230) return true;
    return false;
  };

  // Scan columns to find horizontal extent of slot regions
  // Sample rows to find vertical slot boundaries
  const step = Math.max(1, Math.floor(Math.min(w, h) / 500));

  // Build vertical profile: for each row, count how many pixels are "slot"
  const rowSlotCount: number[] = [];
  for (let y = 0; y < h; y += step) {
    let count = 0;
    for (let x = 0; x < w; x += step) {
      if (isSlotPixel(x, y)) count++;
    }
    rowSlotCount.push(count);
  }

  // A row is "in slot" if more than 30% of pixels are slot-like
  const threshold = (w / step) * 0.3;
  const rowIsSlot = rowSlotCount.map(c => c > threshold);

  // Find contiguous vertical bands of slot rows
  const bands: { startRow: number; endRow: number }[] = [];
  let inBand = false;
  let bandStart = 0;
  for (let i = 0; i < rowIsSlot.length; i++) {
    if (rowIsSlot[i] && !inBand) {
      inBand = true;
      bandStart = i;
    } else if (!rowIsSlot[i] && inBand) {
      inBand = false;
      const bandHeight = i - bandStart;
      // Only count bands that are tall enough (at least 5% of image)
      if (bandHeight * step > h * 0.05) {
        bands.push({ startRow: bandStart, endRow: i - 1 });
      }
    }
  }
  if (inBand) {
    const bandHeight = rowIsSlot.length - bandStart;
    if (bandHeight * step > h * 0.05) {
      bands.push({ startRow: bandStart, endRow: rowIsSlot.length - 1 });
    }
  }

  // For each band, find horizontal extent by scanning columns
  const slots: SlotRect[] = [];
  for (const band of bands) {
    const yStart = band.startRow * step;
    const yEnd = Math.min(band.endRow * step, h - 1);
    const midY = Math.floor((yStart + yEnd) / 2);

    // Find left and right edges at mid-row
    let left = 0, right = w - 1;
    for (let x = 0; x < w; x++) {
      if (isSlotPixel(x, midY)) { left = x; break; }
    }
    for (let x = w - 1; x >= 0; x--) {
      if (isSlotPixel(x, midY)) { right = x; break; }
    }

    // Check if this band contains multiple horizontal slots (like freshman frame)
    // Scan the mid-row for gaps
    const hSegments: { start: number; end: number }[] = [];
    let inSeg = false;
    let segStart = 0;
    for (let x = left; x <= right; x++) {
      const sp = isSlotPixel(x, midY);
      if (sp && !inSeg) { inSeg = true; segStart = x; }
      else if (!sp && inSeg) {
        inSeg = false;
        if (x - segStart > w * 0.05) {
          hSegments.push({ start: segStart, end: x - 1 });
        }
      }
    }
    if (inSeg && right - segStart > w * 0.05) {
      hSegments.push({ start: segStart, end: right });
    }

    if (hSegments.length > 1) {
      // Multiple horizontal segments in this band - separate slots
      for (const seg of hSegments) {
        // Refine vertical extent for this specific horizontal segment
        const segMidX = Math.floor((seg.start + seg.end) / 2);
        let top = yStart, bottom = yEnd;
        for (let y = yStart; y <= yEnd; y++) {
          if (isSlotPixel(segMidX, y)) { top = y; break; }
        }
        for (let y = yEnd; y >= yStart; y--) {
          if (isSlotPixel(segMidX, y)) { bottom = y; break; }
        }
        slots.push({
          x: seg.start / w,
          y: top / h,
          w: (seg.end - seg.start) / w,
          h: (bottom - top) / h,
        });
      }
    } else {
      // Single slot in this band
      slots.push({
        x: left / w,
        y: yStart / h,
        w: (right - left) / w,
        h: (yEnd - yStart) / h,
      });
    }
  }

  console.log(`Detected ${slots.length} slots for frame:`, slots);

  // If we detected more slots than expected, try to merge or trim
  if (slots.length > expectedCount) {
    // Sort by area descending and take the largest ones
    slots.sort((a, b) => (b.w * b.h) - (a.w * a.h));
    slots.length = expectedCount;
    // Re-sort by position (top to bottom, left to right)
    slots.sort((a, b) => a.y - b.y || a.x - b.x);
  }

  return slots;
}

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number, dy: number, dw: number, dh: number
) {
  const imgAspect = img.naturalWidth / img.naturalHeight;
  const destAspect = dw / dh;
  let sx: number, sy: number, sw: number, sh: number;

  if (imgAspect > destAspect) {
    sh = img.naturalHeight;
    sw = sh * destAspect;
    sx = (img.naturalWidth - sw) / 2;
    sy = 0;
  } else {
    sw = img.naturalWidth;
    sh = sw / destAspect;
    sx = 0;
    sy = (img.naturalHeight - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

interface ReviewScreenProps {
  photos: string[];
  frameId: FrameId;
  onConfirm: (framedPhotoUrl: string) => void;
  onRetake: () => void;
}

const SLOT_COUNTS: Record<FrameId, number> = {
  freshman: 3,
  k71: 4,
  "bronze-drum": 4,
  new: 1,
};
// Định nghĩa tọa độ chính xác cho từng khung hình
// MẸO: Tọa độ (w, h) được làm to ra một chút để ảnh "chui" xuống dưới viền khung, che đi các khoảng hở.
const FRAME_LAYOUTS: Record<FrameId, SlotRect[]> = {
  freshman: [
    // Ô ảnh thứ 1 (Trên cùng bên trái)
    { x: 0.05, y: 0.07, w: 0.43, h: 0.38 },
    // Ô ảnh thứ 2 (Dưới cùng bên trái)
    { x: 0.05, y: 0.45, w: 0.43, h: 0.38 },
    // Ô ảnh thứ 3 (Ô to bên phải)
    { x: 0.48, y: 0.23, w: 0.46, h: 0.38 },
  ],
  k71: [
    // Ô 1 (Trên cùng) - Tăng x, w rộng ra để lấp đầy 2 bên
    { x: 0.05, y: 0.17, w: 0.90, h: 0.20 },
    // Ô 2
    { x: 0.05, y: 0.37, w: 0.90, h: 0.20 },
    // Ô 3
    { x: 0.05, y: 0.57, w: 0.90, h: 0.20 },
    // Ô 4 (Dưới cùng)
    { x: 0.05, y: 0.76, w: 0.90, h: 0.20 },
  ],
  "bronze-drum": [
    // Ô 1 (Trên cùng)
    { x: 0.05, y: 0.20, w: 0.90, h: 0.20 },
    // Ô 2
    { x: 0.05, y: 0.39, w: 0.90, h: 0.20 },
    // Ô 3
    { x: 0.05, y: 0.58, w: 0.90, h: 0.20 },
    // Ô 4 (Dưới cùng)
    { x: 0.05, y: 0.77, w: 0.90, h: 0.20 },
  ],
new: [
    {
      x: 0.005, // Dịch sang trái nhiều hơn để lấp viền trắng bên trái
      y: 0.17, // Dịch lên trên một chút để lấp viền trên
      w: 0.99, // Kéo rộng chiều ngang ra để lấp viền trắng bên phải
      h: 0.36, // Kéo dài chiều cao xuống để lấp viền trắng phía dưới
    },
  ],
};

const ReviewScreen = ({ photos, frameId, onConfirm, onRetake }: ReviewScreenProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [framedUrl, setFramedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const compose = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      try {
        const [frameImg, ...photoImgs] = await Promise.all([
          loadImage(frameImages[frameId]),
          ...photos.map((src) => loadImage(src)),
        ]);

        if (cancelled) return;

        canvas.width = frameImg.naturalWidth;
        canvas.height = frameImg.naturalHeight;

        // Auto-detect transparent/white slot regions in the frame
const slots = FRAME_LAYOUTS[frameId];

        // Draw photos FIRST (behind the frame)
        slots.forEach((slot, i) => {
          if (i >= photoImgs.length) return;
          const dx = slot.x * canvas.width;
          const dy = slot.y * canvas.height;
          const dw = slot.w * canvas.width;
          const dh = slot.h * canvas.height;

          ctx.save();
          ctx.beginPath();
          ctx.rect(dx, dy, dw, dh);
          ctx.clip();
          drawImageCover(ctx, photoImgs[i], dx, dy, dw, dh);
          ctx.restore();
        });

        // Draw frame ON TOP of photos
        ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);

        if (!cancelled) {
          setFramedUrl(canvas.toDataURL("image/png"));
        }
      } catch (e) {
        console.error("Compose error:", e);
        if (!cancelled) setError("Lỗi ghép ảnh. Vui lòng thử lại.");
      }
    };

    compose();
    return () => { cancelled = true; };
  }, [photos, frameId]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 gap-8">
      <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
        Xem trước ảnh
      </h2>

      <div className="w-full max-w-md aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border-4 border-border bg-muted flex items-center justify-center">
        {framedUrl ? (
          <img src={framedUrl} alt="Ảnh đã ghép khung" className="w-full h-full object-contain" />
        ) : error ? (
          <p className="text-destructive font-display font-semibold px-4 text-center">{error}</p>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-heritage-red border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground font-body">Đang ghép ảnh...</p>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="flex gap-4">
        <button
          onClick={onRetake}
          className="flex items-center gap-3 bg-academic-blue text-secondary-foreground font-display font-bold text-xl px-10 py-5 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 min-h-[80px]"
        >
          <RotateCcw className="w-6 h-6" />
          Chụp lại
        </button>
        <button
          onClick={() => framedUrl && onConfirm(framedUrl)}
          disabled={!framedUrl}
          className="flex items-center gap-3 bg-heritage-red text-primary-foreground font-display font-bold text-xl px-10 py-5 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 min-h-[80px] disabled:opacity-50"
        >
          <Check className="w-6 h-6" />
          OK – Lưu ảnh
        </button>
      </div>
    </div>
  );
};

export default ReviewScreen;
