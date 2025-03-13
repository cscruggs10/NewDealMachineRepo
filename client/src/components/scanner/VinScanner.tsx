import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { decodeVIN, vinSchema } from "@/lib/vin";

interface VinScannerProps {
  onScan: (vin: string) => void;
}

export function VinScanner({ onScan }: VinScannerProps) {
  const { toast } = useToast();

  const handleVinInfoApp = () => {
    try {
      // Direct link to VIN Info app scanner
      const vinInfoAppUrl = "vininfo://scan";

      // Try to open the app first
      window.location.href = vinInfoAppUrl;

      // After a short delay, if the app didn't open, redirect to the web version
      setTimeout(() => {
        window.location.href = "https://vininfo.app/scan";
      }, 100);

      toast({
        title: "Opening VIN Scanner",
        description: "Opening VIN Info app for scanning...",
      });
    } catch (error) {
      console.error("Error opening VIN Info app:", error);
      toast({
        title: "Error",
        description: "Unable to open VIN Scanner. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button variant="outline" type="button" onClick={handleVinInfoApp}>
      <Camera className="mr-2 h-4 w-4" />
      Scan VIN
    </Button>
  );
}