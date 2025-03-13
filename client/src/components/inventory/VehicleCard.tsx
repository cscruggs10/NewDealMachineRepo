import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Vehicle } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { OfferForm } from "../forms/OfferForm";
import { formatCurrency } from "@/lib/utils";
import { VideoIcon, Copy } from "lucide-react";

interface VehicleCardProps {
  vehicle: Vehicle;
}

export function VehicleCard({ vehicle }: VehicleCardProps) {
  const { toast } = useToast();

  const handleBuyNow = async () => {
    const code = prompt("Please enter your buy code:");
    if (!code) return;

    try {
      const res = await fetch("/api/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (!res.ok) {
        throw new Error("Invalid buy code");
      }

      toast({
        title: "Success!",
        description: "A sales representative will contact you shortly.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid buy code. Please try again.",
        variant: "destructive",
      });
    }
  };

  const copyVin = async () => {
    try {
      await navigator.clipboard.writeText(vehicle.vin);
      toast({
        title: "VIN Copied!",
        description: "Vehicle VIN has been copied to your clipboard",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy VIN to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg">
          {vehicle.year} {vehicle.make} {vehicle.model}
        </CardTitle>
        <div className="flex items-center gap-2 mt-2 bg-muted/50 p-2 rounded-md">
          <div className="flex-1">
            <p className="text-sm font-medium">VIN:</p>
            <p className="font-mono text-sm">{vehicle.vin}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={copyVin}
            title="Copy VIN"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        {vehicle.videos?.[0] && (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <VideoIcon className="mr-2 h-4 w-4" />
                Watch Video Walkthrough
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px]">
              <DialogHeader>
                <DialogTitle>Vehicle Video Walkthrough</DialogTitle>
              </DialogHeader>
              <div className="aspect-video">
                <video
                  src={vehicle.videos[0]}
                  controls
                  className="w-full h-full rounded-lg"
                  preload="metadata"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            </DialogContent>
          </Dialog>
        )}

        <div className="space-y-2">
          <p className="text-2xl font-bold text-primary">
            {formatCurrency(Number(vehicle.price))}
          </p>
          <p className="text-muted-foreground">
            Mileage: {vehicle.mileage ? vehicle.mileage.toLocaleString() : 'N/A'} miles
          </p>
          {vehicle.trim && (
            <p className="text-muted-foreground">Trim: {vehicle.trim}</p>
          )}
          <p className="text-sm line-clamp-2">{vehicle.description}</p>
          {vehicle.condition && (
            <p className="text-sm font-medium text-primary">
              {vehicle.condition}
            </p>
          )}
        </div>

        <div className="mt-auto space-y-2 pt-4">
          <Button 
            variant="default" 
            className="w-full"
            onClick={handleBuyNow}
          >
            Buy Now
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                Make Offer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Make an Offer</DialogTitle>
              </DialogHeader>
              <OfferForm vehicleId={vehicle.id} />
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}