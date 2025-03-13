import { QRCodeCanvas } from 'qrcode.react';
import { Card, CardContent, CardHeader, CardTitle } from "./card";

interface QRLinkProps {
  url: string;
}

export function QRLink({ url }: QRLinkProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Scan to Open on Phone</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <QRCodeCanvas
          value={url}
          size={200}
          level="H"
          includeMargin
        />
        <p className="mt-4 text-sm text-muted-foreground">
          Scan this QR code with your phone's camera to open the VIN scanner
        </p>
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="mt-2 text-sm text-primary hover:underline"
        >
          Or click here to open directly
        </a>
      </CardContent>
    </Card>
  );
}
