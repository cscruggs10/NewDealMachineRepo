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
import { VideoIcon, ExternalLink } from "lucide-react";

export function VehicleComplete() {
  const { toast } = useToast();
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState({
    year: '',
    make: '',
    model: '',
    mileage: '',
    price: '',
    condition: 'Deal Machine Certified'
  });

  const { data: vehicles, isLoading } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const queuedVehicles = vehicles?.filter(v => v.inQueue) || [];

  const updateVehicle = useMutation({
    mutationFn: async (vehicleId: number) => {
      const payload = {
        ...formData,
        year: parseInt(formData.year),
        mileage: parseInt(formData.mileage),
        videos: selectedVehicle?.videos || [], // Preserve videos array
        status: "active",
        inQueue: false,
      };

      console.log("Submitting vehicle update:", payload);
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
        mileage: '',
        price: '',
        condition: 'Deal Machine Certified'
      });
    },
    onError: (error: any) => {
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
          <CardTitle>Vehicle Queue Empty</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No vehicles waiting to be processed</p>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) return;
    updateVehicle.mutate(selectedVehicle.id);
  };

  const renderVideoLink = (url: string) => (
    <div className="flex items-center gap-2">
      <VideoIcon className="h-4 w-4" />
      <a 
        href={url}
        target="_blank" 
        rel="noopener noreferrer"
        className="text-primary hover:underline flex items-center gap-1"
      >
        View Walkthrough Video
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Complete Vehicle Listing</CardTitle>
      </CardHeader>
      <CardContent>
        {!selectedVehicle ? (
          <div className="space-y-4">
            {queuedVehicles.map((vehicle) => (
              <Card key={vehicle.id} className="hover:bg-accent/50">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="space-y-2">
                      <p className="font-medium">VIN: {vehicle.vin}</p>
                      {vehicle.videos?.[0] && renderVideoLink(vehicle.videos[0])}
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
          <form onSubmit={handleSubmit} className="space-y-4">
            {selectedVehicle.videos?.[0] && (
              <div className="mb-6 p-4 bg-muted rounded-lg">
                <label className="block text-sm font-medium mb-2">Walkthrough Video</label>
                {renderVideoLink(selectedVehicle.videos[0])}
              </div>
            )}

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
              <label className="block text-sm font-medium mb-1">Mileage</label>
              <Input
                type="number"
                value={formData.mileage}
                onChange={(e) => setFormData(prev => ({ ...prev, mileage: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Price</label>
              <Input
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Certification</label>
              <Select 
                value={formData.condition}
                onValueChange={(value) => setFormData(prev => ({ ...prev, condition: value }))}
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
                type="button" 
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