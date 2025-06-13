// src/app/api/lead/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import type { AWSLeadData } from '@/app/lib/utils/client/awsLeadMapper';
import { APIErrorHandler } from '@/app/lib/utils/api/errorHandler';
import { withRateLimit } from '@/app/lib/utils/api/rateLimit';

// AWS Lambda endpoint URL from environment variable
const AWS_LEAD_ENDPOINT = process.env.AWS_LEAD_ENDPOINT;

const postHandler = async (request: NextRequest) => {
  console.log('Lead API endpoint called');
  
  // Check if endpoint is configured
  if (!AWS_LEAD_ENDPOINT) {
    return APIErrorHandler.handleMissingConfig('AWS Lead Endpoint');
  }
  
  try {
    // Parse request body
    const body = await request.json() as AWSLeadData;
    
    // Basic validation
    if (!body.Id || !body.client?.EMail || !body.Quote) {
      return APIErrorHandler.handleValidationError(
        'Missing required lead data: ID, email, or quote information'
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
      return APIErrorHandler.handleError(awsError);
    }
    
  } catch (error) {
    return APIErrorHandler.handleError(error);
  }
};

export const POST = withRateLimit(postHandler, 'lead');