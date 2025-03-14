import { VehicleGrid } from "@/components/inventory/VehicleGrid";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List, Search } from "lucide-react";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [certificationFilter, setCertificationFilter] = useState<string>("all");

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold">Deal Machine</h1>
          <p className="mt-2 text-lg opacity-90">
            Wholesale Auto Dealer Marketplace
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8">
        <div className="px-6 mb-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by make, model, or year..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center border rounded-lg">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("grid")}
                className="rounded-none rounded-l-lg"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("list")}
                className="rounded-none rounded-r-lg"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Select value={certificationFilter} onValueChange={setCertificationFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by certification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Listings</SelectItem>
                <SelectItem value="Deal Machine Certified">Deal Machine Certified</SelectItem>
                <SelectItem value="Auction Certified">Auction Certified</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <VehicleGrid 
          searchQuery={searchQuery}
          viewMode={viewMode}
          certificationFilter={certificationFilter}
        />
      </main>

      <footer className="bg-muted py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-6 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Deal Machine. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}