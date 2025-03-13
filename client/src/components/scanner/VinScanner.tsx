import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Camera, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BrowserMultiFormatReader, Result, BarcodeFormat } from '@zxing/library';

interface VinScannerProps {
  onScan: (vin: string) => void;
}

export function VinScanner({ onScan }: VinScannerProps) {
  const [open, setOpen] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;

    setIsInitializing(true);
    console.log("Initializing barcode scanner...");

    const codeReader = new BrowserMultiFormatReader();
    codeReader.setHints(new Map([[BarcodeFormat.CODE_39, {}]])); // VIN barcodes typically use Code 39

    // Request camera access
    navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { exact: "environment" }, // Use back camera
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    })
    .then(stream => {
      console.log("Camera access granted");
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();

        // Start continuous barcode scanning
        const scanInterval = setInterval(() => {
          if (!videoRef.current) return;

          codeReader.decodeFromVideoElement(videoRef.current)
            .then((result: Result) => {
              const scannedVin = result.getText();
              console.log("Scanned VIN:", scannedVin);

              // Validate VIN format (17 characters)
              if (scannedVin.length === 17) {
                onScan(scannedVin);
                setOpen(false);
                clearInterval(scanInterval);

                toast({
                  title: "VIN Scanned!",
                  description: "Vehicle identification number successfully captured",
                });
              }
            })
            .catch(() => {
              // Ignore errors during continuous scanning
            });
        }, 500); // Check every 500ms

        setIsInitializing(false);

        // Cleanup function
        return () => {
          clearInterval(scanInterval);
          codeReader.reset();
        };
      }
    })
    .catch(error => {
      console.error("Camera access error:", error);
      toast({
        title: "Camera Access Error",
        description: "Please allow camera access and try again",
        variant: "destructive",
      });
      setOpen(false);
      setIsInitializing(false);
    });

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [open, onScan, toast]);

  return (
    <Dialog 
      open={open} 
      onOpenChange={(newOpen) => {
        if (!newOpen && videoRef.current?.srcObject) {
          const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
          tracks.forEach(track => track.stop());
        }
        setOpen(newOpen);
      }}
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
          {isInitializing ? (
            <div className="w-full h-64 bg-muted rounded-md flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Initializing camera...</span>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
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