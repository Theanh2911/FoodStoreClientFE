"use client";

import * as React from "react";
import { Suspense } from "react";
import { DashboardNav } from "@/components/dashboard-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, AlertCircle, Plus, Minus, ShoppingCart, Receipt, CheckCircle, Tag, XCircle } from "lucide-react";
import { apiService, formatPrice, Product, UnifiedOrderRequest, OrderItemRequest } from "@/lib/api";
import { getTableSession } from "@/lib/session";
import { getUserSession } from "@/lib/auth";
import { addCachedUnpaidOrderId } from "@/lib/unpaid-orders";
import { ProductImage } from "@/components/product-image";
import { useSearchParams } from "next/navigation";
import { PromotionFloatingButton } from "@/components/promotion-floating-button";

interface CartItem extends Product {
  quantity: number;
  note?: string;
}

// Component to handle AI suggestions from URL params
function AIOrderLoader({
  products,
  onLoadItems
}: {
  products: Product[];
  onLoadItems: (items: CartItem[]) => void;
}) {
  const searchParams = useSearchParams();

  React.useEffect(() => {
    if (products.length === 0) return;

    const aiParam = searchParams.get('ai');
    if (!aiParam) return;

    // Parse product IDs from URL
    const productIds = aiParam.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));

    if (productIds.length === 0) return;

    // Add AI suggested products to order
    const suggestedProducts = products.filter(p => productIds.includes(p.productId));

    if (suggestedProducts.length > 0) {
      const newOrderItems: CartItem[] = suggestedProducts.map(product => ({
        ...product,
        quantity: 1,
        note: ""
      }));

      onLoadItems(newOrderItems);
    }
  }, [products, searchParams, onLoadItems]);

  return null;
}

