import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Vehicle } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { OfferForm } from "@/components/forms/OfferForm";
import { formatCurrency } from "@/lib/utils";
import { VideoIcon, Copy, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { UserEngagement } from "@/components/engagement/UserEngagement";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

export default function VehicleDetails() {
  const { id } = useParams();
  const { toast } = useToast();
  const [isBuyDialogOpen, setIsBuyDialogOpen] = useState(false);

  const { data: vehicle, isLoading } = useQuery<Vehicle>({
    queryKey: [`/api/vehicles/${id}`],
    enabled: !!id,
  });

  const verifyBuyCodeMutation = useMutation({
    mutationFn: async (code: string) => {
      return apiRequest("POST", "/api/verify-code", {
        code,
        vehicleId: Number(id),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Vehicle purchase initiated. Our team will contact you shortly.",
      });
      setIsBuyDialogOpen(false);
      // Invalidate both the individual vehicle query and the vehicles list query
      queryClient.invalidateQueries({ queryKey: [`/api/vehicles/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Invalid buy code. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleBuyNow = async () => {
    setIsBuyDialogOpen(true);
  };

  const handleBuyCodeSubmit = async (code: string) => {
    verifyBuyCodeMutation.mutate(code);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied!",
        description: "Vehicle listing URL has been copied to your clipboard",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy link to clipboard",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-[400px] bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold">Vehicle Not Found</h1>
          <p className="mt-2 text-muted-foreground">This vehicle listing may have been removed or sold.</p>
          <Link href="/">
            <Button className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Listings
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Only show available vehicles
  if (vehicle.status === 'sold' || vehicle.status === 'removed') {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold">Vehicle No Longer Available</h1>
          <p className="mt-2 text-muted-foreground">
            This vehicle has been {vehicle.status === 'sold' ? 'sold' : 'removed from listings'}.
          </p>
          <Link href="/">
            <Button className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              View Other Listings
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const vehicleTitle = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Listings
            </Button>
          </Link>
          {vehicle && <UserEngagement vehicle={vehicle} />}
        </div>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-2xl">{vehicleTitle}</CardTitle>
            <div className="flex items-center gap-2 mt-2 bg-muted/50 p-2 rounded-md">
              <div className="flex-1">
                <p className="text-sm font-medium">VIN:</p>
                <p className="font-mono text-sm">{vehicle.vin}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  navigator.clipboard.writeText(vehicle.vin);
                  toast({
                    title: "VIN Copied!",
                    description: "Vehicle VIN has been copied to your clipboard",
                  });
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {vehicle.videos?.[0] && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <VideoIcon className="mr-2 h-4 w-4" />
                    Watch Video Walkthrough
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[800px]">
                  <DialogHeader>
                    <DialogTitle>Vehicle Video Walkthrough</DialogTitle>
                  </DialogHeader>
                  <div className="aspect-video">
                    <video
                      src={vehicle.videos[0]}
                      controls
                      className="w-full h-full rounded-lg"
                      preload="metadata"
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              {/* Vehicle Details */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Price & Basic Info</h3>
                  <div className="space-y-2">
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(Number(vehicle.price))}
                    </p>
                    <p className="text-muted-foreground">
                      Mileage: {vehicle.mileage ? vehicle.mileage.toLocaleString() : 'N/A'} miles
                    </p>
                    <p className="text-muted-foreground">
                      Year: {vehicle.year}
                    </p>
                    <p className="text-muted-foreground">
                      Make: {vehicle.make}
                    </p>
                    <p className="text-muted-foreground">
                      Model: {vehicle.model}
                    </p>
                    {vehicle.trim && (
                      <p className="text-muted-foreground">
                        Trim: {vehicle.trim}
                      </p>
                    )}
                  </div>
                </div>

                {vehicle.condition && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Certification</h3>
                    <p className="text-sm font-medium inline-block px-3 py-1 rounded-full bg-primary/10 text-primary">
                      {vehicle.condition}
                    </p>
                  </div>
                )}
              </div>

              {/* Description and Additional Info */}
              <div className="space-y-4">
                {vehicle.description && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Description</h3>
                    <p className="text-sm text-muted-foreground">{vehicle.description}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 pt-6">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    Make Offer
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Make an Offer</DialogTitle>
                  </DialogHeader>
                  <OfferForm vehicleId={vehicle?.id || 0} />
                </DialogContent>
              </Dialog>

              <Dialog open={isBuyDialogOpen} onOpenChange={setIsBuyDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="default" 
                    className="w-full" 
                    onClick={handleBuyNow}
                    disabled={verifyBuyCodeMutation.isPending}
                  >
                    {verifyBuyCodeMutation.isPending ? "Processing..." : "Buy Now"}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Purchase Vehicle</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="buyCode" className="block text-sm font-medium mb-2">
                        Enter your buy code:
                      </label>
                      <div className="flex gap-2">
                        <input
                          id="buyCode"
                          type="text"
                          placeholder="Enter buy code"
                          className="flex-1 px-3 py-2 border border-input rounded-md text-sm"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const code = (e.target as HTMLInputElement).value;
                              if (code.trim()) {
                                handleBuyCodeSubmit(code.trim());
                              }
                            }
                          }}
                        />
                        <Button
                          onClick={() => {
                            const input = document.getElementById('buyCode') as HTMLInputElement;
                            const code = input?.value?.trim();
                            if (code) {
                              handleBuyCodeSubmit(code);
                            }
                          }}
                          disabled={verifyBuyCodeMutation.isPending}
                        >
                          {verifyBuyCodeMutation.isPending ? "Processing..." : "Submit"}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-2">Don't have a buy code?</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Contact our team to get approved and receive your buy code:
                      </p>
                      <div className="bg-muted/50 p-3 rounded-md">
                        <p className="font-medium text-sm">Call or Text:</p>
                        <p className="text-lg font-mono font-bold text-primary">
                          (555) 123-DEAL
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Available Monday-Friday, 9 AM - 6 PM EST
                        </p>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}