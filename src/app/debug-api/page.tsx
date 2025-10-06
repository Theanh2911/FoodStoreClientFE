"use client";

import * as React from "react";
import { DashboardNav } from "@/components/dashboard-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiService } from "@/lib/api";

// Get the API base URL from the api service
const API_BASE_URL = 'http://192.168.1.13:8080/api';
const BACKEND_BASE_URL = 'http://192.168.1.13:8080';

export default function DebugApiPage() {
  const [results, setResults] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  const addResult = (test: string, success: boolean, data: any) => {
    const result = {
      test,
      success,
      data,
      timestamp: new Date().toLocaleTimeString()
    };
    setResults(prev => [result, ...prev]);
  };

  const testApiConnection = async () => {
    setIsLoading(true);
    setResults([]);

    // Test 1: Basic API endpoint
    try {
      console.log('Testing API connection...');
      const response = await fetch(`${API_BASE_URL}/menu/products/getAll`);
      
      if (response.ok) {
        const data = await response.json();
        addResult('Direct fetch to backend', true, `Success: ${data.length} products found`);
      } else {
        addResult('Direct fetch to backend', false, `HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      addResult('Direct fetch to backend', false, `Error: ${error}`);
    }

    // Test 2: API Service
    try {
      const result = await apiService.getAllProducts();
      if (result.error) {
        addResult('API Service getAllProducts', false, `Error: ${result.error}`);
      } else {
        addResult('API Service getAllProducts', true, `Success: ${result.data.length} products`);
      }
    } catch (error) {
      addResult('API Service getAllProducts', false, `Error: ${error}`);
    }

    // Test 3: Network connectivity
    try {
      const response = await fetch(BACKEND_BASE_URL);
      addResult('Backend server connectivity', true, `Server responding: ${response.status}`);
    } catch (error) {
      addResult('Backend server connectivity', false, `Cannot reach server: ${error}`);
    }

    // Test 4: Mobile-specific API endpoint
    try {
      const response = await fetch(`${API_BASE_URL}/menu/products/getAll`);
      
      if (response.ok) {
        const data = await response.json();
        addResult('Mobile API access', true, `Success: ${data.length} products found`);
      } else {
        addResult('Mobile API access', false, `HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      addResult('Mobile API access', false, `Error: ${error}`);
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav />
      
      <main className="container mx-auto p-3 sm:p-4 lg:p-6">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            API Debug Tool
          </h1>
          <p className="text-gray-600">
            Test the connection between frontend (port 3001) and backend (port 8080)
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Connection Test</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testApiConnection}
              disabled={isLoading}
              className="mb-4"
            >
              {isLoading ? 'Testing...' : 'Run API Tests'}
            </Button>

            <div className="space-y-2">
              <p><strong>Frontend URL:</strong> http://localhost:3001</p>
              <p><strong>Backend URL:</strong> {BACKEND_BASE_URL}</p>
              <p><strong>API Base:</strong> {API_BASE_URL}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <p className="text-gray-500">No tests run yet. Click "Run API Tests" to start.</p>
            ) : (
              <div className="space-y-3">
                {results.map((result, index) => (
                  <div 
                    key={index}
                    className={`p-3 rounded border-l-4 ${
                      result.success 
                        ? 'bg-green-50 border-green-400' 
                        : 'bg-red-50 border-red-400'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{result.test}</h4>
                        <p className={`text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                          {result.data}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500">{result.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Troubleshooting Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">1. Check Browser Console</h4>
                <p className="text-sm text-gray-600">Open F12 → Console tab and look for CORS errors</p>
              </div>
              
              <div>
                <h4 className="font-medium">2. Verify Backend is Running</h4>
                <p className="text-sm text-gray-600">
                  Test: <code className="bg-gray-100 px-1 rounded">{BACKEND_BASE_URL}</code>
                </p>
              </div>

              <div>
                <h4 className="font-medium">3. Check Spring Boot CORS</h4>
                <p className="text-sm text-gray-600">Add CORS configuration to allow localhost:3001</p>
              </div>

              <div>
                <h4 className="font-medium">4. Network Tab</h4>
                <p className="text-sm text-gray-600">F12 → Network tab → See failed requests and their status codes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

