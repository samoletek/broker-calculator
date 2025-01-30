import { DollarSign } from 'lucide-react';

interface PriceBreakdownProps {
  distance: number;
  basePrice: number;
  basePriceBreakdown: {
    ratePerMile: number;
    distance: number;
    total: number;
  };
  mainMultipliers: {
    vehicle: number;
    weather: number;
    traffic: number;
    fuel: number;
    autoShow: number;
    totalMain: number;
  };
  additionalServices: {
    premium: number;
    special: number;
    inoperable: number;
    totalAdditional: number;
  };
  tollCosts?: {
    segments: Array<{
      location: string;
      cost: number;
    }>;
    total: number;
  };
  finalPrice: number;
  routeInfo?: {
    isPopularRoute: boolean;
    isRemoteArea: boolean;
  };
  selectedDate?: Date;
}

export const PriceBreakdown = ({
  distance,
  basePrice,
  basePriceBreakdown,
  mainMultipliers,
  additionalServices,
  tollCosts,
  finalPrice
}: PriceBreakdownProps) => {
  return (
    <div className="w-[1200px] p-40 space-y-40 bg-white rounded-[24px] border border-primary/10">
      {/* Header with mileage */}
      <div className="flex justify-between items-center">
        <h2 className="font-jost text-[32px] font-bold">Price Breakdown</h2>
        <span className="font-montserrat text-p2 text-gray-600">{distance} miles</span>
      </div>

      {/* Base Calculation */}
      <div className="p-24 space-y-16 bg-[#F6F6FA] rounded-[24px]">
        <h3 className="font-montserrat text-p2 font-bold">Base Calculation</h3>
        <div className="space-y-12">
          <div className="flex justify-between text-p2">
            <span className="text-gray-600">Rate per mile</span>
            <span>${basePriceBreakdown.ratePerMile.toFixed(2)}/mile</span>
          </div>
          <div className="flex justify-between text-p2">
            <span className="text-gray-600">Distance</span>
            <span>{Math.round(basePriceBreakdown.distance)} miles</span>
          </div>
          <div className="flex justify-between text-p2 pt-12 border-t border-gray-200">
            <span className="font-bold">Base Price</span>
            <span className="font-bold">${basePrice.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Supplemental Price Factors */}
      <div className="p-24 space-y-16 bg-primary/10 rounded-[24px]">
        <h3 className="font-montserrat text-p2 font-bold">Supplemental Price Factors</h3>
        <div className="space-y-12">
          {Object.entries(mainMultipliers).map(([key, value]) => 
            key !== 'totalMain' && (
              <div key={key} className="flex justify-between text-p2">
                <span className="text-gray-600">
                  {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')} Impact
                </span>
                <div className="flex items-center gap-8">
                  <span className="text-primary">
                    ${(basePrice * (value - 1)).toFixed(2)}
                  </span>
                  <span className="text-gray-500">
                    ({((value - 1) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            )
          )}
          <div className="flex justify-between text-p2 pt-12 border-t border-gray-200">
            <span className="font-bold">Total Factors Impact</span>
            <span className="text-[#1356BE] font-bold">
              ${(basePrice * (mainMultipliers.totalMain - 1)).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Toll Charges */}
      <div className="p-24 space-y-16 bg-primary/20 rounded-[24px]">
        <h3 className="font-montserrat text-p2 font-bold">Toll Charges</h3>
        <div className="space-y-12">
          {tollCosts?.segments.map((segment, index) => (
            <div key={index} className="flex justify-between text-p2">
              <span className="text-gray-600">{segment.location}</span>
              <span className="text-[#1356BE]">${segment.cost.toFixed(2)}</span>
            </div>
          ))}
          <div className="flex justify-between text-p2 pt-12 border-t border-gray-200">
          <span className="font-bold">Total Toll Costs</span>
            <span className="text-[#1356BE] font-bold">
              ${tollCosts?.total.toFixed(2) || '0.00'}
            </span>
          </div>
        </div>
      </div>

      {/* Final Price */}
      <div className="p-24 flex justify-between items-center bg-primary rounded-[24px] text-white">
        <div className="flex items-center gap-8">
          <DollarSign className="w-20 h-20" />
          <span className="font-montserrat font-bold text-p2">Final Price</span>
        </div>
        <span className="font-montserrat text-p2 font-bold">
          ${finalPrice.toFixed(2)}
        </span>
      </div>
    </div>
  );
};