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
import { uploadMedia } from "@/lib/upload";
import { FileUploader } from "@/components/ui/file-uploader";
import { Loader2, Upload } from "lucide-react";

export default function UploadPage() {
  const { toast } = useToast();
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<{
    images: File[];
    videos: File[];
  }>({
    images: [],
    videos: [],
  });

  const form = useForm({
    resolver: zodResolver(insertVehicleSchema),
    defaultValues: {
      vin: "",
      make: "",
      model: "",
      year: undefined,
      mileage: undefined,
      description: "",
      condition: "",
      images: [],
      videos: [],
    },
  });

  const createVehicle = useMutation({
    mutationFn: async (data: any) => {
      // First upload media files if any
      let uploadedImages: string[] = [];
      let uploadedVideos: string[] = [];

      if (mediaFiles.images.length || mediaFiles.videos.length) {
        setUploadingMedia(true);
        try {
          if (mediaFiles.images.length) {
            uploadedImages = await uploadMedia(mediaFiles.images);
          }
          if (mediaFiles.videos.length) {
            uploadedVideos = await uploadMedia(mediaFiles.videos);
          }
        } catch (error) {
          throw new Error("Failed to upload media files");
        } finally {
          setUploadingMedia(false);
        }
      }

      // Then create the vehicle with media URLs
      return apiRequest("POST", "/api/vehicles", {
        ...data,
        images: uploadedImages,
        videos: uploadedVideos,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Vehicle added to pricing queue",
      });
      form.reset();
      setMediaFiles({ images: [], videos: [] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add vehicle",
        variant: "destructive",
      });
    },
  });

  const handleMediaChange = (files: File[], type: "images" | "videos") => {
    setMediaFiles(prev => ({
      ...prev,
      [type]: files,
    }));
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Upload Vehicle</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => createVehicle.mutate(data))} className="space-y-6">
                <FormField
                  control={form.control}
                  name="vin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>VIN</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter VIN number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="make"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Make</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter make" {...field} />
                        </FormControl>
                        <FormMessage />
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
                          <Input placeholder="Enter model" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Year</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Enter year" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="mileage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mileage</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Enter mileage" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="condition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Condition</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter vehicle condition" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter vehicle description" 
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <div>
                    <FormLabel>Images</FormLabel>
                    <FileUploader
                      accept="image/*"
                      maxFiles={10}
                      onFilesSelected={(files) => handleMediaChange(files, "images")}
                    />
                  </div>

                  <div>
                    <FormLabel>Videos</FormLabel>
                    <FileUploader
                      accept="video/*"
                      maxFiles={3}
                      onFilesSelected={(files) => handleMediaChange(files, "videos")}
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={createVehicle.isPending || uploadingMedia}
                >
                  {(createVehicle.isPending || uploadingMedia) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {!uploadingMedia && <Upload className="mr-2 h-4 w-4" />}
                  Upload Vehicle
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
