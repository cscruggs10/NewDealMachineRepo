import { useState, useEffect } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VinScannerProps {
  onScan: (vin: string) => void;
}

export function VinScanner({ onScan }: VinScannerProps) {
  const [open, setOpen] = useState(false);
  const [codeReader, setCodeReader] = useState<BrowserMultiFormatReader | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      const reader = new BrowserMultiFormatReader();
      setCodeReader(reader);

      const videoElement = document.getElementById('video-preview') as HTMLVideoElement;
      if (videoElement) {
        reader
          .decodeFromConstraints(
            {
              video: {
                facingMode: "environment",
                width: { min: 640, ideal: 1280, max: 1920 },
                height: { min: 480, ideal: 720, max: 1080 }
              }
            },
            videoElement,
            (result, error) => {
              if (result) {
                const scannedText = result.getText();
                // Most VINs are 17 characters long
                if (scannedText && scannedText.length === 17) {
                  onScan(scannedText);
                  setOpen(false);
                  toast({
                    title: "VIN Scanned",
                    description: "VIN has been successfully captured",
                  });
                }
              }
              if (error) {
                console.debug("No VIN found in current frame");
              }
            }
          )
          .catch(err => {
            console.error("Error accessing camera:", err);
            toast({
              title: "Camera Error",
              description: "Please make sure camera permissions are granted",
              variant: "destructive",
            });
            setOpen(false);
          });
      }

      return () => {
        if (codeReader) {
          console.log("Cleaning up camera...");
          codeReader.reset();
          setCodeReader(null);
        }
      };
    }
  }, [open, onScan, toast]);

  return (
    <Dialog 
      open={open} 
      onOpenChange={(newOpen) => {
        if (!newOpen && codeReader) {
          codeReader.reset();
          setCodeReader(null);
        }
        setOpen(newOpen);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" type="button" className="w-full">
          <Camera className="mr-2 h-4 w-4" />
          Scan VIN
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan Vehicle VIN</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <video
            id="video-preview"
            className="w-full h-64 object-cover rounded-md bg-muted"
          />
          <p className="text-sm text-muted-foreground mt-2">
            Point your camera at the vehicle's VIN barcode
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}