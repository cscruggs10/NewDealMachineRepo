import { Info, ExternalLink, CheckCircle2, AlertTriangle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Vehicle } from "@shared/schema";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

interface CertificationInfoProps {
  vehicle?: Vehicle;
}

export function CertificationInfo({ vehicle }: CertificationInfoProps) {
  const documentationUrl = "https://docs.google.com/document/d/1UVczLQASaFjTkevNn__X-c7z8TI29zdglNzHt7LCA4g/edit?tab=t.0";
  
  const inspectionStatus = vehicle?.inspectionStatus;
  const failReason = vehicle?.inspectionFailReason;
  const cosmeticEstimate = vehicle?.cosmeticRepairEstimate ? parseInt(vehicle.cosmeticRepairEstimate) : 0;
  const mechanicalEstimate = vehicle?.mechanicalRepairEstimate ? parseInt(vehicle.mechanicalRepairEstimate) : 0;
  const totalEstimate = cosmeticEstimate + mechanicalEstimate;

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Info className="h-5 w-5 text-primary" />
          <CardTitle>Vehicle Certification</CardTitle>
        </div>
        <CardDescription>Inspection and certification details</CardDescription>
        
        {vehicle && inspectionStatus && (
          <Badge 
            variant={inspectionStatus === "passed" ? "default" : inspectionStatus === "failed" ? "destructive" : "outline"}
            className="mt-2 py-1 px-3"
          >
            {inspectionStatus === "passed" ? (
              <span className="flex items-center">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Inspection Passed
              </span>
            ) : inspectionStatus === "failed" ? (
              <span className="flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1" />
                Inspection Failed
              </span>
            ) : (
              "Pending Inspection"
            )}
          </Badge>
        )}
      </CardHeader>
      
      <CardContent>
        {vehicle && inspectionStatus ? (
          <div className="space-y-4">
            {inspectionStatus === "passed" ? (
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="repair-estimates">
                  <AccordionTrigger>Repair Estimates</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="font-medium">Cosmetic Repair Estimate:</p>
                        <p className="text-muted-foreground">${cosmeticEstimate.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="font-medium">Mechanical Repair Estimate:</p>
                        <p className="text-muted-foreground">${mechanicalEstimate.toLocaleString()}</p>
                      </div>
                      <Separator />
                      <div>
                        <p className="font-medium">Total Estimated Repairs:</p>
                        <p className={cn(
                          "font-semibold",
                          totalEstimate > 2000 ? "text-red-500" : 
                          totalEstimate > 1000 ? "text-amber-500" : 
                          "text-green-500"
                        )}>
                          ${totalEstimate.toLocaleString()}
                        </p>
                      </div>
                      {vehicle.inspectionNotes && (
                        <div className="mt-2">
                          <p className="font-medium">Inspector Notes:</p>
                          <p className="text-muted-foreground whitespace-pre-line">{vehicle.inspectionNotes}</p>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            ) : inspectionStatus === "failed" && failReason ? (
              <div className="text-sm p-3 bg-destructive/10 rounded-md border border-destructive/20">
                <p className="font-medium">Reason for Failure:</p>
                <p className="text-destructive font-semibold">{failReason}</p>
                {vehicle.inspectionNotes && (
                  <>
                    <p className="font-medium mt-2">Additional Notes:</p>
                    <p className="text-muted-foreground whitespace-pre-line">{vehicle.inspectionNotes}</p>
                  </>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                This vehicle is awaiting inspection.
              </p>
            )}
            
            <div className="space-y-2">
              {vehicle.vinPhoto && (
                <div>
                  <a 
                    href={vehicle.vinPhoto} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center"
                  >
                    <ExternalLink className="mr-1 h-3 w-3" />
                    View VIN/Auction Run Label Photo
                  </a>
                </div>
              )}
              
              {vehicle.walkaroundVideo && (
                <div>
                  <a 
                    href={vehicle.walkaroundVideo} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center"
                  >
                    <ExternalLink className="mr-1 h-3 w-3" />
                    View Exterior/Interior Walkaround
                  </a>
                </div>
              )}
              
              {vehicle.mechanicalVideo && (
                <div>
                  <a 
                    href={vehicle.mechanicalVideo} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center"
                  >
                    <ExternalLink className="mr-1 h-3 w-3" />
                    View Mechanical Inspection
                  </a>
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mb-4">
            Learn more about our certification program and what it means for your vehicle purchase.
          </p>
        )}
      </CardContent>
      
      <CardFooter>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => window.open(documentationUrl, '_blank')}
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          View Certification Documentation
        </Button>
      </CardFooter>
    </Card>
  );
}