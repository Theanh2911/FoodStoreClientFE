"use client";

import * as React from "react";
import { DashboardNav } from "@/components/dashboard-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Copy, CreditCard, QrCode, Building, User, Hash, CheckCircle, Loader2 } from "lucide-react";
import { apiService, BankAccount, UserOrder } from "@/lib/api";
import { getTableSession } from "@/lib/session";
import { getCachedUnpaidOrders } from "@/lib/unpaid-orders";

export default function ThanhToanPage() {
  const [copiedField, setCopiedField] = React.useState<string | null>(null);
  const [bankAccount, setBankAccount] = React.useState<BankAccount | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [sessionId, setSessionId] = React.useState<string | null>(null);
  const [unpaidOrders, setUnpaidOrders] = React.useState<UserOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = React.useState<UserOrder | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = React.useState(false);

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

  // Load current session + cached unpaid orders
  React.useEffect(() => {
    const session = getTableSession();
    if (!session) {
      setError("Không tìm thấy phiên bàn. Vui lòng quét mã QR lại.");
      return;
    }

    setSessionId(session.sessionId);
    const cached = getCachedUnpaidOrders(session.sessionId);

    // Keep only not-paid orders (backend may use different labels; keep it permissive)
    const filtered = cached.filter((o) => {
      const s = (o.status || "").toUpperCase();
      return s !== "PAID" && s !== "COMPLETED" && s !== "DONE";
    });

    setUnpaidOrders(filtered);
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

  const openPaymentModal = (order: UserOrder) => {
    setSelectedOrder(order);
    setIsPaymentModalOpen(true);
  };

  const closePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setSelectedOrder(null);
  };

  const getOrderAmountInt = (totalAmount: number) => {
    // totalAmount is always like xxxxx.x → drop decimal part
    return Math.trunc(totalAmount);
  };

  const buildVietQrImageUrl = (order: UserOrder, bank: BankAccount) => {
    const amount = getOrderAmountInt(order.totalAmount);
    const addInfo = `YHF${order.orderId}`;
    return `https://img.vietqr.io/image/${bank.bankName}-${bank.accountNumber}-compact.png?amount=${amount}&addInfo=${encodeURIComponent(addInfo)}`;
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
          {/* Unpaid Orders Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Đơn chưa thanh toán
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {sessionId && (
                <p className="text-xs text-gray-500">
                  Phiên: {sessionId.substring(0, 8)}...
                </p>
              )}

              {unpaidOrders.length === 0 ? (
                <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
                  Chưa có đơn hàng nào cần thanh toán trong phiên này.
                </div>
              ) : (
                <div className="space-y-3">
                  {unpaidOrders.map((order) => (
                    <Card key={order.orderId} className="shadow-sm">
                      <CardHeader className="py-3">
                        <CardTitle className="text-base">
                          Đơn #{order.orderId}
                        </CardTitle>
                        <p className="text-xs text-gray-500">
                          {new Date(order.orderTime).toLocaleString("vi-VN")}
                        </p>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-3">
                        <div className="space-y-2">
                          {order.items?.map((item) => (
                            <div key={item.orderItemId} className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{item.productName}</p>
                                <p className="text-xs text-gray-500">
                                  {item.productPrice?.toLocaleString("vi-VN")} VNĐ x {item.quantity}
                                </p>
                                {item.note ? (
                                  <p className="text-xs text-blue-700 bg-blue-50 inline-block px-2 py-1 rounded mt-1">
                                    Ghi chú: {item.note}
                                  </p>
                                ) : null}
                              </div>
                              <div className="text-sm font-semibold shrink-0">
                                {(item.productPrice * item.quantity).toLocaleString("vi-VN")} VNĐ
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t">
                          <div className="font-bold">
                            Tổng: {order.totalAmount.toLocaleString("vi-VN")} VNĐ
                          </div>
                          <Button
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => openPaymentModal(order)}
                          >
                            Thanh toán
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

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

        {/* Per-order payment modal */}
        <Dialog open={isPaymentModalOpen} onOpenChange={(open) => (open ? setIsPaymentModalOpen(true) : closePaymentModal())}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                Thanh toán đơn #{selectedOrder?.orderId}
              </DialogTitle>
            </DialogHeader>

            {selectedOrder && bankAccount ? (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="p-4 bg-white rounded-lg shadow-sm border">
                    <img
                      src={buildVietQrImageUrl(selectedOrder, bankAccount)}
                      alt="VietQR"
                      className="w-56 h-56 mx-auto object-contain"
                    />
                  </div>
                </div>

                <div className="text-sm text-gray-700 space-y-1">
                  <div className="flex justify-between">
                    <span>Số tiền:</span>
                    <span className="font-semibold">
                      {getOrderAmountInt(selectedOrder.totalAmount).toLocaleString("vi-VN")} VNĐ
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Nội dung:</span>
                    <span className="font-mono font-semibold">
                      YHF{selectedOrder.orderId}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={closePaymentModal}>
                    Đóng
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-600">Không có dữ liệu đơn hàng.</div>
            )}
          </DialogContent>
        </Dialog>

      </main>
    </div>
  );
}


