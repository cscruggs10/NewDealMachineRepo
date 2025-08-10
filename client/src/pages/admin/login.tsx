import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

const ALLOWED_ADMINS = [
  'corey@ifinancememphis.com',
  'jon@ifinancememphis.com',
  'sam@ifinancememphis.com',
  'kyle@ifinancememphis.com',
  'cameron@ifinancememphis.com',
  'greg@ifinancememphis.com'
];

const loginSchema = z.object({
  email: z.string()
    .email("Please enter a valid email")
    .refine(email => ALLOWED_ADMINS.includes(email.toLowerCase()), {
      message: "Not authorized as admin"
    }),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const response = await apiRequest("POST", "/api/admin/login", data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Login failed");
      }
      return response.json();
    },
    onSuccess: (data) => {
      // Store the token if provided
      if (data.token) {
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminEmail', data.email);
      }
      
      setIsRedirecting(true);
      toast({
        title: "Success",
        description: "Logged in as admin",
      });
      
      // Invalidate the admin check query to refresh the auth state
      queryClient.invalidateQueries({ queryKey: ["/api/admin/check"] });
      
      // Try direct navigation first
      window.location.href = '/admin';
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div 
        className="min-h-screen bg-background p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <Card className={isRedirecting ? "opacity-50 pointer-events-none" : ""}>
              <CardHeader>
                <CardTitle>Admin Login</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={loginMutation.isPending || isRedirecting}
                    >
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Logging in...
                        </>
                      ) : isRedirecting ? (
                        "Redirecting..."
                      ) : (
                        "Login"
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}