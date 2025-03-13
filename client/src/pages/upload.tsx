import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertVehicleSchema } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { uploadMedia } from "@/lib/upload"; //Import the missing function.
import { FileUploader } from "@/components/ui/file-uploader";
import { Loader2, Upload, Camera, VideoIcon } from "lucide-react";

type UploadStep = 'vin' | 'video' | 'damage' | 'complete';

export default function UploadPage() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<UploadStep>('vin');
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [damagePhotos, setDamagePhotos] = useState<File[]>([]);
  const [walkaroundVideo, setWalkaroundVideo] = useState<File | null>(null);
  const [damageNotes, setDamageNotes] = useState('');

  const form = useForm({
    resolver: zodResolver(insertVehicleSchema),
    defaultValues: {
      vin: "",
      description: "",
      images: [],
      videos: [],
    },
  });

  const createVehicle = useMutation({
    mutationFn: async (data: any) => {
      let uploadedImages: string[] = [];
      let uploadedVideos: string[] = [];

      if (damagePhotos.length || walkaroundVideo) {
        setUploadingMedia(true);
        try {
          if (damagePhotos.length) {
            uploadedImages = await uploadMedia(damagePhotos);
          }
          if (walkaroundVideo) {
            uploadedVideos = await uploadMedia([walkaroundVideo]);
          }
        } catch (error) {
          throw new Error("Failed to upload media files");
        } finally {
          setUploadingMedia(false);
        }
      }

      return apiRequest("POST", "/api/vehicles", {
        ...data,
        description: damageNotes,
        images: uploadedImages,
        videos: uploadedVideos,
        inQueue: true,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Vehicle added to queue for review",
      });
      form.reset();
      setCurrentStep('complete');
      setDamagePhotos([]);
      setWalkaroundVideo(null);
      setDamageNotes('');
    },
    onError: (error) => {
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
        setCurrentStep('damage');
        break;
      case 'damage':
        if (damagePhotos.length > 0 && !damageNotes) {
          toast({
            title: "Error",
            description: "Please add notes describing the damage",
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
              <FileUploader
                accept="video/*"
                maxFiles={1}
                onFilesSelected={(files) => setWalkaroundVideo(files[0])}
              />
              <Button onClick={handleNext}>
                Next <Camera className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </>
        );

      case 'damage':
        return (
          <>
            <CardHeader>
              <CardTitle>Damage Documentation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FileUploader
                accept="image/*"
                maxFiles={10}
                onFilesSelected={setDamagePhotos}
              />
              {damagePhotos.length > 0 && (
                <Textarea
                  placeholder="Describe the damage shown in the photos"
                  value={damageNotes}
                  onChange={(e) => setDamageNotes(e.target.value)}
                />
              )}
              <Button 
                onClick={handleNext}
                disabled={createVehicle.isPending || uploadingMedia}
              >
                {(createVehicle.isPending || uploadingMedia) ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                Submit for Review
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