import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Transaction, BuyCode } from "@shared/schema";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { formatCurrency } from "@/lib/utils";

export default function DealerDashboard() {
  const [, setLocation] = useLocation();

  const { data: transactions } = useQuery<Transaction[]>({
    queryKey: ["/api/dealer/transactions"],
  });

  const { data: buyCodes } = useQuery<BuyCode[]>({
    queryKey: ["/api/dealer/buycodes"],
  });

  useEffect(() => {
    // Check if dealer is logged in by making a request
    fetch('/api/dealer/transactions')
      .then(res => {
        if (!res.ok) {
          setLocation('/dealer/login');
        }
      });
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Dealer Dashboard</h1>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Buy Codes */}
          <Card>
            <CardHeader>
              <CardTitle>Your Buy Codes</CardTitle>
            </CardHeader>
            <CardContent>
              {buyCodes?.length === 0 ? (
                <p className="text-muted-foreground">No buy codes available</p>
              ) : (
                <div className="space-y-4">
                  {buyCodes?.map(code => (
                    <div 
                      key={code.id} 
                      className="p-4 rounded-lg border"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-mono text-lg">{code.code}</p>
                          <p className="text-sm text-muted-foreground">
                            Uses: {code.usageCount}/{code.maxUses || '∞'}
                          </p>
                        </div>
                        <div className={`text-sm ${code.active ? 'text-green-600' : 'text-red-600'}`}>
                          {code.active ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {transactions?.length === 0 ? (
                <p className="text-muted-foreground">No transactions yet</p>
              ) : (
                <div className="space-y-4">
                  {transactions?.map(transaction => (
                    <div 
                      key={transaction.id} 
                      className="p-4 rounded-lg border"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">
                            Vehicle ID: {transaction.vehicleId}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(transaction.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <p className="text-lg font-semibold">
                          {formatCurrency(Number(transaction.amount))}
                        </p>
                      </div>
                      <div className="mt-2">
                        <span className={`text-sm px-2 py-1 rounded-full ${
                          transaction.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {transaction.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
