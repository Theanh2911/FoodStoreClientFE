"use client";

import * as React from "react";
import { DashboardNav } from "@/components/dashboard-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, CreditCard, QrCode, Building, User, Hash, CheckCircle, Loader2 } from "lucide-react";
import { apiService, BankAccount } from "@/lib/api";

export default function ThanhToanPage() {
  const [copiedField, setCopiedField] = React.useState<string | null>(null);
  const [bankAccount, setBankAccount] = React.useState<BankAccount | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Fetch bank account information on mount
  React.useEffect(() => {
    const fetchBankAccount = async () => {
      try {
        setIsLoading(true);
        console.log('Fetching bank account from API...');
        const response = await apiService.getActiveBankAccount();
        console.log('API Response:', response);
        
        if (response.error) {
          console.error('API Error:', response.error);
          setError('Không thể tải thông tin tài khoản ngân hàng');
          return;
        }
        
        // Handle if API returns an array instead of single object
        let bankData = response.data;
        if (Array.isArray(response.data)) {
          console.log('API returned array, taking first item');
          if (response.data.length === 0) {
            setError('Không có tài khoản ngân hàng');
            return;
          }
          bankData = response.data[0];
        }
        
        // Check if data exists and has required fields
        if (!bankData || !bankData.bankName) {
          console.error('Invalid data structure:', bankData);
          setError('Dữ liệu không hợp lệ');
          return;
        }
        
        // Only set if status is ACTIVE
        if (bankData.status === 'ACTIVE') {
          console.log('Bank account loaded successfully:', bankData);
          setBankAccount(bankData);
        } else {
          console.warn('Bank account is not active:', bankData.status);
          setError('Không có tài khoản ngân hàng hoạt động');
        }
      } catch (err) {
        console.error('Error fetching bank account:', err);
        setError('Có lỗi xảy ra khi tải thông tin');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBankAccount();
  }, []);

  // Copy to clipboard function
  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      // Failed to copy
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardNav />
        <main className="container mx-auto p-3 sm:p-4 lg:p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
              <p className="text-gray-600">Đang tải thông tin thanh toán...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Show error state
  if (error || !bankAccount) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardNav />
        <main className="container mx-auto p-3 sm:p-4 lg:p-6">
          <Card>
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                {error || 'Không tìm thấy thông tin tài khoản'}
              </h3>
              <p className="text-gray-600">
                Vui lòng thử lại sau hoặc liên hệ quản trị viên
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

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
                    onClick={() => copyToClipboard(bankAccount.accountNumber, 'account')}
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
                  {bankAccount.accountNumber}
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
                    onClick={() => copyToClipboard(bankAccount.bankName, 'bank')}
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
                  {bankAccount.bankName}
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
                    onClick={() => copyToClipboard(bankAccount.accountHolder, 'name')}
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
                  {bankAccount.accountHolder}
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
                {bankAccount.qrCodeImageUrl ? (
                  <div className="flex justify-center">
                    <div className="p-4 bg-white rounded-lg shadow-sm border">
                      <img
                        src={bankAccount.qrCodeImageUrl}
                        alt="QR Code thanh toán"
                        className="w-48 h-48 mx-auto object-contain"
                        onError={(e) => {
                          // Fallback if image fails to load
                          e.currentTarget.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY2NzM4NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkxvaSDhuqNuaDwvdGV4dD48L3N2Zz4=";
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-center">
                    <div className="p-8 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
                      <QrCode className="h-32 w-32 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">Chưa có mã QR</p>
                    </div>
                  </div>
                )}

                {/* QR Instructions */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">
                    {bankAccount.qrCodeImageUrl ? 'Quét mã QR để thanh toán' : 'Vui lòng chuyển khoản theo thông tin bên trái'}
                  </h3>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </main>
    </div>
  );
}


