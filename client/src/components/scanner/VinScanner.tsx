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
    // Open VIN Info app
    const vinInfoAppUrl = "https://vininfo.app/scan";

    // Store callback info in localStorage
    localStorage.setItem('vinScanCallback', window.location.href);

    // Open in new window/tab
    window.open(vinInfoAppUrl, '_blank');

    toast({
      title: "VIN Scanner",
      description: "Opening VIN Info app for scanning. Please copy the VIN after scanning.",
    });
  };

  return (
    <Button variant="outline" type="button" onClick={handleVinInfoApp}>
      <Camera className="mr-2 h-4 w-4" />
      Scan VIN
    </Button>
  );
}