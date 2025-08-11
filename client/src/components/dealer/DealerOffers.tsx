import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Offer, Vehicle, OfferActivity } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Clock, 
  Car, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  MessageSquare,
  DollarSign,
  Calendar,
  Eye
} from "lucide-react";

type DealerOffer = Offer & { 
  vehicle: Vehicle; 
  activities: OfferActivity[] 
};

export function DealerOffers() {
  const { toast } = useToast();
  const [selectedOffer, setSelectedOffer] = useState<DealerOffer | null>(null);

  const { data: offers, isLoading } = useQuery<DealerOffer[]>({
    queryKey: ["/api/dealer/offers"],
    retry: false,
  });

  const respondToOffer = useMutation({
    mutationFn: async ({ id, action }: { id: number; action: 'accept' | 'decline' }) => {
      return apiRequest("PATCH", `/api/dealer/offers/${id}`, { action });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dealer/offers"] });
      toast({
        title: "Success",
        description: "Response submitted successfully",
      });
      setSelectedOffer(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit response",
        variant: "destructive",
      });
    },
  });

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { 
          icon: Clock, 
          color: 'text-orange-500', 
          bg: 'bg-orange-50', 
          border: 'border-orange-200',
          label: 'Pending Review'
        };
      case 'countered':
        return { 
          icon: TrendingUp, 
          color: 'text-blue-500', 
          bg: 'bg-blue-50', 
          border: 'border-blue-200',
          label: 'Counter Offer'
        };
      case 'accepted':
        return { 
          icon: CheckCircle2, 
          color: 'text-green-500', 
          bg: 'bg-green-50', 
          border: 'border-green-200',
          label: 'Accepted'
        };
      case 'declined':
        return { 
          icon: XCircle, 
          color: 'text-red-500', 
          bg: 'bg-red-50', 
          border: 'border-red-200',
          label: 'Declined'
        };
      case 'expired':
        return { 
          icon: AlertTriangle, 
          color: 'text-gray-500', 
          bg: 'bg-gray-50', 
          border: 'border-gray-200',
          label: 'Expired'
        };
      default:
        return { 
          icon: Clock, 
          color: 'text-gray-500', 
          bg: 'bg-gray-50', 
          border: 'border-gray-200',
          label: status
        };
    }
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) return "Expired";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };

  const groupedOffers = {
    active: offers?.filter(o => ['pending', 'countered'].includes(o.status)) || [],
    completed: offers?.filter(o => ['accepted', 'declined', 'expired'].includes(o.status)) || [],
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse text-muted-foreground">Loading your offers...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Active Offers</p>
                <p className="text-2xl font-bold">{groupedOffers.active.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Counter Offers</p>
                <p className="text-2xl font-bold">
                  {offers?.filter(o => o.status === 'countered').length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Accepted</p>
                <p className="text-2xl font-bold">
                  {offers?.filter(o => o.status === 'accepted').length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(
                    offers?.filter(o => o.status === 'accepted')
                      .reduce((sum, o) => sum + Number(o.counterAmount || o.amount), 0) || 0
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Offers */}
      {groupedOffers.active.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              Active Offers ({groupedOffers.active.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {groupedOffers.active.map((offer) => {
              const statusInfo = getStatusInfo(offer.status);
              const StatusIcon = statusInfo.icon;
              
              return (
                <Card key={offer.id} className={`${statusInfo.border} border-l-4`}>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Vehicle Info */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-muted-foreground" />
                          <h3 className="font-semibold">
                            {offer.vehicle.year} {offer.vehicle.make} {offer.vehicle.model}
                          </h3>
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p>VIN: {offer.vehicle.vin}</p>
                          <p>Listed Price: {formatCurrency(Number(offer.vehicle.price))}</p>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Submitted: {new Date(offer.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Offer Details */}
                      <div className="space-y-3">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${statusInfo.bg}`}>
                          <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />
                          <span className={`text-sm font-medium ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <div>
                            <p className="text-sm text-muted-foreground">Your Offer</p>
                            <p className="text-xl font-bold">{formatCurrency(Number(offer.amount))}</p>
                          </div>
                          
                          {offer.status === 'countered' && offer.counterAmount && (
                            <div>
                              <p className="text-sm text-muted-foreground">Counter Offer</p>
                              <p className="text-xl font-bold text-primary">
                                {formatCurrency(Number(offer.counterAmount))}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{getTimeRemaining(offer.expiresAt)}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="space-y-3">
                        {offer.status === 'countered' && (
                          <div className="space-y-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  className="w-full" 
                                  onClick={() => setSelectedOffer(offer)}
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Accept Counter
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Accept Counter Offer</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="bg-muted p-4 rounded-lg">
                                    <h4 className="font-semibold mb-2">
                                      {offer.vehicle.year} {offer.vehicle.make} {offer.vehicle.model}
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <p className="text-muted-foreground">Your Original Offer</p>
                                        <p className="font-semibold">{formatCurrency(Number(offer.amount))}</p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground">Counter Offer</p>
                                        <p className="font-semibold text-primary">
                                          {formatCurrency(Number(offer.counterAmount))}
                                        </p>
                                      </div>
                                    </div>
                                    {offer.counterMessage && (
                                      <div className="mt-3">
                                        <p className="text-muted-foreground text-sm">Message from admin:</p>
                                        <p className="text-sm">{offer.counterMessage}</p>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      className="flex-1"
                                      onClick={() => respondToOffer.mutate({ id: offer.id, action: 'accept' })}
                                      disabled={respondToOffer.isPending}
                                    >
                                      Confirm Purchase
                                    </Button>
                                    <Button
                                      variant="outline"
                                      className="flex-1"
                                      onClick={() => respondToOffer.mutate({ id: offer.id, action: 'decline' })}
                                      disabled={respondToOffer.isPending}
                                    >
                                      Decline
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>

                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => respondToOffer.mutate({ id: offer.id, action: 'decline' })}
                              disabled={respondToOffer.isPending}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Decline Counter
                            </Button>
                          </div>
                        )}

                        {/* Activity History */}
                        {offer.activities && offer.activities.length > 0 && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="w-full">
                                <Eye className="h-4 w-4 mr-2" />
                                View Activity ({offer.activities.length})
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Offer Activity History</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-3 max-h-60 overflow-y-auto">
                                {offer.activities
                                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                  .map((activity, index) => (
                                  <div key={index} className="flex gap-3 p-3 rounded-lg bg-muted">
                                    <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                    <div className="flex-1">
                                      <p className="text-sm font-medium">{activity.message}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {new Date(activity.createdAt).toLocaleDateString()} at{' '}
                                        {new Date(activity.createdAt).toLocaleTimeString()}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Completed Offers */}
      {groupedOffers.completed.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Offer History ({groupedOffers.completed.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {groupedOffers.completed.map((offer) => {
                const statusInfo = getStatusInfo(offer.status);
                const StatusIcon = statusInfo.icon;
                
                return (
                  <div key={offer.id} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${statusInfo.bg}`}>
                        <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />
                      </div>
                      <div>
                        <p className="font-medium">
                          {offer.vehicle.year} {offer.vehicle.make} {offer.vehicle.model}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(offer.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {offer.status === 'accepted' && offer.counterAmount 
                          ? formatCurrency(Number(offer.counterAmount))
                          : formatCurrency(Number(offer.amount))
                        }
                      </p>
                      <div className={`inline-flex items-center gap-1 text-xs ${statusInfo.color}`}>
                        <span className={`w-2 h-2 rounded-full ${statusInfo.color.replace('text-', 'bg-')}`}></span>
                        {statusInfo.label}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {offers?.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No offers yet</h3>
            <p className="text-muted-foreground">
              Start making offers on vehicles you're interested in. Your offers will appear here.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}