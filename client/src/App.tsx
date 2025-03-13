import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Admin from "@/pages/admin";
import Upload from "@/pages/upload";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from "@/components/ui/navigation-menu";
import { Link } from "wouter";

function Navigation() {
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
          <Link href="/admin">
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
      </NavigationMenuList>
    </NavigationMenu>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/admin" component={Admin} />
      <Route path="/upload" component={Upload} />
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
