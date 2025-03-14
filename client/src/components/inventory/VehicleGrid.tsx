import { useQuery } from "@tanstack/react-query";
import { VehicleCard } from "./VehicleCard";
import { Vehicle } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { VideoIcon, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface VehicleGridProps {
  searchQuery: string;
  viewMode: "grid" | "list";
}

export function VehicleGrid({ searchQuery, viewMode }: VehicleGridProps) {
  const { data: vehicles, isLoading } = useQuery<Vehicle[]>({ 
    queryKey: ["/api/vehicles"] 
  });

  // Only show active vehicles that are not in queue
  const activeVehicles = vehicles?.filter(v => !v.inQueue && v.status === 'active') || [];

  // Filter vehicles based on search query
  const filteredVehicles = activeVehicles.filter(vehicle => {
    if (!searchQuery) return true;

    const searchLower = searchQuery.toLowerCase();
    return (
      vehicle.make?.toLowerCase().includes(searchLower) ||
      vehicle.model?.toLowerCase().includes(searchLower) ||
      vehicle.year?.toString().includes(searchLower) ||
      vehicle.vin?.toLowerCase().includes(searchLower)
    );
  });

  if (isLoading) {
    return (
      <div className={`grid gap-6 p-6 ${
        viewMode === "grid" 
          ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" 
          : "grid-cols-1"
      }`}>
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className={viewMode === "grid" ? "h-[500px]" : "h-[200px]"} />
        ))}
      </div>
    );
  }

  if (!filteredVehicles.length) {
    return (
      <div className="text-center py-12">
        {searchQuery ? (
          <>
            <h2 className="text-2xl font-semibold">No vehicles found</h2>
            <p className="text-muted-foreground">Try adjusting your search criteria</p>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-semibold">No vehicles available</h2>
            <p className="text-muted-foreground">Check back soon for new inventory</p>
          </>
        )}
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <div className="space-y-4 p-6">
        {filteredVehicles.map((vehicle) => (
          <Card key={vehicle.id} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start gap-6">
                {vehicle.videos?.[0] && (
                  <div className="relative aspect-video w-64 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <video 
                      src={vehicle.videos[0]}
                      className="w-full h-full object-cover"
                      preload="metadata"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <VideoIcon className="h-8 w-8 text-white" />
                    </div>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-lg font-semibold truncate">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </h3>
                    <Link href={`/vehicle/${vehicle.id}`}>
                      <Button variant="ghost" size="icon">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                  <p className="text-2xl font-bold text-primary mt-2">
                    {formatCurrency(Number(vehicle.price))}
                  </p>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-muted-foreground">
                      VIN: {vehicle.vin}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Mileage: {vehicle.mileage ? vehicle.mileage.toLocaleString() : 'N/A'} miles
                    </p>
                    {vehicle.trim && (
                      <p className="text-sm text-muted-foreground">
                        Trim: {vehicle.trim}
                      </p>
                    )}
                  </div>
                  {vehicle.description && (
                    <p className="mt-2 text-sm line-clamp-2">
                      {vehicle.description}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {filteredVehicles.map((vehicle) => (
        <VehicleCard key={vehicle.id} vehicle={vehicle} />
      ))}
    </div>
  );
}