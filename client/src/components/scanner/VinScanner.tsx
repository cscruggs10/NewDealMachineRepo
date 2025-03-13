import { useState, useEffect } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Camera, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VinScannerProps {
  onScan: (vin: string) => void;
}

export function VinScanner({ onScan }: VinScannerProps) {
  const [open, setOpen] = useState(false);
  const [codeReader, setCodeReader] = useState<BrowserMultiFormatReader | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      console.log("Starting camera initialization...");
      setIsInitializing(true);

      // First check if we have camera permissions
      navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then(stream => {
          console.log("Camera permission granted, initializing scanner...");

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
              .then(() => {
                setIsInitializing(false);
                console.log("Camera initialized successfully");
              })
              .catch(err => {
                console.error("Error initializing scanner:", err);
                toast({
                  title: "Scanner Error",
                  description: "Failed to initialize the scanner. Please try again.",
                  variant: "destructive",
                });
                setOpen(false);
                setIsInitializing(false);
              });
          }
        })
        .catch(error => {
          console.error("Camera permission error:", error);
          toast({
            title: "Camera Access Denied",
            description: "Please allow camera access to scan VIN codes",
            variant: "destructive",
          });
          setOpen(false);
          setIsInitializing(false);
        });

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
          {isInitializing ? (
            <div className="w-full h-64 bg-muted rounded-md flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Initializing camera...</span>
            </div>
          ) : (
            <video
              id="video-preview"
              className="w-full h-64 object-cover rounded-md bg-muted"
            />
          )}
          <p className="text-sm text-muted-foreground mt-2">
            Point your camera at the vehicle's VIN barcode
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}