import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Vehicle } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { OfferForm } from "../forms/OfferForm";
import { formatCurrency } from "@/lib/utils";
import { VideoIcon, Copy, ExternalLink, Play } from "lucide-react";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Link } from "wouter";

interface VehicleCardProps {
  vehicle: Vehicle;
}

export function VehicleCard({ vehicle }: VehicleCardProps) {
  const { toast } = useToast();
  const [isPlaying, setIsPlaying] = useState(false);

  const verifyBuyCodeMutation = useMutation({
    mutationFn: async (code: string) => {
      return apiRequest("POST", "/api/verify-code", {
        code,
        vehicleId: vehicle.id,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Vehicle purchase initiated. Our team will contact you shortly.",
      });
      setIsBuyDialogOpen(false);
      // Invalidate vehicles query to refresh the list
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

  const [isBuyDialogOpen, setIsBuyDialogOpen] = useState(false);

  const handleBuyNow = async () => {
    setIsBuyDialogOpen(true);
  };

  const handleBuyCodeSubmit = async (code: string) => {
    verifyBuyCodeMutation.mutate(code);
  };

  const copyVin = async () => {
    try {
      await navigator.clipboard.writeText(vehicle.vin);
      toast({
        title: "VIN Copied!",
        description: "Vehicle VIN has been copied to your clipboard",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy VIN to clipboard",
        variant: "destructive",
      });
    }
  };

  // Only show available vehicles
  if (vehicle.status === 'sold') {
    return null;
  }

  // Ensure we display the year, make, model prominently
  const vehicleTitle = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{vehicleTitle}</CardTitle>
          <Link href={`/vehicle/${vehicle.id}`}>
            <Button variant="ghost" size="icon" title="View Details">
              <ExternalLink className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="flex items-center gap-2 mt-2 bg-muted/50 p-2 rounded-md">
          <div className="flex-1">
            <p className="text-sm font-medium">VIN:</p>
            <p className="font-mono text-sm">{vehicle.vin}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={copyVin}
            title="Copy VIN"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        {vehicle.videos?.[0] && (vehicle.videos[0].includes('.mp4') || vehicle.videos[0].includes('.mov') || vehicle.videos[0].includes('.MOV') || vehicle.videos[0].includes('.webm')) ? (
          <Dialog>
            <DialogTrigger asChild>
              <div className="relative aspect-video rounded-lg overflow-hidden bg-muted cursor-pointer group">
                {/* Video preview/poster */}
                <video 
                  src={vehicle.videos[0]}
                  className="w-full h-full object-cover"
                  preload="metadata"
                  playsInline
                  muted
                  onLoadedMetadata={(e) => {
                    // Seek to the first frame to generate preview
                    const video = e.target as HTMLVideoElement;
                    video.currentTime = 0;
                  }}
                />
                {/* Play button overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                  <div className="rounded-full bg-white/90 p-3 group-hover:scale-110 transition-transform">
                    <Play className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </div>
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
        ) : null}

        <div className="space-y-2">
          <p className="text-2xl font-bold text-primary">
            {formatCurrency(Number(vehicle.price))}
          </p>
          <p className="text-muted-foreground">
            Mileage: {vehicle.mileage ? vehicle.mileage.toLocaleString() : 'N/A'} miles
          </p>
          {vehicle.trim && (
            <p className="text-muted-foreground">Trim: {vehicle.trim}</p>
          )}
          <p className="text-sm line-clamp-2">{vehicle.description}</p>
          {vehicle.condition && (
            <p className="text-sm font-medium text-primary">
              {vehicle.condition}
            </p>
          )}
        </div>

        <div className="mt-auto space-y-2 pt-4">
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
              <OfferForm vehicleId={vehicle.id} />
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}