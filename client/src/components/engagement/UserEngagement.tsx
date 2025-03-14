import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Heart, Share2, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Vehicle } from "@shared/schema";

interface UserEngagementProps {
  vehicle: Vehicle;
}

export function UserEngagement({ vehicle }: UserEngagementProps) {
  const { toast } = useToast();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isWatching, setIsWatching] = useState(false);

  // Load saved preferences from localStorage
  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const watching = JSON.parse(localStorage.getItem('watching') || '[]');
    setIsFavorited(favorites.includes(vehicle.id));
    setIsWatching(watching.includes(vehicle.id));
  }, [vehicle.id]);

  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    let newFavorites;
    
    if (isFavorited) {
      newFavorites = favorites.filter((id: number) => id !== vehicle.id);
      toast({
        title: "Removed from favorites",
        description: "Vehicle removed from your favorites list",
      });
    } else {
      newFavorites = [...favorites, vehicle.id];
      toast({
        title: "Added to favorites",
        description: "Vehicle added to your favorites list",
      });
    }
    
    localStorage.setItem('favorites', JSON.stringify(newFavorites));
    setIsFavorited(!isFavorited);
  };

  const toggleWatch = () => {
    const watching = JSON.parse(localStorage.getItem('watching') || '[]');
    let newWatching;
    
    if (isWatching) {
      newWatching = watching.filter((id: number) => id !== vehicle.id);
      toast({
        title: "Notifications disabled",
        description: "You will no longer receive updates about this vehicle",
      });
    } else {
      newWatching = [...watching, vehicle.id];
      toast({
        title: "Notifications enabled",
        description: "You will receive updates about this vehicle",
      });
    }
    
    localStorage.setItem('watching', JSON.stringify(newWatching));
    setIsWatching(!isWatching);
  };

  const shareVehicle = async () => {
    try {
      await navigator.share({
        title: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        text: `Check out this ${vehicle.year} ${vehicle.make} ${vehicle.model} on Deal Machine`,
        url: window.location.href,
      });
    } catch (err) {
      // Fallback to copying link if Web Share API is not available
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "Vehicle link copied to clipboard",
      });
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant={isFavorited ? "default" : "outline"}
        size="icon"
        onClick={toggleFavorite}
        aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
      >
        <Heart className={`h-4 w-4 ${isFavorited ? "fill-current" : ""}`} />
      </Button>
      
      <Button
        variant={isWatching ? "default" : "outline"}
        size="icon"
        onClick={toggleWatch}
        aria-label={isWatching ? "Stop watching" : "Watch for updates"}
      >
        <Bell className="h-4 w-4" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={shareVehicle}
        aria-label="Share vehicle"
      >
        <Share2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
