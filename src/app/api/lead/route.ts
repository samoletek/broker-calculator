// src/app/api/lead/route.ts
import { NextResponse } from 'next/server';
import axios from 'axios';
import type { AWSLeadData } from '@/app/lib/utils/client/awsLeadMapper';

// AWS Lambda endpoint URL from environment variable
const AWS_LEAD_ENDPOINT = process.env.AWS_LEAD_ENDPOINT;

export async function POST(request: Request) {
  console.log('Lead API endpoint called');
  
  // Check if endpoint is configured
  if (!AWS_LEAD_ENDPOINT) {
    console.error('AWS_LEAD_ENDPOINT is not configured');
    return NextResponse.json(
      { success: false, message: 'AWS endpoint not configured' },
      { status: 500 }
    );
  }
  
  try {
    // Parse request body
    const body = await request.json() as AWSLeadData;
    
    // Basic validation
    if (!body.Id || !body.client?.EMail || !body.Quote) {
      console.error('Missing required lead data');
      return NextResponse.json(
        { success: false, message: 'Missing required data' },
        { status: 400 }
      );
    }
    
    console.log('Sending lead to AWS:', {
      id: body.Id,
      email: body.client.EMail,
      quote: body.Quote,
      calculationHash: body.Hash
    });
    
    try {
      // Send to AWS Lambda
      const response = await axios.post(AWS_LEAD_ENDPOINT, body, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000 // 10 seconds timeout
      });
      
      console.log('AWS Lambda response:', response.status, response.data);
      
      return NextResponse.json({
        success: true,
        message: 'Lead successfully sent to AWS',
        leadId: body.Id,
        awsResponse: response.data
      });
      
    } catch (awsError) {
      console.error('AWS Lambda error:', awsError);
      
      // Don't fail the whole operation if AWS is down
      // We can implement a retry queue later
      return NextResponse.json({
        success: false,
        message: 'Failed to send lead to AWS, but calculation saved locally',
        error: awsError instanceof Error ? awsError.message : 'Unknown error'
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Error in lead route:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to process lead data'
      },
      { status: 500 }
    );
  }
}