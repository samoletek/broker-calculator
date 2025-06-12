import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/app/lib/utils/api/rateLimit';

interface EIAFuelPrice {
  duoarea: string;
  stateDescription: string;
  value: string; // EIA API returns price as string
  period: string;
}

interface EIAResponse {
  response: {
    data: EIAFuelPrice[];
    total: number;
  };
}

const getHandler = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const paddCodes = searchParams.getAll('paddCodes');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if (!paddCodes.length || !startDate || !endDate) {
    return NextResponse.json(
      { error: 'Missing required parameters: paddCodes, startDate, endDate' },
      { status: 400 }
    );
  }

  try {
    // Expand date range to find nearest available data
    const expandedStartDate = new Date(startDate);
    expandedStartDate.setDate(expandedStartDate.getDate() - 14); // 2 weeks earlier
    
    const expandedEndDate = new Date(endDate);
    expandedEndDate.setDate(expandedEndDate.getDate() + 14); // 2 weeks later

    const paddParams = paddCodes.map(padd => `facets[duoarea][]=${padd}`).join('&');
    const url = `https://api.eia.gov/v2/petroleum/pri/gnd/data?api_key=${process.env.EIA_API_KEY}&frequency=weekly&data[]=value&${paddParams}&facets[product][]=EPD2DXL0&start=${expandedStartDate.toISOString().split('T')[0]}&end=${expandedEndDate.toISOString().split('T')[0]}&sort[0][column]=period&sort[0][direction]=desc&length=5`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`EIA API error: ${response.status}`);
    }

    const data: EIAResponse = await response.json();
    
    return NextResponse.json({
      success: true,
      data: data.response.data || [],
      total: data.response.total || 0
    });

  } catch (error) {
    console.error('Error fetching EIA fuel data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch fuel price data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};

export const GET = withRateLimit(getHandler, 'fuel');