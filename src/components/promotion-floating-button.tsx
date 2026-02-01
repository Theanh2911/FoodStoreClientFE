"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tag, Copy, CheckCircle } from "lucide-react";

interface Promotion {
  promotionId: number;
  code: string;
  promotionType: string;
  discountPercentage: number;
  startDate: string;
  endDate: string;
  productId: number | null;
  productName: string | null;
  categoryId: number | null;
  categoryName: string | null;
  totalQuantity: number;
  usedCount: number;
  remainingCount: number;
  minOrderAmount: number;
  status: string;
  createdAt: string;
}

export function PromotionFloatingButton() {
  const [promotions, setPromotions] = React.useState<Promotion[]>([]);
  const [isPromotionsModalOpen, setIsPromotionsModalOpen] = React.useState(false);
  const [copiedPromoCode, setCopiedPromoCode] = React.useState<string | null>(null);

  // Fetch active promotions on mount
  React.useEffect(() => {
    const fetchPromotions = async () => {
      try {
        const response = await fetch('https://api.yenhafood.site/api/promotions/active');
        if (response.ok) {
          const data = await response.json();
          setPromotions(data);
        }
      } catch (error) {
        console.error('Error fetching promotions:', error);
      }
    };

    fetchPromotions();
  }, []);

  // Copy promo code to clipboard
  const copyPromoCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedPromoCode(code);
      setTimeout(() => setCopiedPromoCode(null), 2000);
    } catch {
      // Failed to copy
    }
  };

  return (
    <>
      {/* Floating Promotion Button */}
      <button
        onClick={() => setIsPromotionsModalOpen(true)}
        className="fixed bottom-6 right-6 bg-orange-500 hover:bg-orange-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all z-50"
        aria-label="Xem mã khuyến mãi"
      >
        <Tag className="h-6 w-6" />
        {promotions.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {promotions.length}
          </span>
        )}
      </button>

      {/* Promotions Modal */}
      <Dialog open={isPromotionsModalOpen} onOpenChange={setIsPromotionsModalOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Tag className="h-5 w-5 mr-2" />
              Mã khuyến mãi
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {promotions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Hiện chưa có mã khuyến mãi nào
              </div>
            ) : (
              promotions.map((promo) => (
                <div
                  key={promo.promotionId}
                  className="border rounded-lg p-4 space-y-2 hover:shadow-md transition-shadow"
                >
                  {/* Code and Copy Button */}
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-lg font-bold text-blue-600 font-mono">
                        {promo.code}
                      </div>
                      <div className="text-sm text-gray-600">
                        {promo.productName || 'Tất cả sản phẩm'}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyPromoCode(promo.code)}
                      className="shrink-0"
                    >
                      {copiedPromoCode === promo.code ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {/* Discount and Min Order */}
                  <div className="flex items-center gap-3 text-sm">
                    <div className="bg-orange-100 text-orange-700 px-2 py-1 rounded font-semibold">
                      Giảm {promo.discountPercentage}%
                    </div>
                    <div className="text-gray-600">
                      Đơn từ {promo.minOrderAmount.toLocaleString("vi-VN")}đ
                    </div>
                  </div>

                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
