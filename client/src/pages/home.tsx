import { VehicleGrid } from "@/components/inventory/VehicleGrid";

export default function Home() {
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
        <VehicleGrid />
      </main>

      <footer className="bg-muted py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-6 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Deal Machine. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
