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
import { Loader2, Upload, VideoIcon } from "lucide-react";

type UploadStep = 'vin' | 'video' | 'complete';

export default function UploadPage() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<UploadStep>('vin');
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [walkaroundVideo, setWalkaroundVideo] = useState<File | null>(null);

  const form = useForm({
    resolver: zodResolver(createInitialVehicleSchema),
    defaultValues: {
      vin: "",
      videos: [],
    },
  });

  const createVehicle = useMutation({
    mutationFn: async (data: any) => {
      try {
        let uploadedVideos: string[] = [];

        if (walkaroundVideo) {
          setUploadingMedia(true);
          // Mock upload - in production this would be a real file upload
          const response = await fetch('/api/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ filename: walkaroundVideo.name })
          });

          if (!response.ok) {
            throw new Error('Failed to upload video');
          }

          const urls = await response.json();
          uploadedVideos = urls;
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
        if (vin.length !== 8) {
          toast({
            title: "Error",
            description: "Please enter the last 8 digits of the VIN",
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
                        <FormLabel>Last 8 Digits of VIN</FormLabel>
                        <FormControl>
                          <Input maxLength={8} placeholder="Enter last 8 digits" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button onClick={handleNext}>
                    Next <VideoIcon className="ml-2 h-4 w-4" />
                  </Button>
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
                  setCurrentStep('vin');
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