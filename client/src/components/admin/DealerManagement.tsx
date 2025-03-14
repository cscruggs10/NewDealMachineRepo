import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dealer, InsertDealer } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const dealerFormSchema = z.object({
  dealerName: z.string().min(1, "Dealer name is required"),
  contactName: z.string().min(1, "Contact name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
});

export function DealerManagement() {
  const { toast } = useToast();
  const [isAddingDealer, setIsAddingDealer] = useState(false);

  const form = useForm<z.infer<typeof dealerFormSchema>>({
    resolver: zodResolver(dealerFormSchema),
    defaultValues: {
      dealerName: "",
      contactName: "",
      email: "",
      phone: "",
    },
  });

  const { data: dealers, isLoading } = useQuery<Dealer[]>({
    queryKey: ["/api/dealers"],
  });

  const createDealerMutation = useMutation({
    mutationFn: async (data: z.infer<typeof dealerFormSchema>) => {
      return apiRequest("POST", "/api/dealers", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dealers"] });
      setIsAddingDealer(false);
      form.reset();
      toast({
        title: "Success",
        description: "Dealer added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add dealer",
        variant: "destructive",
      });
    },
  });

  const toggleDealerStatus = useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
      return apiRequest("PATCH", `/api/dealers/${id}`, { active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dealers"] });
      toast({
        title: "Success",
        description: "Dealer status updated",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof dealerFormSchema>) => {
    createDealerMutation.mutate(data);
  };

  if (isLoading) {
    return <div>Loading dealers...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Manage Dealers</CardTitle>
        <Dialog open={isAddingDealer} onOpenChange={setIsAddingDealer}>
          <DialogTrigger asChild>
            <Button>Add New Dealer</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Dealer</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="dealerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dealer Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input type="tel" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={createDealerMutation.isPending}
                >
                  {createDealerMutation.isPending ? "Adding..." : "Add Dealer"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {dealers?.map((dealer) => (
            <Card key={dealer.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-lg">{dealer.dealerName}</p>
                    <p className="text-sm text-muted-foreground">
                      Contact: {dealer.contactName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Email: {dealer.email}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Phone: {dealer.phone}
                    </p>
                  </div>
                  <Button
                    variant={dealer.active ? "default" : "secondary"}
                    onClick={() => toggleDealerStatus.mutate({
                      id: dealer.id,
                      active: !dealer.active
                    })}
                  >
                    {dealer.active ? "Active" : "Inactive"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
