import { CheckCircle, Shield, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function CertificationInfo() {
  return (
    <div className="mb-8 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Vehicle Certification Levels</h3>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Deal Machine Certified */}
        <div className="flex items-start gap-4 p-4 bg-white rounded-lg border border-green-200 shadow-sm">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-green-600 hover:bg-green-700 text-white font-semibold px-3 py-1">
                Deal Machine Certified
              </Badge>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Premium certification with comprehensive inspection, detailed condition report, and Deal Machine quality guarantee.
            </p>
          </div>
        </div>

        {/* Auction Certified */}
        <div className="flex items-start gap-4 p-4 bg-white rounded-lg border border-blue-200 shadow-sm">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-1">
                Auction Certified
              </Badge>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Standard certification with basic inspection and condition assessment from trusted auction sources.
            </p>
          </div>
        </div>
      </div>
      
      {/* Documentation Link */}
      <div className="mt-6 text-center px-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => window.open("https://docs.google.com/document/d/1UVczLQASaFjTkevNn__X-c7z8TI29zdglNzHt7LCA4g/edit?tab=t.0", '_blank')}
          className="text-gray-600 hover:text-gray-900 border-gray-300 w-full sm:w-auto text-xs sm:text-sm"
        >
          <ExternalLink className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
          <span className="truncate">View Detailed Certification Documentation</span>
        </Button>
      </div>
    </div>
  );
}