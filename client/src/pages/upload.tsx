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
  const [password, setPassword] = useState("");
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [walkaroundVideo, setWalkaroundVideo] = useState<File | null>(null);
  const [isDecodingVin, setIsDecodingVin] = useState(false);

  const form = useForm({
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

  const verifyPassword = () => {
    if (password === "1211") {
      setCurrentStep('vin');
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

        // Update form with decoded vehicle information
        form.setValue("year", vehicleInfo.year);
        form.setValue("make", vehicleInfo.make);
        form.setValue("model", vehicleInfo.model);
        form.setValue("trim", vehicleInfo.trim);

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
        let uploadedVideos: string[] = [];

        if (walkaroundVideo) {
          setUploadingMedia(true);
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
          console.log("Video upload successful:", uploadedVideos);
        }

        // Create the vehicle with the video URL
        const vehicleData = {
          ...data,
          videos: uploadedVideos,
        };

        console.log('Creating vehicle with data:', vehicleData);
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
      form.reset();
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

  const handleNext = () => {
    switch (currentStep) {
      case 'vin':
        const vin = form.getValues('vin');
        if (vin.length !== 17) {
          toast({
            title: "Error",
            description: "Please enter a 17-digit VIN",
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
        createVehicle.mutate(form.getValues());
        break;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'password':
        return (
          <>
            <CardHeader>
              <CardTitle>Enter Upload Password</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <FormLabel>Password</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter upload password"
                    />
                    <Button onClick={verifyPassword}>
                      <Lock className="mr-2 h-4 w-4" />
                      Verify
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </>
        );

      case 'vin':
        return (
          <>
            <CardHeader>
              <CardTitle>Enter Vehicle VIN</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form className="space-y-4">
                  <FormField
                    control={form.control}
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
                                field.onChange(e);
                                handleVinChange(e.target.value);
                              }}
                              maxLength={17}
                              disabled={isDecodingVin}
                            />
                          </FormControl>
                          <VinScanner 
                            onScan={(vin) => {
                              field.onChange(vin);
                              handleVinChange(vin);
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

                  {/* Auto-populated fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
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
                      control={form.control}
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
                      control={form.control}
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
                      control={form.control}
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
                    <Button onClick={handleNext} className="md:flex-1">
                      Next <VideoIcon className="ml-2 h-4 w-4" />
                    </Button>
                    <QRLink url={window.location.href} />
                  </div>
                </form>
              </Form>
            </CardContent>
          </>
        );

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
                onClick={handleNext}
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
                  setPassword("");
                  form.reset();
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