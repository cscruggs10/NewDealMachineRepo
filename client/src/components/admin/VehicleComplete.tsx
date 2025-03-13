import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Vehicle, insertVehicleSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export function VehicleComplete() {
  const { toast } = useToast();
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  // Get all vehicles in queue
  const { data: vehicles, isLoading } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const queuedVehicles = vehicles?.filter(v => v.inQueue) || [];

  const form = useForm({
    resolver: zodResolver(insertVehicleSchema),
    defaultValues: {
      year: undefined,
      make: "",
      model: "",
      trim: "",
      mileage: undefined,
      price: "",
      condition: "",
    },
  });

  console.log("Form errors:", form.formState.errors);

  const completeVehicle = useMutation({
    mutationFn: async (data: any) => {
      if (!selectedVehicle) {
        throw new Error("No vehicle selected");
      }

      console.log("Form data before formatting:", data);

      // Convert string values to numbers
      const formattedData = {
        ...data,
        year: data.year ? parseInt(data.year) : undefined,
        mileage: data.mileage ? parseInt(data.mileage) : undefined,
      };

      console.log("Formatted data:", formattedData);

      return apiRequest("PATCH", `/api/vehicles/${selectedVehicle.id}`, {
        ...formattedData,
        status: "active",
        inQueue: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      toast({
        title: "Success",
        description: "Vehicle listing completed",
      });
      setSelectedVehicle(null);
      form.reset();
    },
    onError: (error: any) => {
      console.error("Error completing vehicle:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to complete vehicle listing",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: any) => {
    console.log("Form submitted with data:", data);
    completeVehicle.mutate(data);
  };

  if (isLoading) {
    return <div>Loading queue...</div>;
  }

  if (queuedVehicles.length === 0) {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Complete Vehicle Listing</CardTitle>
      </CardHeader>
      <CardContent>
        {!selectedVehicle ? (
          <div className="space-y-4">
            <h3 className="font-medium mb-2">Vehicles in Queue</h3>
            {queuedVehicles.map((vehicle) => (
              <Card key={vehicle.id} className="hover:bg-accent/50">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">VIN: {vehicle.vin}</p>
                      {vehicle.videos?.length > 0 && (
                        <p className="text-sm text-muted-foreground">Video uploaded</p>
                      )}
                    </div>
                    <Button variant="outline" onClick={() => setSelectedVehicle(vehicle)}>
                      Complete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="year"
                render={({ field: { onChange, ...field } }) => (
                  <FormItem>
                    <FormLabel>Year</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : '')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="make"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Make</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="trim"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trim</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mileage"
                render={({ field: { onChange, ...field } }) => (
                  <FormItem>
                    <FormLabel>Mileage</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : '')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="condition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Certification</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select certification type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Deal Machine Certified">Deal Machine Certified</SelectItem>
                        <SelectItem value="Auction Certified">Auction Certified</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={completeVehicle.isPending}
                >
                  {completeVehicle.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Completing...
                    </>
                  ) : (
                    'Complete Listing'
                  )}
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
          </Form>
        )}
      </CardContent>
    </Card>
  );
}