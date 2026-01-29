"use client";

import * as React from "react";
import { DashboardNav } from "@/components/dashboard-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, AlertCircle, Plus, Minus, ShoppingCart, ArrowLeft, Filter, Receipt, CheckCircle } from "lucide-react";
import { apiService, formatPrice, Product, UnifiedOrderRequest, OrderItemRequest } from "@/lib/api";
import { getTableSession } from "@/lib/session";
import { getUserSession } from "@/lib/auth";
import { addCachedUnpaidOrderId } from "@/lib/unpaid-orders";
import { ProductImage } from "@/components/product-image";
import { useRouter, useSearchParams } from "next/navigation";
import importFresh from "import-fresh";

interface CartItem extends Product {
  quantity: number;
  note?: string;
}

export default function TaoDonHangPage() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [orderItems, setOrderItems] = React.useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");
  const [showConfirmModal, setShowConfirmModal] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

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

  // Handle AI suggested products from URL params
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
      
      setOrderItems(newOrderItems);
    }
  }, [products, searchParams]);

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

  const calculateTotal = () => {
    return orderItems.reduce((total, item) => total + (item.price * item.quantity), 0);
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
    setSubmitError(null);

    try {
      const session = getTableSession();
      
      if (!session) {
        setSubmitError('Không tìm thấy thông tin phiên. Vui lòng quét mã QR lại.');
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
        total: calculateTotal(),
        items: items
      };

      if (!userSession) {
        orderData.name = `Khách vãng lai bàn ${session.tableNumber}`;
      } else {
        orderData.name = userSession.name || `Khách bàn ${session.tableNumber}`;
        orderData.userId = userSession.userId;
      }

      const result = await apiService.createOrder(orderData);

      if (result.error) {
        setSubmitError(result.error);
        setIsSubmitting(false);
        return;
      }

      addCachedUnpaidOrderId(session.sessionId, result.data.orderId);
      setShowConfirmModal(false);
      setOrderItems([]);
      setIsSubmitting(false);
    } catch (error) {
      console.error('Error creating order:', error);
      setSubmitError('Có lỗi xảy ra khi tạo đơn hàng. Vui lòng thử lại.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav />
      
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
            
            <div className="border-t pt-3">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-bold">Tổng cộng:</span>
                <span className="text-xl font-bold text-green-600">
                  {formatPrice(calculateTotal())}
                </span>
              </div>
              
              <div className="text-sm text-gray-600 mb-4">
                <p>Số lượng món: {orderItems.length}</p>
                <p>Tổng số sản phẩm: {orderItems.reduce((sum, item) => sum + item.quantity, 0)}</p>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {submitError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                <p className="text-sm text-red-700">{submitError}</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowConfirmModal(false);
                setSubmitError(null);
              }}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={handleFinalConfirm}
              disabled={isSubmitting}
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
    </div>
  );
}
