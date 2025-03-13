import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Vehicle } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export function VehicleComplete() {
  const { toast } = useToast();
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  const { data: vehicles, isLoading } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const queuedVehicles = vehicles?.filter(v => v.inQueue) || [];

  const [formData, setFormData] = useState({
    mileage: '',
    price: '',
    condition: ''
  });

  const updateVehicle = useMutation({
    mutationFn: async (vehicleId: number) => {
      // Keep existing vehicle data and videos
      const vehicle = queuedVehicles.find(v => v.id === vehicleId);
      if (!vehicle) throw new Error("Vehicle not found");

      const payload = {
        ...vehicle, // Keep all VIN-decoded data
        mileage: Number(formData.mileage),
        price: formData.price,
        condition: formData.condition,
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
        mileage: '',
        price: '',
        condition: ''
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) return;
    updateVehicle.mutate(selectedVehicle.id);
  };

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
                      <div>
                        <p className="font-medium text-lg">
                          {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim}
                        </p>
                        <p className="text-sm text-muted-foreground">VIN: {vehicle.vin}</p>
                      </div>
                      {vehicle.videos && vehicle.videos[0] && (
                        <a 
                          href={vehicle.videos[0]} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          View Walkaround Video
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
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Display decoded vehicle info */}
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <h3 className="font-medium">Vehicle Information (From VIN)</h3>
              <p>
                {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
                {selectedVehicle.trim && ` ${selectedVehicle.trim}`}
              </p>
              <p className="text-sm text-muted-foreground">VIN: {selectedVehicle.vin}</p>
            </div>

            {/* Video preview if available */}
            {selectedVehicle.videos && selectedVehicle.videos[0] && (
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="text-sm font-medium mb-2">Vehicle Video</h3>
                <a 
                  href={selectedVehicle.videos[0]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  View walkaround video
                </a>
              </div>
            )}

            {/* Manual input fields */}
            <div className="space-y-4">
              {/* Mileage */}
              <div>
                <label className="block text-sm font-medium mb-1">Mileage</label>
                <Input
                  type="number"
                  value={formData.mileage}
                  onChange={(e) => setFormData(prev => ({ ...prev, mileage: e.target.value }))}
                  required
                  placeholder="Enter vehicle mileage"
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium mb-1">Price</label>
                <Input
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  required
                  placeholder="Enter listing price"
                />
              </div>

              {/* Certification Type */}
              <div>
                <label className="block text-sm font-medium mb-1">Certification Type</label>
                <Select 
                  value={formData.condition}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, condition: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select certification type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Deal Machine Certified">Deal Machine Certified</SelectItem>
                    <SelectItem value="Auction Certified">Auction Certified</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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