import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Inventory from "@/pages/inventory";
import Admin from "@/pages/admin";
import AdminLogin from "@/pages/admin/login";
import Upload from "@/pages/upload";
import DealerLogin from "@/pages/dealer/login";
import DealerDashboard from "@/pages/dealer/dashboard";
import VehicleDetails from "@/pages/vehicle/[id]";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from "@/components/ui/navigation-menu";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";

function Navigation() {
  const { data: adminAuth } = useQuery({
    queryKey: ["/api/admin/check"],
    queryFn: async () => {
      const res = await fetch("/api/admin/check");
      if (!res.ok) return null;
      return res.json();
    }
  });

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto">
        <NavigationMenu className="h-16">
          <NavigationMenuList className="flex items-center justify-between w-full px-4 sm:px-6">
            <NavigationMenuItem>
              <Link href="/">
                <NavigationMenuLink className="text-lg sm:text-xl font-bold text-gray-900 hover:text-gray-700 transition-colors flex items-center gap-2">
                  Deal Machine
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <div className="flex items-center gap-2 sm:gap-6">
              <NavigationMenuItem className="hidden sm:block">
                <Link href="/inventory">
                  <NavigationMenuLink className="text-base font-medium text-gray-600 hover:text-gray-900 transition-colors px-4 py-2 rounded-lg hover:bg-gray-50">
                    Browse Inventory
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem className="sm:hidden">
                <Link href="/inventory">
                  <NavigationMenuLink className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-2 py-1 rounded-lg hover:bg-gray-50">
                    Browse
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/dealer/login">
                  <NavigationMenuLink className="bg-gray-900 text-white px-3 py-2 sm:px-6 rounded-lg font-semibold hover:bg-gray-800 transition-all duration-300 text-sm sm:text-base">
                    <span className="hidden sm:inline">Dealer Portal</span>
                    <span className="sm:hidden">Portal</span>
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </div>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </div>
  );
}

function Footer() {
  const { data: adminAuth } = useQuery({
    queryKey: ["/api/admin/check"],
    queryFn: async () => {
      const res = await fetch("/api/admin/check");
      if (!res.ok) return null;
      return res.json();
    }
  });

  return (
    <footer className="bg-gray-900 py-8 mt-auto border-t border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center space-y-4">
          {/* Logo in footer */}
          <div className="flex items-center gap-3">
            <img 
              src="/assets/deal-machine-logo.jpg" 
              alt="Deal Machine Logo" 
              className="h-8 w-auto object-contain opacity-90"
            />
          </div>
          <div className="flex justify-center space-x-8 text-sm">
            <Link href={adminAuth?.authorized ? "/admin" : "/admin/login"}>
              <a className="text-gray-400 hover:text-white transition-colors">
                Admin
              </a>
            </Link>
            <Link href="/upload">
              <a className="text-gray-400 hover:text-white transition-colors">
                Upload Vehicle
              </a>
            </Link>
          </div>
          <div className="text-xs text-gray-500 text-center">
            © 2025 Deal Machine. Wholesale Auto Marketplace.
          </div>
        </div>
      </div>
    </footer>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/inventory" component={Inventory} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin" component={Admin} />
      <Route path="/upload" component={Upload} />
      <Route path="/dealer/login" component={DealerLogin} />
      <Route path="/dealer/dashboard" component={DealerDashboard} />
      <Route path="/vehicle/:id" component={VehicleDetails} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-white flex flex-col">
        <Navigation />
        <main className="flex-grow">
          <Router />
        </main>
        <Footer />
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;