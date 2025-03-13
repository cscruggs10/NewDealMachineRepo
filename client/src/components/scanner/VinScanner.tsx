import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Webcam from "react-webcam";

interface VinScannerProps {
  onScan: (vin: string) => void;
}

export function VinScanner({ onScan }: VinScannerProps) {
  const [open, setOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const webcamRef = useRef<Webcam>(null);
  const { toast } = useToast();

  const handleCapture = () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setCapturedImage(imageSrc);
      toast({
        title: "Photo Captured",
        description: "Use this photo to verify and enter the VIN number",
      });
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(newOpen) => {
        setOpen(newOpen);
        if (!newOpen) {
          setCapturedImage(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" type="button">
          <Camera className="mr-2 h-4 w-4" />
          Take VIN Photo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Capture VIN Photo</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          {!capturedImage ? (
            <>
              <Webcam
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{
                  facingMode: { exact: "environment" },
                  width: 1280,
                  height: 720
                }}
                className="w-full rounded-lg"
              />
              <Button onClick={handleCapture} className="w-full mt-4">
                Capture Photo
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                Take a clear photo of the VIN plate
              </p>
            </>
          ) : (
            <>
              <img 
                src={capturedImage} 
                alt="Captured VIN" 
                className="w-full rounded-lg"
              />
              <div className="flex gap-2 mt-4">
                <Button onClick={handleRetake} variant="outline" className="flex-1">
                  Retake Photo
                </Button>
                <Button onClick={() => setOpen(false)} className="flex-1">
                  Use Photo
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Use this photo as reference while entering the VIN
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}