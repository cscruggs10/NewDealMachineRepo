import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Vehicle } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function ListingManagement() {
  const { toast } = useToast();
  const [reactivationNotes, setReactivationNotes] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [showReactivateDialog, setShowReactivateDialog] = useState(false);

  const { data: vehicles, isLoading } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  // Get vehicles by different statuses
  const activeVehicles = vehicles?.filter(v => v.status === 'active' && !v.inQueue) || [];
  const soldVehicles = vehicles?.filter(v => v.status === 'sold') || [];
  const pendingVehicles = vehicles?.filter(v => v.inQueue) || [];
  const failedInspectionVehicles = vehicles?.filter(v => v.inspectionStatus === 'failed') || [];

  const removeListing = useMutation({
    mutationFn: async (vehicleId: number) => {
      return apiRequest("PATCH", `/api/vehicles/${vehicleId}`, {
        status: 'removed',
        inQueue: false
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      toast({
        title: "Success",
        description: "Listing removed successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove listing",
        variant: "destructive",
      });
    },
  });

  const reactivateVehicle = useMutation({
    mutationFn: async ({ vehicleId, notes }: { vehicleId: number; notes: string }) => {
      return apiRequest("PATCH", `/api/vehicles/${vehicleId}`, {
        status: 'active',
        inQueue: false,
        reactivationNotes: notes
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      toast({
        title: "Success",
        description: "Vehicle reactivated successfully",
      });
      setReactivationNotes("");
      setShowReactivateDialog(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reactivate vehicle",
        variant: "destructive",
      });
    },
  });

  const approveVehicle = useMutation({
    mutationFn: async (vehicleId: number) => {
      return apiRequest("PATCH", `/api/vehicles/${vehicleId}`, {
        status: 'active',
        inQueue: false
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      toast({
        title: "Success",
        description: "Vehicle approved and now active",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve vehicle",
        variant: "destructive",
      });
    },
  });

  const handleReactivateClick = (vehicleId: number) => {
    setSelectedVehicleId(vehicleId);
    setShowReactivateDialog(true);
  };

  const handleReactivateConfirm = () => {
    if (!selectedVehicleId || !reactivationNotes.trim()) return;
    
    reactivateVehicle.mutate({ 
      vehicleId: selectedVehicleId, 
      notes: reactivationNotes 
    });
  };

  if (isLoading) {
    return <div>Loading listings...</div>;
  }

  const renderVehicleCard = (vehicle: Vehicle, actionButton: React.ReactNode) => (
    <Card key={vehicle.id} className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium">
                {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim}
              </p>
              {vehicle.inspectionStatus === "failed" && (
                <Badge variant="destructive">Failed Inspection</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">VIN: {vehicle.vin}</p>
            <p className="text-sm text-muted-foreground">
              Price: ${Number(vehicle.price).toLocaleString()}
            </p>
            {vehicle.inspectionFailReason && (
              <p className="text-sm text-destructive mt-1">
                Fail reason: {vehicle.inspectionFailReason}
              </p>
            )}
          </div>
          {actionButton}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Tabs defaultValue="active">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="active">Active ({activeVehicles.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingVehicles.length})</TabsTrigger>
          <TabsTrigger value="sold">Sold ({soldVehicles.length})</TabsTrigger>
          <TabsTrigger value="failed">Failed ({failedInspectionVehicles.length})</TabsTrigger>
        </TabsList>

        {/* Active Listings Tab */}
        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle>Active Listings</CardTitle>
              <CardDescription>
                Vehicles currently available for purchase
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeVehicles.map((vehicle) => 
                  renderVehicleCard(vehicle, 
                    <Button
                      variant="destructive"
                      onClick={() => removeListing.mutate(vehicle.id)}
                      disabled={removeListing.isPending}
                    >
                      Remove Listing
                    </Button>
                  )
                )}
                {activeVehicles.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    No active listings found
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pending Review Tab */}
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Review</CardTitle>
              <CardDescription>
                Vehicles awaiting admin approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingVehicles.map((vehicle) => 
                  renderVehicleCard(vehicle, 
                    <Button
                      variant="default"
                      onClick={() => approveVehicle.mutate(vehicle.id)}
                      disabled={approveVehicle.isPending}
                    >
                      Approve Listing
                    </Button>
                  )
                )}
                {pendingVehicles.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    No pending vehicles found
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sold Vehicles Tab */}
        <TabsContent value="sold">
          <Card>
            <CardHeader>
              <CardTitle>Sold Vehicles</CardTitle>
              <CardDescription>
                Vehicles that have been purchased
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {soldVehicles.map((vehicle) => 
                  renderVehicleCard(vehicle, 
                    <Button
                      variant="outline"
                      onClick={() => handleReactivateClick(vehicle.id)}
                      disabled={reactivateVehicle.isPending}
                    >
                      Reactivate Listing
                    </Button>
                  )
                )}
                {soldVehicles.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    No sold vehicles found
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Failed Inspection Tab */}
        <TabsContent value="failed">
          <Card>
            <CardHeader>
              <CardTitle>Failed Inspection</CardTitle>
              <CardDescription>
                Vehicles that failed the inspection process
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {failedInspectionVehicles.map((vehicle) => 
                  renderVehicleCard(vehicle, 
                    <Button
                      variant="destructive"
                      onClick={() => removeListing.mutate(vehicle.id)}
                      disabled={removeListing.isPending}
                    >
                      Remove Listing
                    </Button>
                  )
                )}
                {failedInspectionVehicles.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    No failed inspection vehicles found
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reactivate Vehicle Dialog */}
      <Dialog open={showReactivateDialog} onOpenChange={setShowReactivateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reactivate Vehicle</DialogTitle>
            <DialogDescription>
              You are reactivating a sold vehicle. Please provide a reason for this action.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="notes">Reactivation Notes</Label>
              <Textarea
                id="notes"
                placeholder="e.g., Mistakenly marked as sold, buyer backed out, etc."
                value={reactivationNotes}
                onChange={(e) => setReactivationNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowReactivateDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReactivateConfirm}
              disabled={!reactivationNotes.trim() || reactivateVehicle.isPending}
            >
              {reactivateVehicle.isPending ? "Processing..." : "Reactivate Vehicle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
