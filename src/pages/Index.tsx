import { useState } from "react";
import StartScreen from "@/components/photobooth/StartScreen";
import FrameSelectScreen, { type FrameId } from "@/components/photobooth/FrameSelectScreen";
import CameraScreen, { FRAME_SLOT_COUNT } from "@/components/photobooth/CameraScreen";
import ReviewScreen from "@/components/photobooth/ReviewScreen";
import ResultScreen from "@/components/photobooth/ResultScreen";

type Step = "start" | "frame" | "camera" | "review" | "result";

const Index = () => {
  const [step, setStep] = useState<Step>("start");
  const [selectedFrame, setSelectedFrame] = useState<FrameId>("freshman");
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [framedPhoto, setFramedPhoto] = useState<string>("");

  const totalSlots = FRAME_SLOT_COUNT[selectedFrame] || 4;

  const handleStart = () => setStep("frame");

  const handleFrameSelect = (frameId: FrameId) => {
    setSelectedFrame(frameId);
    setCapturedPhotos([]);
    setStep("camera");
  };

  const handleCapture = (photoDataUrl: string) => {
    const updated = [...capturedPhotos, photoDataUrl];
    setCapturedPhotos(updated);
    if (updated.length >= totalSlots) {
      // All slots filled, go to review
      setStep("review");
    }
    // Otherwise stay on camera for next shot
  };

  const handleConfirm = (framedPhotoUrl: string) => {
    setFramedPhoto(framedPhotoUrl);
    setStep("result");
  };

  const handleRetake = () => {
    setCapturedPhotos([]);
    setStep("camera");
  };

  const handleRestart = () => {
    setCapturedPhotos([]);
    setFramedPhoto("");
    setSelectedFrame("freshman");
    setStep("start");
  };

  return (
    <div className="min-h-screen">
      {step === "start" && <StartScreen onStart={handleStart} />}
      {step === "frame" && <FrameSelectScreen onSelect={handleFrameSelect} onBack={() => setStep("start")} />}
      {step === "camera" && (
        <CameraScreen
          frameId={selectedFrame}
          currentSlot={capturedPhotos.length + 1}
          totalSlots={totalSlots}
          onCapture={handleCapture}
          onBack={() => setStep("frame")}
        />
      )}
      {step === "review" && (
        <ReviewScreen
          photos={capturedPhotos}
          frameId={selectedFrame}
          onConfirm={handleConfirm}
          onRetake={handleRetake}
        />
      )}
      {step === "result" && <ResultScreen framedPhotoUrl={framedPhoto} onRestart={handleRestart} />}
    </div>
  );
};

export default Index;
