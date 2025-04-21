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
import { FileUploader } from "@/components/ui/file-uploader";
import { Loader2, Upload, VideoIcon, Lock } from "lucide-react";
import { decodeVIN, vinSchema } from "@/lib/vin";
import { VinScanner } from "@/components/scanner/VinScanner";
import { QRLink } from "@/components/ui/qr-link";

type UploadStep = 'password' | 'vin' | 'video' | 'complete';

export default function UploadPage() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<UploadStep>('password');
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [walkaroundVideo, setWalkaroundVideo] = useState<File | null>(null);
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
      try {
        setUploadingMedia(true);
        let uploadedVideos: string[] = [];

        if (walkaroundVideo) {
          const formData = new FormData();
          formData.append('files', walkaroundVideo);

          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to upload video');
          }

          const urls = await response.json();
          uploadedVideos = urls;
        }

        const vehicleData = {
          ...data,
          videos: uploadedVideos,
        };

        return apiRequest("POST", "/api/vehicles", vehicleData);
      } catch (error) {
        console.error('Upload/creation error:', error);
        throw error;
      } finally {
        setUploadingMedia(false);
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Vehicle added to queue for review",
      });
      vehicleForm.reset();
      setCurrentStep('complete');
      setWalkaroundVideo(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add vehicle",
        variant: "destructive",
      });
    },
  });

  const handleNext = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    switch (currentStep) {
      case 'vin':
        const vin = vehicleForm.getValues('vin');
        if (!vin || vin.length !== 17) {
          toast({
            title: "Error",
            description: "Please enter a valid 17-digit VIN",
            variant: "destructive",
          });
          return;
        }
        setCurrentStep('video');
        break;
      case 'video':
        if (!walkaroundVideo) {
          toast({
            title: "Error",
            description: "Please upload a walkaround video",
            variant: "destructive",
          });
          return;
        }
        createVehicle.mutate(vehicleForm.getValues());
        break;
    }
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
              <Button type="submit" className="md:flex-1">
                Next <VideoIcon className="ml-2 h-4 w-4" />
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

      case 'video':
        return (
          <>
            <CardHeader>
              <CardTitle>Vehicle Walkaround Video</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Please include footage of any damage in your walkthrough video
              </p>
              <FileUploader
                accept="video/*"
                maxFiles={1}
                onFilesSelected={(files) => setWalkaroundVideo(files[0])}
              />
              <Button 
                onClick={() => handleNext()}
                disabled={createVehicle.isPending || uploadingMedia}
              >
                {(createVehicle.isPending || uploadingMedia) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Submit for Review
                  </>
                )}
              </Button>
            </CardContent>
          </>
        );

      case 'complete':
        return (
          <>
            <CardHeader>
              <CardTitle>Upload Complete</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground">
                Vehicle has been added to the queue for review
              </p>
              <Button 
                className="mt-4 w-full"
                onClick={() => {
                  setCurrentStep('password');
                  passwordForm.reset();
                  vehicleForm.reset();
                }}
              >
                Upload Another Vehicle
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