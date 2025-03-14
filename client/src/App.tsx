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
  // Check if admin is logged in
  const { data: adminAuth } = useQuery({
    queryKey: ["/api/admin/check"],
    queryFn: async () => {
      const res = await fetch("/api/admin/check");
      if (!res.ok) return null;
      return res.json();
    }
  });

  return (
    <div className="border-b bg-background">
      <div className="container mx-auto px-4">
        <NavigationMenu className="h-16">
          <NavigationMenuList className="gap-6">
            <NavigationMenuItem>
              <Link href="/">
                <NavigationMenuLink className="text-xl font-semibold">
                  Deal Machine
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href="/dealer/login">
                <NavigationMenuLink className="text-base">
                  Dealer Login
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
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
    <footer className="border-t py-4 mt-auto">
      <div className="container mx-auto px-4 flex justify-center gap-6">
        <Link href={adminAuth?.authorized ? "/admin" : "/admin/login"}>
          <a className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Admin
          </a>
        </Link>
        <Link href="/upload">
          <a className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Upload Vehicle
          </a>
        </Link>
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
      <div className="min-h-screen bg-background flex flex-col">
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