import { useEffect } from "react";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PricingQueue } from "@/components/admin/PricingQueue";
import { VehicleComplete } from "@/components/admin/VehicleComplete";
import { DealerManagement } from "@/components/admin/DealerManagement";
import { TransactionManagement } from "@/components/admin/TransactionManagement";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Vehicle, Offer } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { RefreshCw } from "lucide-react";
import { ListingManagement } from "@/components/admin/ListingManagement";

export default function Admin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Check admin authentication
  const { data: adminAuth, isLoading: authLoading } = useQuery({
    queryKey: ["/api/admin/check"],
    queryFn: async () => {
      const res = await fetch("/api/admin/check");
      if (!res.ok) return null;
      return res.json();
    }
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !adminAuth?.authorized) {
      setLocation("/admin/login");
    }
  }, [authLoading, adminAuth, setLocation]);

  const { data: vehicles } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const { data: offers } = useQuery<Offer[]>({
    queryKey: ["/api/offers"],
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/sync-vehicles", {});
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      toast({
        title: "Success",
        description: "Vehicles synced successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to sync vehicles from Google Sheet",
        variant: "destructive",
      });
    },
  });

  if (authLoading) {
    return <div>Loading...</div>;
  }

  if (!adminAuth?.authorized) {
    return null; // Will redirect via useEffect
  }

  const stats = {
    totalVehicles: vehicles?.length || 0,
    activeListings: vehicles?.filter(v => v.status === 'active').length || 0,
    pendingOffers: offers?.filter(o => o.status === 'pending').length || 0,
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <Button 
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
          >
            {syncMutation.isPending ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Sync from Google Sheet
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Total Vehicles</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.totalVehicles}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Listings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.activeListings}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pending Offers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.pendingOffers}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="complete">
          <TabsList>
            <TabsTrigger value="complete">Complete Vehicle</TabsTrigger>
            <TabsTrigger value="listings">Manage Listings</TabsTrigger>
            <TabsTrigger value="dealers">Dealers</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="offers">Offers</TabsTrigger>
            <TabsTrigger value="codes">Buy Codes</TabsTrigger>
          </TabsList>

          <TabsContent value="complete" className="mt-6">
            <VehicleComplete />
          </TabsContent>

          <TabsContent value="listings" className="mt-6">
            <ListingManagement />
          </TabsContent>

          <TabsContent value="dealers" className="mt-6">
            <DealerManagement />
          </TabsContent>

          <TabsContent value="transactions" className="mt-6">
            <TransactionManagement />
          </TabsContent>

          <TabsContent value="offers">
            <Card>
              <CardHeader>
                <CardTitle>Offer Management</CardTitle>
                <CardDescription>
                  Review and manage incoming offers
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Implement offer management UI */}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="codes">
            <Card>
              <CardHeader>
                <CardTitle>Buy Code Management</CardTitle>
                <CardDescription>
                  Create and manage dealer buy codes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Buy code management will be handled in DealerManagement */}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}