"use client";

import { useState } from 'react';
import { testWeatherApi, testTrafficApi, testGoogleMapsApi } from '@/utils/api';

export default function TestPage() {
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    const testAddress = "123 Main St, New York, NY";
    const testLat = 40.7128;
    const testLng = -74.0060;

    // Test Weather API
    const weatherResult = await testWeatherApi(testLat, testLng);
    
    // Test Traffic API
    const trafficResult = await testTrafficApi(testLat, testLng);
    
    // Test Google Maps API
    const mapsResult = await testGoogleMapsApi(testAddress);

    setResults({
      weather: weatherResult,
      traffic: trafficResult,
      maps: mapsResult
    });
    setLoading(false);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">API Tests</h1>
      
      <button
        onClick={runTests}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        {loading ? 'Testing...' : 'Run API Tests'}
      </button>

      {Object.entries(results).map(([api, result]) => (
        <div key={api} className="mt-4 p-4 border rounded">
          <h2 className="text-xl font-semibold mb-2">{api} API</h2>
          <pre className="bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      ))}
    </div>
  );
}