import { Info } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function CertificationInfo() {
  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Info className="h-5 w-5 text-primary" />
          <CardTitle>Vehicle Certification Types</CardTitle>
        </div>
        <CardDescription>Understanding our certification process</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="font-semibold text-lg mb-2 text-primary">Deal Machine Certified</h3>
            <ul className="list-disc pl-4 space-y-2 text-sm text-muted-foreground">
              <li>Full mechanical inspection completed</li>
              <li>All mechanical issues documented</li>
              <li>Known repairs needed are disclosed</li>
              <li>Vehicle history report included</li>
              <li>Interior/exterior condition documented</li>
              <li>Recent service records available</li>
              <li>Highest level of transparency</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2 text-primary">Auction Certified</h3>
            <ul className="list-disc pl-4 space-y-2 text-sm text-muted-foreground">
              <li>Basic mechanical check performed</li>
              <li>Major mechanical issues documented</li>
              <li>Recent auction condition report</li>
              <li>Limited vehicle history available</li>
              <li>Basic condition assessment</li>
              <li>As-is documentation from auction</li>
              <li>Standard level of transparency</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
