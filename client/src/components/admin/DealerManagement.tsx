import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dealer, InsertDealer, BuyCode } from "@shared/schema";
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
import { Badge } from "@/components/ui/badge";

const dealerFormSchema = z.object({
  dealerName: z.string().min(1, "Dealer name is required"),
  address: z.string().min(1, "Address is required"),
  contactName: z.string().min(1, "Contact name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  billingContactName: z.string().min(1, "Billing contact name is required"),
  billingContactEmail: z.string().email("Invalid billing contact email"),
  billingContactPhone: z.string().min(10, "Billing contact phone must be at least 10 digits"),
  titleContactName: z.string().min(1, "Title contact name is required"),
  titleContactEmail: z.string().email("Invalid title contact email"),
  titleContactPhone: z.string().min(10, "Title contact phone must be at least 10 digits"),
});

export function DealerManagement() {
  const { toast } = useToast();
  const [isAddingDealer, setIsAddingDealer] = useState(false);
  const [newBuyCode, setNewBuyCode] = useState<BuyCode | null>(null);
  const [selectedDealerId, setSelectedDealerId] = useState<number | null>(null);

  const form = useForm<z.infer<typeof dealerFormSchema>>({
    resolver: zodResolver(dealerFormSchema),
    defaultValues: {
      dealerName: "",
      address: "",
      contactName: "",
      email: "",
      phone: "",
      billingContactName: "",
      billingContactEmail: "",
      billingContactPhone: "",
      titleContactName: "",
      titleContactEmail: "",
      titleContactPhone: "",
    },
  });

  const { data: dealers } = useQuery<Dealer[]>({
    queryKey: ["/api/dealers"],
  });

  const { data: buyCodes } = useQuery<BuyCode[]>({
    queryKey: ["/api/buy-codes"],
    enabled: Boolean(selectedDealerId),
  });

  const createDealerMutation = useMutation({
    mutationFn: async (data: z.infer<typeof dealerFormSchema>) => {
      const response = await apiRequest("POST", "/api/dealers", data);
      const responseData = await response.json();
      return responseData;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/dealers"] });
      form.reset();
      setNewBuyCode(data.buyCode);
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

  const generateNewBuyCode = useMutation({
    mutationFn: async (dealerId: number) => {
      const response = await apiRequest("POST", "/api/buy-codes", {
        dealerId,
        maxUses: 10,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/buy-codes"] });
      toast({
        title: "Success",
        description: "New buy code generated",
      });
      setNewBuyCode(data);
    },
  });

  const onSubmit = (data: z.infer<typeof dealerFormSchema>) => {
    createDealerMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Manage Dealers</CardTitle>
        <Dialog open={isAddingDealer} onOpenChange={setIsAddingDealer}>
          <DialogTrigger asChild>
            <Button>Add New Dealer</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Dealer</DialogTitle>
            </DialogHeader>
            {newBuyCode ? (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-medium mb-2">Buy Code Generated</h3>
                  <p className="text-2xl font-mono">{newBuyCode.code}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    This code expires in 30 days and can be used up to 10 times.
                    Make sure to provide this code to the dealer.
                  </p>
                </div>
                <Button onClick={() => {
                  setNewBuyCode(null);
                  setIsAddingDealer(false);
                }}>
                  Close
                </Button>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
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
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Primary Contact</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="contactName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
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
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Billing Contact</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="billingContactName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="billingContactEmail"
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
                        name="billingContactPhone"
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
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Title Contact</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="titleContactName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="titleContactEmail"
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
                        name="titleContactPhone"
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
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={createDealerMutation.isPending}
                  >
                    {createDealerMutation.isPending ? "Adding..." : "Add Dealer"}
                  </Button>
                </form>
              </Form>
            )}
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {dealers?.map((dealer) => (
            <Card key={dealer.id} onClick={() => setSelectedDealerId(dealer.id)}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-4 flex-1">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-lg">{dealer.dealerName}</p>
                        <Badge variant={dealer.active ? "default" : "secondary"}>
                          {dealer.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{dealer.address}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-8">
                      <div>
                        <p className="font-medium">Primary Contact</p>
                        <p className="text-sm">{dealer.contactName}</p>
                        <p className="text-sm text-muted-foreground">{dealer.email}</p>
                        <p className="text-sm text-muted-foreground">{dealer.phone}</p>
                      </div>

                      <div>
                        <p className="font-medium">Billing Contact</p>
                        <p className="text-sm">{dealer.billingContactName}</p>
                        <p className="text-sm text-muted-foreground">{dealer.billingContactEmail}</p>
                        <p className="text-sm text-muted-foreground">{dealer.billingContactPhone}</p>
                      </div>

                      <div>
                        <p className="font-medium">Title Contact</p>
                        <p className="text-sm">{dealer.titleContactName}</p>
                        <p className="text-sm text-muted-foreground">{dealer.titleContactEmail}</p>
                        <p className="text-sm text-muted-foreground">{dealer.titleContactPhone}</p>
                      </div>
                    </div>

                    <div className="border-t pt-4 mt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium mb-2">Buy Codes</h4>
                          {buyCodes?.filter(code => code.dealerId === dealer.id).map(code => (
                            <div key={code.id} className="mb-2">
                              <p className="font-mono text-sm bg-muted p-2 rounded inline-block">
                                {code.code}
                              </p>
                              <span className="text-xs text-muted-foreground ml-2">
                                Uses: {code.usageCount}/{code.maxUses || "∞"}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="space-x-2">
                          <Button
                            onClick={() => generateNewBuyCode.mutate(dealer.id)}
                            disabled={generateNewBuyCode.isPending}
                          >
                            Generate New Code
                          </Button>
                          <Button
                            variant={dealer.active ? "destructive" : "default"}
                            onClick={() => toggleDealerStatus.mutate({
                              id: dealer.id,
                              active: !dealer.active
                            })}
                          >
                            {dealer.active ? "Deactivate" : "Activate"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}