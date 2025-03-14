import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Admin from "@/pages/admin";
import AdminLogin from "@/pages/admin/login"; // Added import
import Upload from "@/pages/upload";
import DealerLogin from "@/pages/dealer/login";
import DealerDashboard from "@/pages/dealer/dashboard";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from "@/components/ui/navigation-menu";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query"; // Added import

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
    <NavigationMenu className="max-w-screen px-6 py-4 bg-background border-b">
      <NavigationMenuList className="gap-6">
        <NavigationMenuItem>
          <Link href="/">
            <NavigationMenuLink className="text-lg font-semibold">
              Deal Machine
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <Link href={adminAuth?.authorized ? "/admin" : "/admin/login"}>
            <NavigationMenuLink>
              Admin
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <Link href="/upload">
            <NavigationMenuLink>
              Upload Vehicle
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <Link href="/dealer/login">
            <NavigationMenuLink>
              Dealer Login
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
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
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background">
        <Navigation />
        <Router />
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;