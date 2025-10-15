"use client";

import * as React from "react";
import { DashboardNav } from "@/components/dashboard-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, ShoppingCart } from "lucide-react";
import { apiService, formatPrice, CATEGORY_IDS, Product } from "@/lib/api";
import { ProductImage } from "@/components/product-image";
import { useRouter } from "next/navigation";

export default function DoAnPage() {
  const [foodItems, setFoodItems] = React.useState<Product[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const router = useRouter();

  // Fetch food items from backend
  React.useEffect(() => {
    const fetchFoodItems = async () => {
      setIsLoading(true);
      setError(null);
      
      const result = await apiService.getProductsByCategory(CATEGORY_IDS.FOOD);
      
      if (result.error) {
        setError(result.error);
      } else {
        setFoodItems(result.data);
      }
      
      setIsLoading(false);
    };

    fetchFoodItems();
  }, []);


  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav />
      
      <main className="container mx-auto p-3 sm:p-4 lg:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Đồ ăn
            </h1>
            <p className="text-gray-600">
              Quản lý thực đơn đồ ăn của cửa hàng
            </p>
          </div>
          <Button 
            className="mt-4 sm:mt-0 w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
            onClick={() => router.push('/tao-don-hang')}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Tạo đơn hàng
          </Button>
        </div>

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

        {/* Food Items Grid */}
        {!isLoading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {foodItems.length === 0 ? (
              <div className="col-span-full text-center py-8 text-gray-500">
                Chưa có món ăn nào. Hãy thêm món mới!
              </div>
            ) : (
              foodItems.map((item) => (
                <Card key={item.productId} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <ProductImage
                          imageUrl={item.image}
                          productName={item.name}
                          categoryName={item.category.name}
                          className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16"
                        />
                        <div>
                          <CardTitle className="text-lg">{item.name}</CardTitle>
                          <p className="text-sm text-gray-500">{item.category.name}</p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div className="text-xl font-bold text-green-600">
                        {formatPrice(item.price)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

      </main>

    </div>
  );
}