export default function TaoDonHangPage() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [orderItems, setOrderItems] = React.useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");
  const [showConfirmModal, setShowConfirmModal] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [promotionCode, setPromotionCode] = React.useState<string>("");
  const [appliedPromotion, setAppliedPromotion] = React.useState<{ discountPercentage: number, minOrderAmount: number } | null>(null);
  const [promoError, setPromoError] = React.useState<string | null>(null);
  const [showErrorModal, setShowErrorModal] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string>("");

  const categories = React.useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(products.map(product => product.category.name))
    );
    return ["all", ...uniqueCategories];
  }, [products]);

  const filteredProducts = React.useMemo(() => {
    if (selectedCategory === "all") {
      return products;
    }
    return products.filter(product => product.category.name === selectedCategory);
  }, [products, selectedCategory]);

  React.useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      setError(null);

      const result = await apiService.getAllProducts();

      if (result.error) {
        setError(result.error);
      } else {
        setProducts(result.data);
      }

      setIsLoading(false);
    };

    fetchProducts();
  }, []);

  const handleLoadAIItems = React.useCallback((items: CartItem[]) => {
    setOrderItems(items);
  }, []);

  const addToOrder = (product: Product) => {
    setOrderItems(prev => {
      const existingItem = prev.find(item => item.productId === product.productId);
      if (existingItem) {
        return prev.map(item =>
          item.productId === product.productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prev, { ...product, quantity: 1, note: "" }];
      }
    });
  };

  const removeFromOrder = (productId: number) => {
    setOrderItems(prev => {
      return prev.map(item =>
        item.productId === productId
          ? { ...item, quantity: Math.max(0, item.quantity - 1) }
          : item
      ).filter(item => item.quantity > 0);
    });
  };

  const parseErrorMessage = (error: string): string => {
    if (error.includes('Promotion code') && error.includes('not found')) {
      return 'Mã khuyến mãi không tồn tại hoặc đã hết hạn';
    }
    if (error.includes('Promotion') && error.includes('out of stock')) {
      return 'Mã khuyến mãi đã hết lượt sử dụng';
    }
    if (error.includes('minimum order amount')) {
      return 'Đơn hàng chưa đủ điều kiện áp dụng mã khuyến mãi';
    }
    if (error.includes('Promotion') && error.includes('expired')) {
      return 'Mã khuyến mãi đã hết hạn sử dụng';
    }

    if (error.includes('Session') && error.includes('not found')) {
      return 'Phiên làm việc đã hết hạn. Vui lòng quét lại mã QR';
    }
    if (error.includes('Table') && error.includes('not available')) {
      return 'Bàn hiện không khả dụng. Vui lòng liên hệ nhân viên';
    }

    if (error.includes('Product') && error.includes('not found')) {
      return 'Một số món ăn không còn trong thực đơn';
    }
    if (error.includes('out of stock')) {
      return 'Một số món ăn đã hết. Vui lòng chọn món khác';
    }

    if (error.includes('required') || error.includes('empty')) {
      return 'Vui lòng điền đầy đủ thông tin đơn hàng';
    }

    if (error.includes('network') || error.includes('Network')) {
      return 'Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại';
    }
    if (error.includes('500') || error.includes('Internal Server Error')) {
      return 'Lỗi hệ thống. Vui lòng thử lại sau ít phút';
    }
    if (error.includes('timeout')) {
      return 'Yêu cầu quá lâu. Vui lòng thử lại';
    }

    if (error.includes('API Error') || error.includes('error')) {
      return 'Không thể tạo đơn hàng. Vui lòng thử lại hoặc liên hệ nhân viên';
    }

    return error || 'Có lỗi xảy ra. Vui lòng thử lại';
  };

  const calculateTotal = () => {
    return orderItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateDiscount = () => {
    if (!appliedPromotion) return 0;
    const total = calculateTotal();
    return Math.floor((total * appliedPromotion.discountPercentage) / 100);
  };

  const calculateFinalTotal = () => {
    return calculateTotal() - calculateDiscount();
  };

  const checkPromotionCode = async () => {
    if (!promotionCode.trim()) {
      setAppliedPromotion(null);
      setPromoError(null);
      return;
    }

    try {
      const response = await fetch('https://api.yenhafood.site/api/promotions/active');
      if (response.ok) {
        const promotions = await response.json();
        const promo = promotions.find((p: { code: string }) => p.code === promotionCode.trim());

        if (!promo) {
          setPromoError('Mã khuyến mãi không tồn tại');
          setAppliedPromotion(null);
          return;
        }

        const total = calculateTotal();
        if (total < promo.minOrderAmount) {
          setPromoError(`Đơn hàng tối thiểu ${promo.minOrderAmount.toLocaleString("vi-VN")}đ`);
          setAppliedPromotion(null);
          return;
        }

        if (promo.remainingCount <= 0) {
          setPromoError('Mã khuyến mãi đã hết lượt sử dụng');
          setAppliedPromotion(null);
          return;
        }

        setAppliedPromotion({
          discountPercentage: promo.discountPercentage,
          minOrderAmount: promo.minOrderAmount
        });
        setPromoError(null);
      }
    } catch (error) {
      setPromoError('Không thể kiểm tra mã khuyến mãi');
    }
  };

  const getProductQuantity = (productId: number) => {
    const orderItem = orderItems.find(item => item.productId === productId);
    return orderItem ? orderItem.quantity : 0;
  };

  const handleConfirmOrder = () => {
    setShowConfirmModal(true);
  };

  const handleFinalConfirm = async () => {
    setIsSubmitting(true);

    try {
      const session = getTableSession();

      if (!session) {
        setErrorMessage('Phiên làm việc đã hết hạn. Vui lòng quét lại mã QR để tiếp tục.');
        setShowErrorModal(true);
        setShowConfirmModal(false);
        setIsSubmitting(false);
        return;
      }

      const userSession = getUserSession();

      const items: OrderItemRequest[] = orderItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        note: item.note?.trim() ? item.note.trim() : undefined
      }));

      const orderData: UnifiedOrderRequest = {
        sessionId: session.sessionId,
        tableNumber: session.tableNumber,
        total: appliedPromotion ? calculateFinalTotal() : calculateTotal(),
        items: items
      };

      // Thêm mã giảm giá nếu có
      if (promotionCode.trim() && appliedPromotion) {
        orderData.promotionCode = promotionCode.trim();
      }

      if (!userSession) {
        orderData.name = `Khách vãng lai bàn ${session.tableNumber}`;
      } else {
        orderData.name = userSession.name || `Khách bàn ${session.tableNumber}`;
        orderData.userId = userSession.userId;
      }

      const result = await apiService.createOrder(orderData);

      if (result.error) {
        const friendlyError = parseErrorMessage(result.error);
        setErrorMessage(friendlyError);
        setShowErrorModal(true);
        setShowConfirmModal(false);
        setIsSubmitting(false);
        return;
      }

      addCachedUnpaidOrderId(session.sessionId, result.data.orderId);
      setShowConfirmModal(false);
      setOrderItems([]);
      setPromotionCode("");
      setAppliedPromotion(null);
      setPromoError(null);
      setIsSubmitting(false);
    } catch (error) {
      const friendlyError = parseErrorMessage(error instanceof Error ? error.message : 'Unknown error');
      setErrorMessage(friendlyError);
      setShowErrorModal(true);
      setShowConfirmModal(false);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav />

      {/* AI Order Loader with Suspense */}
      <Suspense fallback={null}>
        <AIOrderLoader products={products} onLoadItems={handleLoadAIItems} />
      </Suspense>

      <main className="container mx-auto p-3 sm:p-4 lg:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Tạo đơn hàng
              </h1>
              <p className="text-gray-600">
                Chọn sản phẩm để tạo đơn hàng mới
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>

                {/* Category Filters */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                      className={selectedCategory === category ? "bg-blue-600 hover:bg-blue-700" : ""}
                    >
                      {category === "all" ? "Tất cả" : category}
                      {category !== "all" && (
                        <span className="ml-1 text-xs opacity-70">
                          ({products.filter(p => p.category.name === category).length})
                        </span>
                      )}
                      {category === "all" && (
                        <span className="ml-1 text-xs opacity-70">
                          ({products.length})
                        </span>
                      )}
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                {/* Loading State */}
                {isLoading && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-600">Đang tải dữ liệu...</span>
                  </div>
                )}

                {/* Error State */}
                {error && (
                  <div className="flex items-center justify-center py-8">
                    <AlertCircle className="h-8 w-8 text-red-600" />
                    <span className="ml-2 text-red-600">Lỗi: {error}</span>
                    <Button
                      variant="outline"
                      className="ml-4"
                      onClick={() => window.location.reload()}
                    >
                      Thử lại
                    </Button>
                  </div>
                )}

                {/* Products Grid */}
                {!isLoading && !error && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredProducts.length === 0 ? (
                      <div className="col-span-full text-center py-8 text-gray-500">
                        {selectedCategory === "all"
                          ? "Chưa có sản phẩm nào trong thực đơn."
                          : `Không có sản phẩm nào trong danh mục "${selectedCategory}".`
                        }
                      </div>
                    ) : (
                      filteredProducts.map((product) => {
                        const quantity = getProductQuantity(product.productId);
                        return (
                          <Card key={product.productId} className="hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3">
                              <div className="flex items-center space-x-3">
                                <ProductImage
                                  imageUrl={product.image}
                                  productName={product.name}
                                  categoryName={product.category.name}
                                  className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16"
                                />
                                <div className="flex-1">
                                  <CardTitle className="text-base">{product.name}</CardTitle>
                                  <p className="text-sm text-gray-500">{product.category.name}</p>
                                  <p className="text-sm font-semibold text-green-600">
                                    {formatPrice(product.price)}
                                  </p>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeFromOrder(product.productId)}
                                    disabled={quantity === 0}
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                  <span className="w-8 text-center font-medium">{quantity}</span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addToOrder(product)}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Đơn hàng ({orderItems.length} món)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {orderItems.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    Chưa có sản phẩm nào được chọn
                  </p>
                ) : (
                  <div className="space-y-3">
                    {orderItems.map((item) => (
                      <div key={item.productId} className="flex items-center justify-between py-2 border-b">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-gray-500">
                            {formatPrice(item.price)} x {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm">
                            {formatPrice(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}

                    <div className="pt-3 border-t">
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-bold">Tổng cộng:</span>
                        <span className="font-bold text-lg text-green-600">
                          {formatPrice(calculateTotal())}
                        </span>
                      </div>

                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        onClick={handleConfirmOrder}
                      >
                        Xác nhận đơn hàng
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Order Confirmation Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Receipt className="h-5 w-5 mr-2" />
              Xác nhận đơn hàng
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <div className="mb-4">
              <h3 className="font-semibold mb-3">Chi tiết đơn hàng:</h3>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {orderItems.map((item) => (
                  <div key={item.productId} className="py-2 border-b">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        <p className="text-xs text-gray-500">
                          {formatPrice(item.price)} x {item.quantity}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold text-sm">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-2">
                      <Textarea
                        value={item.note ?? ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          setOrderItems((prev) =>
                            prev.map((p) => (p.productId === item.productId ? { ...p, note: value } : p))
                          );
                        }}
                        placeholder="Ghi chú (ví dụ: ít cay, không hành...)"
                        className="min-h-10 text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Promotion Code Input */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2 flex items-center">
                <Tag className="h-4 w-4 mr-2" />
                Mã giảm giá
              </h3>
              <div className="flex gap-2">
                <Input
                  value={promotionCode}
                  onChange={(e) => {
                    setPromotionCode(e.target.value.toUpperCase());
                    setPromoError(null);
                    setAppliedPromotion(null);
                  }}
                  placeholder="Nhập mã giảm giá"
                  className="text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={checkPromotionCode}
                  disabled={!promotionCode.trim() || appliedPromotion !== null}
                >
                  Áp dụng
                </Button>
              </div>
              {promoError && (
                <p className="text-xs text-red-600 mt-1">{promoError}</p>
              )}
              {appliedPromotion && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ Giảm {appliedPromotion.discountPercentage}% cho đơn hàng
                </p>
              )}
            </div>

            <div className="border-t pt-3 mt-4">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Tạm tính:</span>
                  <span className="font-medium">
                    {formatPrice(calculateTotal())}
                  </span>
                </div>

                {appliedPromotion && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-orange-600">Giảm giá ({appliedPromotion.discountPercentage}%):</span>
                    <span className="font-medium text-orange-600">
                      -{formatPrice(calculateDiscount())}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-lg font-bold">Tổng cộng:</span>
                  <span className="text-xl font-bold text-green-600">
                    {formatPrice(calculateFinalTotal())}
                  </span>
                </div>
              </div>

              <div className="text-sm text-gray-600 mb-4">
                <p>Số lượng món: {orderItems.length}</p>
                <p>Tổng số sản phẩm: {orderItems.reduce((sum, item) => sum + item.quantity, 0)}</p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmModal(false);
                setPromotionCode("");
                setAppliedPromotion(null);
                setPromoError(null);
              }}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleFinalConfirm}
              disabled={isSubmitting || (promotionCode.trim() !== "" && !appliedPromotion)}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Xác nhận
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error Modal */}
      <Dialog open={showErrorModal} onOpenChange={setShowErrorModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
              <XCircle className="h-6 w-6 mr-2" />
              Không thể tạo đơn hàng
            </DialogTitle>
          </DialogHeader>

          <div className="py-6">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="h-10 w-10 text-red-600" />
              </div>
            </div>

            <div className="text-center space-y-4">
              <p className="text-gray-800 font-medium text-lg">
                {errorMessage}
              </p>
              <p className="text-sm text-gray-600">
                Nếu vấn đề vẫn tiếp diễn, vui lòng liên hệ nhân viên để được hỗ trợ.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                setShowErrorModal(false);
                setErrorMessage("");
              }}
            >
              Đã hiểu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Promotion Floating Button */}
      <PromotionFloatingButton />
    </div>
  );
}
