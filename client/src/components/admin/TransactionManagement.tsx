import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Transaction, Vehicle } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

export function TransactionManagement() {
  const { toast } = useToast();

  const { data: transactions, isLoading } = useQuery<(Transaction & { vehicle: Vehicle })[]>({
    queryKey: ["/api/transactions"],
  });

  const updateTransaction = useMutation({
    mutationFn: async ({ id, status, isPaid }: { id: number; status?: string; isPaid?: boolean }) => {
      return apiRequest("PATCH", `/api/transactions/${id}`, { status, isPaid });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      toast({
        title: "Success",
        description: "Transaction updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update transaction",
        variant: "destructive",
      });
    },
  });

  const uploadBillOfSale = useMutation({
    mutationFn: async ({ id, file }: { id: number; file: File }) => {
      const formData = new FormData();
      formData.append('billOfSale', file);
      return apiRequest("POST", `/api/transactions/${id}/bill-of-sale`, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      toast({
        title: "Success",
        description: "Bill of Sale uploaded successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to upload Bill of Sale",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <div>Loading transactions...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions?.map((transaction) => (
            <Card key={transaction.id}>
              <CardContent className="p-4">
                <div className="space-y-4">
                  {/* Transaction Details */}
                  <div>
                    <h3 className="font-medium">
                      {transaction.vehicle.year} {transaction.vehicle.make} {transaction.vehicle.model}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Transaction ID: {transaction.id}
                    </p>
                    <p className="text-lg font-semibold text-primary">
                      {formatCurrency(Number(transaction.amount))}
                    </p>
                  </div>

                  {/* Status Controls */}
                  <div className="flex items-center gap-4">
                    <Button
                      variant={transaction.isPaid ? "default" : "outline"}
                      onClick={() => updateTransaction.mutate({ 
                        id: transaction.id, 
                        isPaid: !transaction.isPaid 
                      })}
                    >
                      {transaction.isPaid ? "Paid" : "Mark as Paid"}
                    </Button>

                    <Button
                      variant={transaction.status === 'completed' ? "default" : "outline"}
                      onClick={() => updateTransaction.mutate({ 
                        id: transaction.id, 
                        status: transaction.status === 'completed' ? 'pending' : 'completed'
                      })}
                    >
                      {transaction.status === 'completed' ? "Completed" : "Mark Complete"}
                    </Button>
                  </div>

                  {/* Bill of Sale Upload */}
                  <div className="flex items-center gap-4">
                    <Input
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          uploadBillOfSale.mutate({ id: transaction.id, file });
                        }
                      }}
                      accept=".pdf,.png,.jpg,.jpeg"
                    />
                    {transaction.billOfSale && (
                      <a 
                        href={transaction.billOfSale}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        View Bill of Sale
                      </a>
                    )}
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
