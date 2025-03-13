import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Camera, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { decodeVIN, vinSchema } from "@/lib/vin";
import Quagga from 'quagga';

interface VinScannerProps {
  onScan: (vin: string) => void;
}

export function VinScanner({ onScan }: VinScannerProps) {
  const [open, setOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const videoRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!open || !videoRef.current) return;

    setIsInitializing(true);
    console.log("Requesting camera access...");

    // Simple camera access first
    navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { exact: "environment" }, // Prefer back camera
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    })
    .then(stream => {
      console.log("Camera access granted");
      if (videoRef.current) {
        // Initialize Quagga
        Quagga.init({
          inputStream: {
            name: "Live",
            type: "LiveStream",
            target: videoRef.current,
            constraints: {
              facingMode: "environment", // Use back camera
              width: 1280,
              height: 720,
            },
          },
          decoder: {
            readers: ["code_39_reader"], // VIN uses Code 39 format
            debug: {
              drawBoundingBox: true,
              showPattern: true,
            },
          },
        }, (err) => {
          if (err) {
            console.error("Quagga initialization failed:", err);
            toast({
              title: "Scanner Error",
              description: "Failed to initialize scanner. Please try again.",
              variant: "destructive",
            });
            setOpen(false);
            setIsInitializing(false);
            return;
          }

          console.log("Quagga initialized successfully");
          setIsInitializing(false);
          setIsScanning(true);
          Quagga.start();
        });
      }
    })
    .catch(error => {
      console.error("Camera access error:", error);
      toast({
        title: "Camera Access Error",
        description: "Please allow camera access in your browser settings and try again",
        variant: "destructive",
      });
      setOpen(false);
      setIsInitializing(false);
    });

    // Handle successful scans
    Quagga.onDetected(async (result) => {
      console.log("Detected code:", result.codeResult.code);
      const scannedVin = result.codeResult.code;

      // Basic VIN validation (17 characters)
      if (scannedVin && scannedVin.length === 17) {
        try {
          // Verify VIN using NHTSA API
          const validatedVin = await vinSchema.parseAsync(scannedVin);
          const vehicleInfo = await decodeVIN(validatedVin);

          if (vehicleInfo) {
            onScan(scannedVin);
            setOpen(false);
            toast({
              title: "Success",
              description: `Found ${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}`,
            });
          }
        } catch (error) {
          console.error("VIN validation error:", error);
          toast({
            title: "Invalid VIN",
            description: "Please try scanning again",
            variant: "destructive",
          });
        }
      }
    });

    return () => {
      if (isScanning) {
        console.log("Stopping Quagga...");
        Quagga.stop();
        setIsScanning(false);
      }
    };
  }, [open, onScan, toast]);

  return (
    <Dialog 
      open={open} 
      onOpenChange={(newOpen) => {
        if (!newOpen && isScanning) {
          Quagga.stop();
          setIsScanning(false);
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
          <DialogTitle>Scan VIN Barcode</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          {isInitializing ? (
            <div className="w-full aspect-video bg-muted rounded-lg flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Initializing camera...</span>
            </div>
          ) : (
            <>
              <div 
                ref={videoRef} 
                className="w-full aspect-video bg-muted rounded-lg overflow-hidden"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Point your camera at the vehicle's VIN barcode
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}