import { useState, useEffect } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Camera } from "lucide-react";

interface VinScannerProps {
  onScan: (vin: string) => void;
}

export function VinScanner({ onScan }: VinScannerProps) {
  const [open, setOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (open) {
      const codeReader = new BrowserMultiFormatReader();
      const videoElement = document.getElementById('video-preview') as HTMLVideoElement;

      if (videoElement) {
        codeReader
          .decodeFromConstraints(
            {
              video: { facingMode: "environment" }
            },
            videoElement,
            (result, error) => {
              if (result) {
                const scannedText = result.getText();
                // Most VINs are 17 characters long
                if (scannedText && scannedText.length === 17) {
                  onScan(scannedText);
                  setOpen(false);
                }
              }
              if (error) {
                console.error(error);
              }
            }
          )
          .catch(err => {
            console.error("Error accessing camera:", err);
          });

        return () => {
          codeReader.reset();
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
          }
        };
      }
    }
  }, [open, onScan, stream]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
            className="w-full h-64 object-cover"
          />
          <p className="text-sm text-muted-foreground mt-2">
            Point your camera at the vehicle's VIN barcode
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}