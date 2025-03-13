import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { decodeVIN, vinSchema } from "@/lib/vin";

interface VinScannerProps {
  onScan: (vin: string) => void;
}

export function VinScanner({ onScan }: VinScannerProps) {
  const [open, setOpen] = useState(false);
  const [manualVin, setManualVin] = useState("");
  const [isDecoding, setIsDecoding] = useState(false);
  const { toast } = useToast();

  const handleSubmitVin = async () => {
    if (manualVin.length !== 17) {
      toast({
        title: "Error",
        description: "VIN must be exactly 17 characters",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsDecoding(true);
      const result = await vinSchema.parseAsync(manualVin);
      const vehicleInfo = await decodeVIN(result);

      if (vehicleInfo) {
        onScan(manualVin);
        setOpen(false);
        toast({
          title: "Success",
          description: `Found ${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to decode VIN. Please verify and try again.",
        variant: "destructive",
      });
    } finally {
      setIsDecoding(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(newOpen) => {
        setOpen(newOpen);
        if (!newOpen) {
          setManualVin("");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" type="button">
          <Camera className="mr-2 h-4 w-4" />
          Enter VIN
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enter Vehicle VIN</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          <div>
            <Input
              value={manualVin}
              onChange={(e) => setManualVin(e.target.value.toUpperCase())}
              placeholder="Enter 17-character VIN"
              maxLength={17}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground mt-1">
              1. Open your phone's camera app
              <br />
              2. Take a clear photo of the VIN plate
              <br />
              3. Enter the 17-character VIN here
            </p>
          </div>
          <Button 
            onClick={handleSubmitVin} 
            className="w-full"
            disabled={isDecoding || manualVin.length !== 17}
          >
            {isDecoding ? "Decoding..." : "Verify VIN"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}