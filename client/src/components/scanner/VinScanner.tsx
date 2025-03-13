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
  const webcamRef = useRef<Webcam>(null);
  const { toast } = useToast();

  const handleCapture = () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      // For now, since we don't have OCR, let's just let users manually verify the VIN
      // by showing them the captured image
      toast({
        title: "Image Captured",
        description: "Please verify the VIN in the captured image",
      });
    }
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>
        <Button variant="outline" type="button">
          <Camera className="mr-2 h-4 w-4" />
          Scan VIN
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan Vehicle VIN</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
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
          <div className="mt-4">
            <Button onClick={handleCapture} className="w-full">
              Capture VIN
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Point your camera at the vehicle's VIN plate and take a clear photo
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}