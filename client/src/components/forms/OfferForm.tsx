import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertOfferSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface OfferFormProps {
  vehicleId: number;
}

export function OfferForm({ vehicleId }: OfferFormProps) {
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(insertOfferSchema),
    defaultValues: {
      vehicleId,
      amount: "",
      dealerName: "",
      contactInfo: "",
    },
  });

  const submitOffer = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", `/api/vehicles/${vehicleId}/offers`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your offer has been submitted",
      });
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit offer",
        variant: "destructive",
      });
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => submitOffer.mutate(data))} className="space-y-4">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Offer Amount</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="Enter amount" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="dealerName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dealer Name</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter dealer name" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contactInfo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Information</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter phone or email" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          className="w-full"
          disabled={submitOffer.isPending}
        >
          Submit Offer
        </Button>
      </form>
    </Form>
  );
}
