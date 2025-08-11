import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Schema for the new offer form - only amount and buyCode
const offerFormSchema = z.object({
  amount: z.string()
    .min(1, "Amount is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Must be a valid positive number"),
  buyCode: z.string().min(4, "Buy code must be 4 characters").max(4, "Buy code must be 4 characters"),
});

interface OfferFormProps {
  vehicleId: number;
  onSuccess?: () => void;
}

export function OfferForm({ vehicleId, onSuccess }: OfferFormProps) {
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(offerFormSchema),
    defaultValues: {
      amount: "",
      buyCode: "",
    },
  });

  const submitOffer = useMutation({
    mutationFn: async (data: { amount: string; buyCode: string }) => {
      console.log('NEW FORM - Submitting offer data:', data);
      const response = await apiRequest("POST", `/api/vehicles/${vehicleId}/offers`, data);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your offer has been submitted successfully",
      });
      form.reset();
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to submit offer: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-4">
      <div className="bg-red-100 p-4 rounded-lg border-2 border-red-400">
        <p className="text-lg text-red-800 font-bold">🚨 NEW FORM LOADED - DECEMBER 2024 🚨</p>
        <p className="text-sm text-red-700">This form now requires a buy code for authentication</p>
        <p className="text-xs text-red-600">If you see dealer name/contact info fields, there's a cache issue</p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit((data) => submitOffer.mutate(data))} className="space-y-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Offer Amount ($)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Enter your offer amount (e.g., 25000)" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="buyCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Buy Code</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter your 4-character buy code (e.g., A1B2)" 
                    maxLength={4}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
                <p className="text-xs text-muted-foreground">
                  Don't have a buy code? Contact our team at (555) 123-DEAL
                </p>
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            className="w-full"
            disabled={submitOffer.isPending}
          >
            {submitOffer.isPending ? "Submitting Offer..." : "Submit Offer"}
          </Button>
        </form>
      </Form>
    </div>
  );
}