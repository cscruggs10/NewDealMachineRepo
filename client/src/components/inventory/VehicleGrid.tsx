import { useQuery } from "@tanstack/react-query";
import { VehicleCard } from "./VehicleCard";
import { Vehicle } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export function VehicleGrid() {
  const { data: vehicles, isLoading } = useQuery<Vehicle[]>({ 
    queryKey: ["/api/vehicles"] 
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-[400px]" />
        ))}
      </div>
    );
  }

  if (!vehicles?.length) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold">No vehicles available</h2>
        <p className="text-muted-foreground">Check back soon for new inventory</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {vehicles.map((vehicle) => (
        <VehicleCard key={vehicle.id} vehicle={vehicle} />
      ))}
    </div>
  );
}
