"use client";

import * as React from "react";
import { DashboardNav } from "@/components/dashboard-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Copy, CreditCard, QrCode, Building, User, Hash, CheckCircle, Loader2, PartyPopper } from "lucide-react";
import { apiService, BankAccount, UserOrder, PaymentEvent } from "@/lib/api";
import { getTableSession } from "@/lib/session";
import { getCachedUnpaidOrderIds, removeCachedUnpaidOrderId } from "@/lib/unpaid-orders";

export default function ThanhToanPage() {
  const [copiedField, setCopiedField] = React.useState<string | null>(null);
  const [bankAccount, setBankAccount] = React.useState<BankAccount | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [sessionId, setSessionId] = React.useState<string | null>(null);
  const [unpaidOrders, setUnpaidOrders] = React.useState<UserOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = React.useState<UserOrder | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = React.useState(false);
  const [paymentSuccess, setPaymentSuccess] = React.useState<PaymentEvent | null>(null);
  const [isPaymentSuccessModalOpen, setIsPaymentSuccessModalOpen] = React.useState(false);

  // Fetch bank account information on mount
  React.useEffect(() => {
    const fetchBankAccount = async () => {
      try {
        setIsLoading(true);
        const response = await apiService.getActiveBankAccount();

        if (response.error) {
          console.error('API Error:', response.error);
          setError('Không thể tải thông tin tài khoản ngân hàng');
          return;
        }

        // Handle if API returns an array instead of single object
        let bankData = response.data;
        if (Array.isArray(response.data)) {
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

  // Load current session + fetch unpaid orders from API by orderIds
  React.useEffect(() => {
    const fetchUnpaidOrders = async () => {
      const session = getTableSession();
      if (!session) {
        setError("Không tìm thấy phiên bàn. Vui lòng quét mã QR lại.");
        return;
      }

      setSessionId(session.sessionId);

      // Get cached order IDs
      const orderIds = getCachedUnpaidOrderIds(session.sessionId);

      if (orderIds.length === 0) {
        setUnpaidOrders([]);
        return;
      }

      try {
        // Fetch each order detail from API
        const orderPromises = orderIds.map(orderId =>
          apiService.getOrderDetail(orderId)
        );

        const results = await Promise.all(orderPromises);

        // Filter out errors and get valid orders
        const validOrders = results
          .filter(result => !result.error && result.data)
          .map(result => result.data);

        // Filter to keep only unpaid orders
        const unpaidOnly = validOrders.filter((o) => {
          const s = (o.status || "").toUpperCase();
          return s !== "PAID" && s !== "COMPLETED" && s !== "DONE";
        });

        setUnpaidOrders(unpaidOnly);
      } catch (err) {
        console.error('Error fetching unpaid orders:', err);
        setError('Có lỗi xảy ra khi tải danh sách đơn hàng');
      }
    };

    fetchUnpaidOrders();
  }, []);

  // Listen to order status changes for all unpaid orders
  React.useEffect(() => {
    if (unpaidOrders.length === 0) {
      return;
    }

    console.log('Starting order status SSE listeners for unpaid orders:', unpaidOrders.map(o => o.orderId));

    // Create cleanup functions array
    const cleanupFunctions: (() => void)[] = [];

    // Start SSE listener for each unpaid order
    unpaidOrders.forEach((order) => {
      const cleanup = apiService.listenToOrderStatusEvents(
        order.orderId,
        (updatedOrder: UserOrder) => {
          console.log('Order status updated:', updatedOrder);

          // Update order in the list
          setUnpaidOrders(prev =>
            prev.map(o => o.orderId === updatedOrder.orderId ? updatedOrder : o)
          );

          // If order becomes PAID or COMPLETED, show success and remove from list
          const status = (updatedOrder.status || '').toUpperCase();
          if (status === 'PAID' || status === 'COMPLETED') {
            // Show success modal with order info
            const successEvent: PaymentEvent = {
              orderId: updatedOrder.orderId,
              paymentId: 0, // Not available from order status
              status: 'SUCCESS',
              amount: updatedOrder.totalAmount,
              message: 'Đơn hàng đã được thanh toán thành công',
              gateway: 'N/A',
              transactionDate: updatedOrder.orderTime
            };
            setPaymentSuccess(successEvent);
            setIsPaymentSuccessModalOpen(true);

            // Remove from unpaid orders list
            if (sessionId) {
              removeCachedUnpaidOrderId(sessionId, updatedOrder.orderId);
            }
            setUnpaidOrders(prev => prev.filter(o => o.orderId !== updatedOrder.orderId));
          }
        },
        (error) => {
          console.error('Order status SSE error:', error);
        }
      );

      cleanupFunctions.push(cleanup);
    });

    // Cleanup all SSE connections when component unmounts or orders change
    return () => {
      console.log('Cleaning up order status SSE listeners');
      cleanupFunctions.forEach(cleanup => cleanup());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unpaidOrders.length, sessionId]);

  // Listen to payment events via SSE when payment modal is open
  React.useEffect(() => {
    if (!selectedOrder || !isPaymentModalOpen) {
      return;
    }

    console.log('Starting SSE listener for order:', selectedOrder.orderId);

    const cleanup = apiService.listenToPaymentEvents(
      selectedOrder.orderId,
      (event: PaymentEvent) => {
        console.log('Payment event received:', event);

        if (event.status === 'SUCCESS') {
          // Show success modal
          setPaymentSuccess(event);
          setIsPaymentSuccessModalOpen(true);

          // Close payment modal
          setIsPaymentModalOpen(false);

          // Remove order from cache and UI
          if (sessionId) {
            removeCachedUnpaidOrderId(sessionId, event.orderId);
          }

          // Update unpaid orders list
          setUnpaidOrders(prev => prev.filter(o => o.orderId !== event.orderId));
        }
      },
      (error) => {
        console.error('Payment SSE error:', error);
      }
    );

    // Cleanup on unmount or when order changes
    return () => {
      cleanup();
    };
  }, [selectedOrder, isPaymentModalOpen, sessionId]);

  // Copy to clipboard function
  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
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

  const isPaymentButtonDisabled = (order: UserOrder): boolean => {
    const status = (order.status || '').toUpperCase();
    // Disable if PENDING or PAID or COMPLETED
    // Only enable when SERVED
    return status !== 'SERVED';
  };

  const getPaymentButtonText = (order: UserOrder): string => {
    const status = (order.status || '').toUpperCase();
    if (status === 'PENDING') return 'Đang chế biến...';
    if (status === 'PAID' || status === 'COMPLETED') return 'Đã thanh toán';
    if (status === 'SERVED') return 'Thanh toán';
    return 'Thanh toán';
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
                        <p className="text-sm font-semibold text-gray-700">
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
                            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            onClick={() => openPaymentModal(order)}
                            disabled={isPaymentButtonDisabled(order)}
                          >
                            {getPaymentButtonText(order)}
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
                      {/* eslint-disable-next-line @next/next/no-img-element */}
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
                    {/* eslint-disable-next-line @next/next/no-img-element */}
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

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-start">
                    <Loader2 className="h-4 w-4 text-blue-600 mr-2 mt-0.5 animate-spin" />
                    <p className="text-sm text-blue-700">
                      Đang chờ xác nhận thanh toán từ ngân hàng...
                    </p>
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

        {/* Payment Success Modal */}
        <Dialog open={isPaymentSuccessModalOpen} onOpenChange={setIsPaymentSuccessModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center text-green-600">
                <CheckCircle className="h-6 w-6 mr-2" />
                Thanh toán thành công!
              </DialogTitle>
            </DialogHeader>

            {paymentSuccess && (
              <div className="space-y-4">
                {/* Success Icon */}
                <div className="flex justify-center py-6">
                  <div className="relative">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center animate-pulse">
                      <PartyPopper className="h-12 w-12 text-green-600" />
                    </div>
                  </div>
                </div>

                {/* Payment Details */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Đơn hàng:</span>
                    <span className="font-semibold">#{paymentSuccess.orderId}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Số tiền:</span>
                    <span className="font-semibold text-green-600">
                      {paymentSuccess.amount.toLocaleString("vi-VN")} VNĐ
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Cổng thanh toán:</span>
                    <span className="font-semibold">{paymentSuccess.gateway}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Thời gian:</span>
                    <span className="font-semibold">
                      {new Date(paymentSuccess.transactionDate).toLocaleString("vi-VN")}
                    </span>
                  </div>
                </div>

                {/* Success Message */}
                <div className="text-center">
                  <p className="text-gray-600">{paymentSuccess.message}</p>
                </div>

                {/* Close Button */}
                <div className="flex justify-center">
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      setIsPaymentSuccessModalOpen(false);
                      setPaymentSuccess(null);
                      setSelectedOrder(null);
                    }}
                  >
                    Đóng
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

      </main>
    </div>
  );
}


