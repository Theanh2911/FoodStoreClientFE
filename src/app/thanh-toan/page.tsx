"use client";

import * as React from "react";
import { DashboardNav } from "@/components/dashboard-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, CreditCard, QrCode, Building, User, Hash, CheckCircle } from "lucide-react";

export default function ThanhToanPage() {
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  // Sample bank account information - replace with real data
  const accountInfo = {
    accountNumber: "696291102",
    bankName: "Ngân hàng Quân đội (MB Bank)",
    accountHolderName: "NGUYEN THE ANH",
    bankCode: "MB"
  };

  // Generate QR code URL - you can use a QR code service or library
  const qrCodeData = `Banking|${accountInfo.bankCode}|${accountInfo.accountNumber}|${accountInfo.accountHolderName}`;
  // For demo purposes, using a placeholder QR code service
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeData)}`;

  // Copy to clipboard function
  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav />
      
      <main className="container mx-auto p-3 sm:p-4 lg:p-6">
        {/* Header */}
        <div className="mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Thanh toán
            </h1>
            <p className="text-gray-600">
              Thông tin tài khoản ngân hàng và mã QR thanh toán
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Account Information Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Thông tin tài khoản
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Account Number */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Hash className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Số tài khoản</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(accountInfo.accountNumber, 'account')}
                    className="h-6 px-2"
                  >
                    {copiedField === 'account' ? (
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                <p className="text-lg font-mono font-bold text-gray-900 mt-1">
                  {accountInfo.accountNumber}
                </p>
              </div>

              {/* Bank Name */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Building className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Ngân hàng</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(accountInfo.bankName, 'bank')}
                    className="h-6 px-2"
                  >
                    {copiedField === 'bank' ? (
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {accountInfo.bankName}
                </p>
              </div>

              {/* Account Holder Name */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Tên chủ tài khoản</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(accountInfo.accountHolderName, 'name')}
                    className="h-6 px-2"
                  >
                    {copiedField === 'name' ? (
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                <p className="text-base font-bold text-gray-900 mt-1">
                  {accountInfo.accountHolderName}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* QR Code Payment Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <QrCode className="h-5 w-5 mr-2" />
                Thanh toán bằng QR
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                {/* QR Code */}
                <div className="flex justify-center">
                  <div className="p-4 bg-white rounded-lg shadow-sm border">
                    <img
                      src={qrCodeUrl}
                      alt="QR Code thanh toán"
                      className="w-48 h-48 mx-auto"
                      onError={(e) => {
                        // Fallback if QR service fails
                        e.currentTarget.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY2NzM4NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk1hIFFSPC90ZXh0Pjwvc3ZnPg==";
                      }}
                    />
                  </div>
                </div>

                {/* QR Instructions */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">
                    Quét mã QR để thanh toán
                  </h3>
                </div>

                {/* Copy QR Data Button */}
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(qrCodeData, 'qr')}
                  className="w-full"
                >
                  {copiedField === 'qr' ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                      Đã sao chép!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Sao chép thông tin QR
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

      </main>
    </div>
  );
}


