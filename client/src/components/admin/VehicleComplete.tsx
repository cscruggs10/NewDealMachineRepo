import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Vehicle } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function VehicleComplete() {
  const { toast } = useToast();
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [condition, setCondition] = useState('Deal Machine Certified');

  const { data: vehicles, isLoading } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const queuedVehicles = vehicles?.filter(v => v.inQueue) || [];

  const updateVehicle = useMutation({
    mutationFn: async (vehicleId: number) => {
      const payload = {
        condition,
        status: "active",
        inQueue: false,
        videos: selectedVehicle?.videos || [], // Preserve videos
        vin: selectedVehicle?.vin // Preserve VIN
      };

      return apiRequest("PATCH", `/api/vehicles/${vehicleId}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      toast({
        title: "Success",
        description: "Vehicle listing completed",
      });
      setSelectedVehicle(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to complete vehicle listing",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <div>Loading queue...</div>;
  }

  if (!queuedVehicles.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Vehicles in Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">All vehicles have been processed</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Complete Vehicle Listing</CardTitle>
      </CardHeader>
      <CardContent>
        {!selectedVehicle ? (
          <div className="space-y-4">
            {queuedVehicles.map((vehicle) => (
              <Card key={vehicle.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="space-y-2">
                      <p className="font-medium">VIN: {vehicle.vin}</p>
                      {vehicle.videos?.[0] && (
                        <a 
                          href={vehicle.videos[0]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          View Video
                        </a>
                      )}
                    </div>
                    <Button onClick={() => setSelectedVehicle(vehicle)}>
                      Complete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {selectedVehicle.videos?.[0] && (
              <div>
                <h3 className="text-sm font-medium mb-2">Walkthrough Video</h3>
                <a 
                  href={selectedVehicle.videos[0]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  View Video
                </a>
              </div>
            )}

            <div>
              <h3 className="text-sm font-medium mb-2">Certification</h3>
              <Select 
                value={condition}
                onValueChange={setCondition}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Deal Machine Certified">Deal Machine Certified</SelectItem>
                  <SelectItem value="Auction Certified">Auction Certified</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                onClick={() => updateVehicle.mutate(selectedVehicle.id)}
                className="flex-1"
              >
                Complete Listing
              </Button>
              <Button 
                variant="outline"
                onClick={() => setSelectedVehicle(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}