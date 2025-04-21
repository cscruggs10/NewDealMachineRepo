import { useQuery, useMutation } from "@tanstack/react-query";
import { Vehicle } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

export function ListingManagement() {
  const { toast } = useToast();

  const { data: vehicles, isLoading } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  // Get active and sold vehicles
  const activeVehicles = vehicles?.filter(v => v.status === 'active' && !v.inQueue) || [];
  const soldVehicles = vehicles?.filter(v => v.status === 'sold') || [];

  const removeListing = useMutation({
    mutationFn: async (vehicleId: number) => {
      return apiRequest("PATCH", `/api/vehicles/${vehicleId}`, {
        status: 'removed',
        inQueue: false
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      toast({
        title: "Success",
        description: "Listing removed successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove listing",
        variant: "destructive",
      });
    },
  });

  const reactivateVehicle = useMutation({
    mutationFn: async (vehicleId: number) => {
      return apiRequest("PATCH", `/api/vehicles/${vehicleId}`, {
        status: 'active',
        inQueue: false
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      toast({
        title: "Success",
        description: "Vehicle reactivated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reactivate vehicle",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <div>Loading listings...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Active Listings Section */}
      <Card>
        <CardHeader>
          <CardTitle>Active Listings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeVehicles.map((vehicle) => (
              <Card key={vehicle.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">
                        {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim}
                      </p>
                      <p className="text-sm text-muted-foreground">VIN: {vehicle.vin}</p>
                      <p className="text-sm text-muted-foreground">
                        Price: ${Number(vehicle.price).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      onClick={() => removeListing.mutate(vehicle.id)}
                      disabled={removeListing.isPending}
                    >
                      Remove Listing
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {activeVehicles.length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                No active listings found
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sold Vehicles Section */}
      <Card>
        <CardHeader>
          <CardTitle>Sold Vehicles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {soldVehicles.map((vehicle) => (
              <Card key={vehicle.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">
                        {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim}
                      </p>
                      <p className="text-sm text-muted-foreground">VIN: {vehicle.vin}</p>
                      <p className="text-sm text-muted-foreground">
                        Price: ${Number(vehicle.price).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      onClick={() => reactivateVehicle.mutate(vehicle.id)}
                      disabled={reactivateVehicle.isPending}
                    >
                      Reactivate Listing
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {soldVehicles.length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                No sold vehicles found
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
