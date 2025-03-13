import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Vehicle } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { OfferForm } from "../forms/OfferForm";
import { formatCurrency } from "@/lib/utils";

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

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg">
          {vehicle.year} {vehicle.make} {vehicle.model}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        {vehicle.images?.[0] && (
          <img
            src={vehicle.images[0]}
            alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
            className="w-full h-48 object-cover rounded-md"
          />
        )}
        
        <div className="space-y-2">
          <p className="text-2xl font-bold text-primary">
            {formatCurrency(Number(vehicle.price))}
          </p>
          <p className="text-muted-foreground">
            Mileage: {vehicle.mileage.toLocaleString()} miles
          </p>
          <p className="text-sm line-clamp-2">{vehicle.description}</p>
        </div>

        <div className="mt-auto space-x-2 pt-4">
          <Button 
            variant="default" 
            className="w-full mb-2"
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
