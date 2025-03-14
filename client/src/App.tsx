import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
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
    <div className="bg-white border-b">
      <div className="container mx-auto">
        <NavigationMenu className="h-20">
          <NavigationMenuList className="flex items-center justify-between w-full px-4">
            <NavigationMenuItem>
              <Link href="/">
                <NavigationMenuLink className="text-2xl font-bold text-primary hover:text-primary/90 transition-colors">
                  Deal Machine
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <div className="flex items-center gap-8">
              <NavigationMenuItem>
                <Link href="/dealer/login">
                  <NavigationMenuLink className="text-base font-medium text-gray-600 hover:text-primary transition-colors">
                    Dealer Login
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
    <footer className="bg-gray-50 py-6 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex justify-center space-x-8 text-sm">
          <Link href={adminAuth?.authorized ? "/admin" : "/admin/login"}>
            <a className="text-gray-500 hover:text-primary transition-colors">
              Admin
            </a>
          </Link>
          <Link href="/upload">
            <a className="text-gray-500 hover:text-primary transition-colors">
              Upload Vehicle
            </a>
          </Link>
        </div>
      </div>
    </footer>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
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