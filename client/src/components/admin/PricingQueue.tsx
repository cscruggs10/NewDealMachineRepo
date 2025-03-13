import { useQuery, useMutation } from "@tanstack/react-query";
import { Vehicle } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { queryClient } from "@/lib/queryClient";

export function PricingQueue() {
  const { toast } = useToast();
  const [prices, setPrices] = useState<Record<number, string>>({});

  const { data: vehicles, isLoading } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const queuedVehicles = vehicles?.filter((v) => v.inQueue) || [];

  const updateVehicle = useMutation({
    mutationFn: async ({ id, price }: { id: number; price: number }) => {
      return apiRequest("PATCH", `/api/vehicles/${id}`, {
        price,
        inQueue: false,
        status: "active",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      toast({
        title: "Success",
        description: "Vehicle price updated and published",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update vehicle price",
        variant: "destructive",
      });
    },
  });

  const handleUpdatePrice = (id: number) => {
    const price = parseFloat(prices[id]);
    if (isNaN(price)) {
      toast({
        title: "Error",
        description: "Please enter a valid price",
        variant: "destructive",
      });
      return;
    }
    updateVehicle.mutate({ id, price });
  };

  if (isLoading) {
    return <div>Loading queue...</div>;
  }

  if (!queuedVehicles.length) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold">No vehicles in queue</h2>
        <p className="text-muted-foreground">All vehicles have been priced</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {queuedVehicles.map((vehicle) => (
        <Card key={vehicle.id}>
          <CardHeader>
            <CardTitle>
              {vehicle.year} {vehicle.make} {vehicle.model}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <Input
              type="number"
              placeholder="Enter price"
              value={prices[vehicle.id] || ""}
              onChange={(e) =>
                setPrices((p) => ({ ...p, [vehicle.id]: e.target.value }))
              }
              className="max-w-[200px]"
            />
            <Button
              onClick={() => handleUpdatePrice(vehicle.id)}
              disabled={updateVehicle.isPending}
            >
              Set Price & Publish
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
