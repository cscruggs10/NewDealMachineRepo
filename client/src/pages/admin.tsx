import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PricingQueue } from "@/components/admin/PricingQueue";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Vehicle, Offer } from "@shared/schema";

export default function Admin() {
  const { data: vehicles } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const { data: offers } = useQuery<Offer[]>({
    queryKey: ["/api/offers"],
  });

  const stats = {
    totalVehicles: vehicles?.length || 0,
    activeListings: vehicles?.filter(v => v.status === 'active').length || 0,
    pendingOffers: offers?.filter(o => o.status === 'pending').length || 0,
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>

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

        <Tabs defaultValue="pricing">
          <TabsList>
            <TabsTrigger value="pricing">Pricing Queue</TabsTrigger>
            <TabsTrigger value="offers">Offers</TabsTrigger>
            <TabsTrigger value="codes">Buy Codes</TabsTrigger>
          </TabsList>

          <TabsContent value="pricing" className="mt-6">
            <PricingQueue />
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
                {/* Implement buy code management UI */}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
