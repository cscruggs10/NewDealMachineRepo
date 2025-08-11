import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Offer, Vehicle, OfferActivity } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Clock, DollarSign, User, Car, MessageCircle, CheckCircle, XCircle, ArrowRightLeft } from "lucide-react";

type ExtendedOffer = Offer & { 
  vehicle: Vehicle; 
  dealer: { id: number; dealerName: string }; 
  activities: OfferActivity[] 
};

export function OfferManagement() {
  const { toast } = useToast();
  const [counterAmount, setCounterAmount] = useState("");
  const [counterMessage, setCounterMessage] = useState("");
  const [selectedOfferId, setSelectedOfferId] = useState<number | null>(null);

  const { data: offers, isLoading } = useQuery<ExtendedOffer[]>({
    queryKey: ["/api/offers"],
    retry: false,
  });

  const updateOffer = useMutation({
    mutationFn: async ({ id, status, counterAmount, counterMessage }: { 
      id: number; 
      status: string; 
      counterAmount?: string; 
      counterMessage?: string; 
    }) => {
      return apiRequest("PATCH", `/api/offers/${id}`, { status, counterAmount, counterMessage });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/offers"] });
      toast({
        title: "Success",
        description: "Offer updated successfully",
      });
      setSelectedOfferId(null);
      setCounterAmount("");
      setCounterMessage("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update offer",
        variant: "destructive",
      });
    },
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'accepted': return 'default';
      case 'declined': return 'destructive';
      case 'countered': return 'secondary';
      case 'expired': return 'outline';
      default: return 'secondary';
    }
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) return "Expired";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m remaining`;
  };

  const groupedOffers = {
    pending: offers?.filter(o => o.status === 'pending') || [],
    countered: offers?.filter(o => o.status === 'countered') || [],
    completed: offers?.filter(o => ['accepted', 'declined', 'expired'].includes(o.status)) || [],
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse text-muted-foreground">Loading offers...</div>
      </div>
    );
  }

  const handleCounterOffer = () => {
    if (!selectedOfferId || !counterAmount) return;
    
    updateOffer.mutate({
      id: selectedOfferId,
      status: 'countered',
      counterAmount,
      counterMessage,
    });
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{groupedOffers.pending.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <ArrowRightLeft className="h-4 w-4 text-blue-500" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Countered</p>
                <p className="text-2xl font-bold">{groupedOffers.countered.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{groupedOffers.completed.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Offers */}
      {groupedOffers.pending.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              Pending Offers ({groupedOffers.pending.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {groupedOffers.pending.map((offer) => (
              <Card key={offer.id} className="border-l-4 border-l-orange-500">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column - Vehicle & Offer Info */}
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Car className="h-4 w-4" />
                            {offer.vehicle.year} {offer.vehicle.make} {offer.vehicle.model}
                          </h3>
                          <p className="text-sm text-muted-foreground">VIN: {offer.vehicle.vin}</p>
                        </div>
                        <Badge variant={getStatusBadgeVariant(offer.status)}>
                          {offer.status.toUpperCase()}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Vehicle Price</p>
                          <p className="font-semibold text-lg">{formatCurrency(Number(offer.vehicle.price))}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Offer Amount</p>
                          <p className="font-semibold text-lg text-primary">{formatCurrency(Number(offer.amount))}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>{offer.dealer.dealerName}</span>
                        <span>•</span>
                        <Clock className="h-4 w-4" />
                        <span>{getTimeRemaining(offer.expiresAt)}</span>
                      </div>
                    </div>

                    {/* Right Column - Actions */}
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 gap-2">
                        <Button
                          className="w-full"
                          onClick={() => updateOffer.mutate({ id: offer.id, status: 'accepted' })}
                          disabled={updateOffer.isPending}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Accept Offer
                        </Button>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              className="w-full"
                              onClick={() => setSelectedOfferId(offer.id)}
                            >
                              <ArrowRightLeft className="h-4 w-4 mr-2" />
                              Counter Offer
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Counter Offer</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="counter-amount">Counter Amount ($)</Label>
                                <Input
                                  id="counter-amount"
                                  type="number"
                                  placeholder="Enter counter amount"
                                  value={counterAmount}
                                  onChange={(e) => setCounterAmount(e.target.value)}
                                />
                              </div>
                              <div>
                                <Label htmlFor="counter-message">Message (Optional)</Label>
                                <Textarea
                                  id="counter-message"
                                  placeholder="Add a message to the dealer..."
                                  value={counterMessage}
                                  onChange={(e) => setCounterMessage(e.target.value)}
                                />
                              </div>
                              <Button 
                                onClick={handleCounterOffer}
                                disabled={!counterAmount || updateOffer.isPending}
                                className="w-full"
                              >
                                Send Counter Offer
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Button
                          variant="destructive"
                          className="w-full"
                          onClick={() => updateOffer.mutate({ id: offer.id, status: 'declined' })}
                          disabled={updateOffer.isPending}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Decline
                        </Button>
                      </div>

                      {/* Activity History */}
                      {offer.activities && offer.activities.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <h4 className="text-sm font-medium mb-2">Activity</h4>
                          <div className="space-y-1 max-h-20 overflow-y-auto">
                            {offer.activities.map((activity, index) => (
                              <div key={index} className="text-xs text-muted-foreground">
                                {new Date(activity.createdAt).toLocaleDateString()} - {activity.message}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Countered Offers */}
      {groupedOffers.countered.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-blue-500" />
              Counter Offers Awaiting Response ({groupedOffers.countered.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {groupedOffers.countered.map((offer) => (
              <Card key={offer.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
                    <div>
                      <h3 className="font-semibold">{offer.vehicle.year} {offer.vehicle.make} {offer.vehicle.model}</h3>
                      <p className="text-sm text-muted-foreground">{offer.dealer.dealerName}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Original → Counter</p>
                      <p className="font-semibold">
                        {formatCurrency(Number(offer.amount))} → {formatCurrency(Number(offer.counterAmount))}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary">Awaiting Dealer Response</Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {getTimeRemaining(offer.expiresAt)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Completed Offers */}
      {groupedOffers.completed.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Completed Offers ({groupedOffers.completed.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {groupedOffers.completed.map((offer) => (
                <div key={offer.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Badge variant={getStatusBadgeVariant(offer.status)}>
                      {offer.status.toUpperCase()}
                    </Badge>
                    <div>
                      <p className="font-medium">{offer.vehicle.year} {offer.vehicle.make} {offer.vehicle.model}</p>
                      <p className="text-sm text-muted-foreground">{offer.dealer.dealerName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(Number(offer.amount))}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(offer.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {offers?.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No offers yet</h3>
            <p className="text-muted-foreground">Offers from dealers will appear here for you to review.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}