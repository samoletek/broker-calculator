'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/app/components/ui/Accordion';
import type { PriceBreakdownProps } from '@/app/types/components.types';

export function PriceBreakdown({
  distance,
  basePrice,
  basePriceBreakdown,
  mainMultipliers,
  additionalServices,
  tollCosts,
  finalPrice
}: PriceBreakdownProps) {
  // Вычисляем общую сумму Supplemental Price Factors, включая cardFee
  const supplementalTotal = mainMultipliers.totalImpact + mainMultipliers.cardFee;

  return (
    <div className="w-full p-4 sm:p-40 space-y-10 sm:space-y-20 bg-white rounded-[24px] border border-primary/10">
      <div className="flex justify-between items-center">
        <h2 className="font-jost text-[32px] font-bold">Price Breakdown</h2>
      </div>
   
      {/* Base Calculation */}
      <Accordion type="single" collapsible>
        <AccordionItem value="base">
          <div className="bg-[#F6F6FA] rounded-[24px] overflow-hidden">
            <AccordionTrigger className="w-full p-24 hover:no-underline">
              <div className="flex justify-between w-full">
                <span className="font-montserrat text-p2 font-bold">Base Calculation</span>
                <span className="font-montserrat text-p2 text-gray-600">${(basePrice + (basePrice * additionalServices.totalAdditional)).toFixed(2)}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="border-t border-primary/20 mx-24"></div>
              <div className="p-24 space-y-12">
                <div className="flex justify-between text-p2">
                  <span className="text-gray-600">Rate per mile</span>
                  <span>${basePriceBreakdown.ratePerMile.toFixed(2)}/mile</span>
                </div>
                <div className="flex justify-between text-p2">
                  <span className="text-gray-600">Distance</span>
                  <span>{Math.round(basePriceBreakdown.distance)} miles</span>
                </div>
                
                {/* Дополнительные услуги внутри базовой цены */}
                {additionalServices.premium > 0 && (
                  <div className="flex justify-between text-p2">
                    <span className="text-gray-600">Premium Enhancements</span>
                    <span className="text-primary">${(basePrice * additionalServices.premium).toFixed(2)}</span>
                  </div>
                )}
                {additionalServices.special > 0 && (
                  <div className="flex justify-between text-p2">
                    <span className="text-gray-600">Special Load</span>
                    <span className="text-primary">${(basePrice * additionalServices.special).toFixed(2)}</span>
                  </div>
                )}
                {additionalServices.inoperable > 0 && (
                  <div className="flex justify-between text-p2">
                    <span className="text-gray-600">Inoperable Vehicle</span>
                    <span className="text-primary">${(basePrice * additionalServices.inoperable).toFixed(2)}</span>
                  </div>
                )}
                {additionalServices.hasManagerDefined && (
                  <div className="flex justify-between text-p2">
                    <span className="text-gray-600">Supplementary Insurance</span>
                    <span className="text-primary font-bold">To be quoted by manager</span>
                  </div>
                )}
                
                {basePriceBreakdown.distance < 300 && (
                  <div className="text-sm text-gray-500">
                    * Base price is fixed because the route is shorter than 300 miles.
                  </div>
                )}
              </div>
            </AccordionContent>
          </div>
        </AccordionItem>
      </Accordion>
   
      {/* Supplemental Price Factors */}
      <Accordion type="single" collapsible>
        <AccordionItem value="supplemental">
          <div className="bg-primary/10 rounded-[24px] overflow-hidden">
            <AccordionTrigger className="w-full p-24 hover:no-underline">
              <div className="flex justify-between w-full">
                <span className="font-montserrat text-p2 font-bold">Supplemental Price Factors</span>
                <span className="font-montserrat text-p2 text-[#1356BE]">${supplementalTotal.toFixed(2)}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="border-t border-primary/20 mx-24"></div>
              <div className="p-24 space-y-12">
                <div className="flex justify-between text-p2">
                  <span className="text-gray-600">Vehicle Impact</span>
                  <span className="text-primary">${mainMultipliers.vehicleImpact.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-p2">
                  <span className="text-gray-600">Weather Impact</span>
                  <span className="text-primary">${mainMultipliers.weatherImpact.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-p2">
                  <span className="text-gray-600">Traffic Impact</span>
                  <span className="text-primary">${mainMultipliers.trafficImpact.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-p2">
                  <span className="text-gray-600">Auto Show Impact</span>
                  <span className="text-primary">${mainMultipliers.autoShowImpact.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-p2">
                  <span className="text-gray-600">Fuel Impact</span>
                  <span className="text-primary">${mainMultipliers.fuelImpact.toFixed(2)}</span>
                </div>
                {mainMultipliers.cardFee > 0 && (
                  <div className="flex justify-between text-p2">
                    <span className="text-gray-600">Credit Card Fee (3%)</span>
                    <span className="text-primary">${mainMultipliers.cardFee.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </AccordionContent>
          </div>
        </AccordionItem>
      </Accordion>
   
      {/* Toll Charges */}
      {tollCosts && (
        <Accordion type="single" collapsible>
          <AccordionItem value="tolls">
            <div className="bg-primary/20 rounded-[24px] overflow-hidden">
              <AccordionTrigger className="w-full p-24 hover:no-underline">
                <div className="flex justify-between w-full">
                  <span className="font-montserrat text-p2 font-bold">Toll Charges</span>
                  <span className="font-montserrat text-p2 text-[#1356BE]">${tollCosts.total.toFixed(2)}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="border-t border-primary/20 mx-24"></div>
                <div className="p-24 space-y-12">
                  {tollCosts.segments.map((segment, index) => (
                    <div key={index} className="flex justify-between text-p2">
                      <span className="text-gray-600">{segment.location}</span>
                      <span className="text-[#1356BE]">${segment.cost.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </div>
          </AccordionItem>
        </Accordion>
      )}
   
      {/* Final Price */}
      <div className="p-24 flex justify-between items-center bg-primary rounded-[24px] text-white">
        <div className="flex items-center gap-8">
          <span className="font-montserrat font-bold text-p2">Final Price</span>
        </div>
        <span className="font-montserrat text-p2 font-bold">
          ${finalPrice.toFixed(2)}
        </span>
      </div>
    </div>
  );
}