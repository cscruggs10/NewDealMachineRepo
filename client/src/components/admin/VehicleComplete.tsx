import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Vehicle } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function VehicleComplete() {
  const { toast } = useToast();
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  const { data: vehicles, isLoading } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const queuedVehicles = vehicles?.filter(v => v.inQueue) || [];

  const [formData, setFormData] = useState({
    year: '',
    make: '',
    model: '',
    trim: '',
    mileage: '',
    condition: 'Deal Machine Certified'
  });

  // Log vehicles data to check video URLs
  console.log("Queued vehicles:", queuedVehicles);

  const updateVehicle = useMutation({
    mutationFn: async (vehicleId: number) => {
      // Keep existing video and VIN data
      const vehicle = queuedVehicles.find(v => v.id === vehicleId);
      if (!vehicle) throw new Error("Vehicle not found");

      const payload = {
        ...formData,
        year: Number(formData.year),
        mileage: Number(formData.mileage),
        videos: vehicle.videos, // Preserve existing videos
        vin: vehicle.vin, // Preserve VIN
        status: "active",
        inQueue: false,
      };

      console.log("Updating vehicle with payload:", payload);
      return apiRequest("PATCH", `/api/vehicles/${vehicleId}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      toast({
        title: "Success",
        description: "Vehicle listing completed",
      });
      setSelectedVehicle(null);
      setFormData({
        year: '',
        make: '',
        model: '',
        trim: '',
        mileage: '',
        condition: 'Deal Machine Certified'
      });
    },
    onError: (error) => {
      console.error("Update error:", error);
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
                      {vehicle.videos && vehicle.videos[0] && (
                        <div className="text-sm">
                          <a 
                            href={vehicle.videos[0]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            Click to view walkthrough video
                          </a>
                        </div>
                      )}
                    </div>
                    <Button onClick={() => {
                      console.log("Selected vehicle:", vehicle);
                      setSelectedVehicle(vehicle);
                    }}>
                      Complete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              updateVehicle.mutate(selectedVehicle.id);
            }} 
            className="space-y-4"
          >
            {/* Video Link Section */}
            {selectedVehicle.videos && selectedVehicle.videos[0] && (
              <div className="mb-6 p-4 bg-muted rounded-lg">
                <h3 className="text-sm font-medium mb-2">Vehicle Video</h3>
                <a 
                  href={selectedVehicle.videos[0]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  View walkthrough video
                </a>
              </div>
            )}

            {/* Vehicle Details Form */}
            <div>
              <label className="block text-sm font-medium mb-1">Year</label>
              <Input
                type="number"
                value={formData.year}
                onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Make</label>
              <Input
                value={formData.make}
                onChange={(e) => setFormData(prev => ({ ...prev, make: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Model</label>
              <Input
                value={formData.model}
                onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Trim</label>
              <Input
                value={formData.trim}
                onChange={(e) => setFormData(prev => ({ ...prev, trim: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Mileage</label>
              <Input
                type="number"
                value={formData.mileage}
                onChange={(e) => setFormData(prev => ({ ...prev, mileage: e.target.value }))}
                required
              />
            </div>

            {/* Certification Selection */}
            <div>
              <label className="block text-sm font-medium mb-1">Certification Type</label>
              <Select 
                value={formData.condition}
                onValueChange={(value) => {
                  console.log("Selected certification:", value);
                  setFormData(prev => ({ ...prev, condition: value }));
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select certification type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Deal Machine Certified">Deal Machine Certified</SelectItem>
                  <SelectItem value="Auction Certified">Auction Certified</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                Complete Listing
              </Button>
              <Button 
                variant="outline"
                onClick={() => setSelectedVehicle(null)}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}