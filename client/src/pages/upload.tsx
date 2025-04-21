import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createInitialVehicleSchema } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Lock, VideoIcon } from "lucide-react";
import { decodeVIN, vinSchema } from "@/lib/vin";
import { VinScanner } from "@/components/scanner/VinScanner";
import { QRLink } from "@/components/ui/qr-link";
import { InspectionForm } from "@/components/forms/InspectionForm";

type UploadStep = 'password' | 'vin' | 'inspection' | 'complete';

export default function UploadPage() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<UploadStep>('password');
  const [isDecodingVin, setIsDecodingVin] = useState(false);

  const passwordForm = useForm({
    defaultValues: {
      password: "",
    },
  });

  const vehicleForm = useForm({
    resolver: zodResolver(createInitialVehicleSchema),
    defaultValues: {
      vin: "",
      year: "",
      make: "",
      model: "",
      trim: "",
      videos: [],
    },
  });

  const verifyPassword = (data: { password: string }) => {
    if (data.password === "1211") {
      setCurrentStep('vin');
      passwordForm.reset(); 
      toast({
        title: "Success",
        description: "Password verified. You can now upload vehicles.",
      });
    } else {
      toast({
        title: "Error",
        description: "Incorrect password",
        variant: "destructive",
      });
    }
  };

  const handleVinChange = async (vin: string) => {
    if (vin.length === 17) {
      try {
        setIsDecodingVin(true);
        const result = await vinSchema.parseAsync(vin);
        const vehicleInfo = await decodeVIN(result);

        // Set the VIN first
        vehicleForm.setValue("vin", vin);

        // Then set other vehicle information
        vehicleForm.setValue("year", vehicleInfo.year);
        vehicleForm.setValue("make", vehicleInfo.make);
        vehicleForm.setValue("model", vehicleInfo.model);
        vehicleForm.setValue("trim", vehicleInfo.trim);

        toast({
          title: "VIN Decoded",
          description: "Vehicle information has been automatically filled",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to decode VIN",
          variant: "destructive",
        });
      } finally {
        setIsDecodingVin(false);
      }
    }
  };

  const createVehicle = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/vehicles", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Vehicle has been registered and is ready for inspection",
      });
      vehicleForm.reset();
      setCurrentStep('inspection');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to register vehicle",
        variant: "destructive",
      });
    },
  });

  const handleNext = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    const vin = vehicleForm.getValues('vin');
    if (!vin || vin.length !== 17) {
      toast({
        title: "Error",
        description: "Please enter a valid 17-digit VIN",
        variant: "destructive",
      });
      return;
    }

    // Submit the vehicle data to register it
    createVehicle.mutate({
      vin: vin,
      year: vehicleForm.getValues('year'),
      make: vehicleForm.getValues('make'),
      model: vehicleForm.getValues('model'),
      trim: vehicleForm.getValues('trim'),
    });
  };

  const handleInspectionComplete = () => {
    setCurrentStep('complete');
  };

  const renderVinStep = () => (
    <>
      <CardHeader>
        <CardTitle>Enter Vehicle VIN</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...vehicleForm}>
          <form onSubmit={handleNext} className="space-y-4">
            <FormField
              control={vehicleForm.control}
              name="vin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vehicle Identification Number (VIN)</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input 
                        placeholder="Enter full 17-character VIN"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value.toUpperCase();
                          field.onChange(value);
                          handleVinChange(value);
                        }}
                        maxLength={17}
                        disabled={isDecodingVin}
                      />
                    </FormControl>
                    <VinScanner 
                      onScan={(vin) => {
                        const value = vin.toUpperCase();
                        vehicleForm.setValue("vin", value);
                        handleVinChange(value);
                      }} 
                    />
                  </div>
                  <FormMessage />
                  {isDecodingVin && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Decoding VIN...
                    </div>
                  )}
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={vehicleForm.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year</FormLabel>
                    <FormControl>
                      <Input {...field} disabled />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={vehicleForm.control}
                name="make"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Make</FormLabel>
                    <FormControl>
                      <Input {...field} disabled />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={vehicleForm.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model</FormLabel>
                    <FormControl>
                      <Input {...field} disabled />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={vehicleForm.control}
                name="trim"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trim</FormLabel>
                    <FormControl>
                      <Input {...field} disabled />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-start">
              <Button type="submit" className="md:flex-1" disabled={createVehicle.isPending}>
                {createVehicle.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Next <VideoIcon className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
              <QRLink url={window.location.href} />
            </div>
          </form>
        </Form>
      </CardContent>
    </>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 'password':
        return (
          <>
            <CardHeader>
              <CardTitle>Enter Upload Password</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(verifyPassword)} className="space-y-4">
                  <FormField
                    control={passwordForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Enter upload password"
                              {...field}
                            />
                          </FormControl>
                          <Button type="submit">
                            <Lock className="mr-2 h-4 w-4" />
                            Verify
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </CardContent>
          </>
        );

      case 'vin':
        return renderVinStep();

      case 'inspection':
        return (
          <InspectionForm 
            vin={vehicleForm.getValues('vin')} 
            onComplete={handleInspectionComplete} 
          />
        );

      case 'complete':
        return (
          <>
            <CardHeader>
              <CardTitle>Inspection Complete</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground">
                Vehicle inspection has been submitted successfully
              </p>
              <Button 
                className="mt-4 w-full"
                onClick={() => {
                  setCurrentStep('password');
                  passwordForm.reset();
                  vehicleForm.reset();
                }}
              >
                Inspect Another Vehicle
              </Button>
            </CardContent>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto">
        <Card>{renderStep()}</Card>
      </div>
    </div>
  );
}