import { Info, ExternalLink } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function CertificationInfo() {
  const documentationUrl = "https://docs.google.com/document/d/1UVczLQASaFjTkevNn__X-c7z8TI29zdglNzHt7LCA4g/edit?tab=t.0";

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Info className="h-5 w-5 text-primary" />
          <CardTitle>Vehicle Certification</CardTitle>
        </div>
        <CardDescription>Learn about our certification levels</CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => window.open(documentationUrl, '_blank')}
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          View Certification Documentation
        </Button>
      </CardContent>
    </Card>
  );
}