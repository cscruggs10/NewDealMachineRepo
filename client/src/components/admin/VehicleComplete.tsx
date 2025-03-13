import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Vehicle, insertVehicleSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function VehicleComplete() {
  const { toast } = useToast();
  const [searchVin, setSearchVin] = useState("");
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);

  const form = useForm({
    resolver: zodResolver(insertVehicleSchema),
    defaultValues: {
      year: "",
      make: "",
      model: "",
      trim: "",
      mileage: "",
      price: "",
      condition: "",
    },
  });

  const searchVehicle = async () => {
    if (searchVin.length !== 8) {
      toast({
        title: "Error",
        description: "Please enter the last 8 digits of the VIN",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await apiRequest("GET", `/api/vehicles/vin/${searchVin}`, undefined);
      const data = await response.json();
      setVehicle(data);
      if (!data) {
        toast({
          title: "Not Found",
          description: "No vehicle found with this VIN",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to find vehicle",
        variant: "destructive",
      });
    }
  };

  const completeVehicle = useMutation({
    mutationFn: async (data: any) => {
      if (!vehicle) return;
      return apiRequest("PATCH", `/api/vehicles/${vehicle.id}`, {
        ...data,
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
      setVehicle(null);
      setSearchVin("");
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to complete vehicle listing",
        variant: "destructive",
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Complete Vehicle Listing</CardTitle>
      </CardHeader>
      <CardContent>
        {!vehicle ? (
          <div className="flex gap-4">
            <Input
              placeholder="Enter last 8 digits of VIN"
              maxLength={8}
              value={searchVin}
              onChange={(e) => setSearchVin(e.target.value)}
            />
            <Button onClick={searchVehicle}>Search</Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => completeVehicle.mutate(data))} className="space-y-4">
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
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
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mileage</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
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
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full"
                disabled={completeVehicle.isPending}
              >
                Complete Listing
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}
