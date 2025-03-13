import { z } from "zod";

interface VehicleInfo {
  year: string;
  make: string;
  model: string;
  trim: string;
}

export const vinSchema = z.string().length(17, "VIN must be 17 characters");

export async function decodeVIN(vin: string): Promise<VehicleInfo> {
  try {
    const response = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vin}?format=json`
    );
    
    if (!response.ok) {
      throw new Error('Failed to decode VIN');
    }

    const data = await response.json();
    
    // Extract relevant information from the NHTSA response
    const results = data.Results;
    const vehicleInfo: VehicleInfo = {
      year: results.find((item: any) => item.Variable === "Model Year")?.Value || "",
      make: results.find((item: any) => item.Variable === "Make")?.Value || "",
      model: results.find((item: any) => item.Variable === "Model")?.Value || "",
      trim: results.find((item: any) => item.Variable === "Trim")?.Value || "",
    };

    return vehicleInfo;
  } catch (error) {
    console.error('Error decoding VIN:', error);
    throw new Error('Failed to decode VIN');
  }
}
