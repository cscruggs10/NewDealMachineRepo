import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { vehicleInspectionSchema, VehicleInspection } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileUploader } from "@/components/ui/file-uploader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface InspectionFormProps {
  vin: string;
  onComplete?: () => void;
}

export function InspectionForm({ vin, onComplete }: InspectionFormProps) {
  const { toast } = useToast();
  const [uploadingVinPhoto, setUploadingVinPhoto] = useState(false);
  const [uploadingWalkaroundVideo, setUploadingWalkaroundVideo] = useState(false);
  const [uploadingMechanicalVideo, setUploadingMechanicalVideo] = useState(false);
  const [vinPhotoFile, setVinPhotoFile] = useState<File | null>(null);
  const [walkaroundVideoFile, setWalkaroundVideoFile] = useState<File | null>(null);
  const [mechanicalVideoFile, setMechanicalVideoFile] = useState<File | null>(null);

  const form = useForm<VehicleInspection>({
    resolver: zodResolver(vehicleInspectionSchema),
    defaultValues: {
      vin,
      inspectionStatus: "passed",
      cosmeticRepairEstimate: "0",
      mechanicalRepairEstimate: "0",
      inspectionNotes: "",
    },
  });

  const inspectionStatus = form.watch("inspectionStatus");

  const uploadMedia = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('files', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to upload media');
    }

    const urls = await response.json();
    return urls[0]; // Return the first URL
  };

  const submitInspection = useMutation({
    mutationFn: async (data: VehicleInspection) => {
      try {
        // Upload VIN photo if provided
        if (vinPhotoFile) {
          setUploadingVinPhoto(true);
          data.vinPhoto = await uploadMedia(vinPhotoFile);
          setUploadingVinPhoto(false);
        }

        // Upload walkaround video if provided
        if (walkaroundVideoFile) {
          setUploadingWalkaroundVideo(true);
          data.walkaroundVideo = await uploadMedia(walkaroundVideoFile);
          setUploadingWalkaroundVideo(false);
        }

        // Upload mechanical video if provided
        if (mechanicalVideoFile) {
          setUploadingMechanicalVideo(true);
          data.mechanicalVideo = await uploadMedia(mechanicalVideoFile);
          setUploadingMechanicalVideo(false);
        }

        // Submit inspection data
        return apiRequest("POST", `/api/vehicles/${vin}/inspection`, data);
      } catch (error) {
        console.error('Upload/submission error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Inspection Submitted",
        description: "Vehicle inspection has been successfully submitted.",
      });
      // Reset form state
      form.reset();
      setVinPhotoFile(null);
      setWalkaroundVideoFile(null);
      setMechanicalVideoFile(null);
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      // Call onComplete callback if provided
      if (onComplete) onComplete();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit inspection",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: VehicleInspection) => {
    if (!vinPhotoFile) {
      toast({
        title: "Error",
        description: "VIN/Auction run label photo is required",
        variant: "destructive",
      });
      return;
    }

    if (!walkaroundVideoFile) {
      toast({
        title: "Error",
        description: "Exterior/interior walkaround video is required",
        variant: "destructive",
      });
      return;
    }

    if (!mechanicalVideoFile) {
      toast({
        title: "Error",
        description: "Mechanical inspection video is required",
        variant: "destructive",
      });
      return;
    }

    submitInspection.mutate(data);
  };

  const isUploading = uploadingVinPhoto || uploadingWalkaroundVideo || uploadingMechanicalVideo;
  const isSubmitting = submitInspection.isPending || isUploading;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vehicle Inspection Form</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="vin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vehicle Identification Number (VIN)</FormLabel>
                  <FormControl>
                    <Input {...field} disabled />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Step 1: VIN/Auction Run Label Photo */}
            <div className="space-y-2">
              <h3 className="text-lg font-medium">1. VIN/Auction Run Label Photo</h3>
              <p className="text-sm text-muted-foreground">
                Upload a clear photo of the VIN plate or auction run label to verify the vehicle's identity.
              </p>
              <FileUploader
                accept="image/*"
                maxFiles={1}
                onFilesSelected={(files) => setVinPhotoFile(files[0])}
                className="mt-2"
              />
              {vinPhotoFile && (
                <p className="text-sm text-green-600">Photo selected: {vinPhotoFile.name}</p>
              )}
            </div>

            {/* Step 2: Exterior/Interior Walkaround Video */}
            <div className="space-y-2">
              <h3 className="text-lg font-medium">2. Exterior/Interior Walkaround Video</h3>
              <p className="text-sm text-muted-foreground">
                Record a video walkthrough of the vehicle's exterior and interior, pointing out any notable features or issues.
              </p>
              <FileUploader
                accept="video/*"
                maxFiles={1}
                onFilesSelected={(files) => setWalkaroundVideoFile(files[0])}
                className="mt-2"
              />
              {walkaroundVideoFile && (
                <p className="text-sm text-green-600">Video selected: {walkaroundVideoFile.name}</p>
              )}
            </div>

            {/* Step 3: Mechanical Inspection Video */}
            <div className="space-y-2">
              <h3 className="text-lg font-medium">3. Mechanical Inspection Video</h3>
              <p className="text-sm text-muted-foreground">
                Record a video with the car started, showing the engine bay, fluid levels, dashboard lights, radio, and HVAC operation.
              </p>
              <FileUploader
                accept="video/*"
                maxFiles={1}
                onFilesSelected={(files) => setMechanicalVideoFile(files[0])}
                className="mt-2"
              />
              {mechanicalVideoFile && (
                <p className="text-sm text-green-600">Video selected: {mechanicalVideoFile.name}</p>
              )}
            </div>

            {/* Step 4: Cosmetic Repair Estimate */}
            <FormField
              control={form.control}
              name="cosmeticRepairEstimate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>4. Cosmetic Repair Estimate ($)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Step 5: Mechanical Repair Estimate */}
            <FormField
              control={form.control}
              name="mechanicalRepairEstimate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>5. Mechanical Repair Estimate ($)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Step 6: Inspection Notes */}
            <FormField
              control={form.control}
              name="inspectionNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>6. Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter any additional notes about the vehicle's condition" 
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Step 7: Inspection Status */}
            <FormField
              control={form.control}
              name="inspectionStatus"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>7. Inspection Result</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="passed" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Pass
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="failed" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Fail
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Conditional Failure Reason */}
            {inspectionStatus === "failed" && (
              <FormField
                control={form.control}
                name="inspectionFailReason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason for Failure</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select reason for failure" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NOS">Not On Spot (NOS)</SelectItem>
                          <SelectItem value="Cosmetics">Cosmetics out of Range</SelectItem>
                          <SelectItem value="Mechanical">Mechanical out of Range</SelectItem>
                          <SelectItem value="VIN_Mismatch">VIN Mismatch</SelectItem>
                          <SelectItem value="Other">Other (Please explain)</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    {field.value === "Other" && (
                      <Textarea
                        placeholder="Please explain the reason for failure"
                        className="mt-2"
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isUploading ? "Uploading..." : "Submitting..."}
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Submit Inspection
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}