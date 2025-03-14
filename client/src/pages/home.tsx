import { VehicleGrid } from "@/components/inventory/VehicleGrid";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List, Search } from "lucide-react";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [certificationFilter, setCertificationFilter] = useState<string>("all");

  // New filter states with adjusted ranges
  const [priceRange, setPriceRange] = useState([0, 25000]);
  const [mileageRange, setMileageRange] = useState([0, 200000]);
  const [yearRange, setYearRange] = useState([2006, 2025]);
  const [sortBy, setSortBy] = useState("newest");

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
          {/* Search and View Mode */}
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

          {/* Filters Section */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Certification Filter */}
            <Select value={certificationFilter} onValueChange={setCertificationFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by certification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Listings</SelectItem>
                <SelectItem value="Deal Machine Certified">Deal Machine Certified</SelectItem>
                <SelectItem value="Auction Certified">Auction Certified</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Options */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="mileage-low">Mileage: Low to High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Price Range */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Price Range</span>
              <span>${priceRange[0].toLocaleString()} - ${priceRange[1].toLocaleString()}</span>
            </div>
            <Slider
              min={0}
              max={25000}
              step={500}
              value={priceRange}
              onValueChange={setPriceRange}
              className="w-full"
            />
          </div>

          {/* Mileage Range */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Mileage Range</span>
              <span>{mileageRange[0].toLocaleString()} - {mileageRange[1].toLocaleString()} miles</span>
            </div>
            <Slider
              min={0}
              max={200000}
              step={5000}
              value={mileageRange}
              onValueChange={setMileageRange}
              className="w-full"
            />
          </div>

          {/* Year Range */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Year Range</span>
              <span>{yearRange[0]} - {yearRange[1]}</span>
            </div>
            <Slider
              min={2006}
              max={2025}
              step={1}
              value={yearRange}
              onValueChange={setYearRange}
              className="w-full"
            />
          </div>
        </div>

        <VehicleGrid 
          searchQuery={searchQuery}
          viewMode={viewMode}
          certificationFilter={certificationFilter}
          priceRange={priceRange}
          mileageRange={mileageRange}
          yearRange={yearRange}
          sortBy={sortBy}
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