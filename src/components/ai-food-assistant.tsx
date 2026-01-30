"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { X, Sparkles, Loader2, ChefHat } from "lucide-react";
import { apiService, Product } from "@/lib/api";
import { ProductImage } from "@/components/product-image";
import { useRouter } from "next/navigation";

interface AIFoodAssistantProps {
  allProducts: Product[];
}

interface SuggestedDish {
  product: Product;
  type: 'main_dish' | 'side_dish' | 'drink';
}

export function AIFoodAssistant({ allProducts }: AIFoodAssistantProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [userInput, setUserInput] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [suggestedDishes, setSuggestedDishes] = React.useState<SuggestedDish[]>([]);
  const [reason, setReason] = React.useState("");
  const router = useRouter();

  const quickSuggestions = [
    { emoji: "😋", text: "Đói quá, gợi ý nhanh!" },
    { emoji: "🥗", text: "Ăn nhẹ thôi" },
    { emoji: "🌶️", text: "Thích món cay" },
    { emoji: "🍰", text: "Muốn ăn ngọt" },
  ];

  const handleQuickSuggestion = (text: string) => {
    setUserInput(text);
  };

  const findProductByName = (dishName: string): Product | null => {
    // Case-insensitive exact match
    const exactMatch = allProducts.find(
      p => p.name.toLowerCase() === dishName.toLowerCase()
    );
    if (exactMatch) return exactMatch;

    // Case-insensitive partial match
    const partialMatch = allProducts.find(
      p => p.name.toLowerCase().includes(dishName.toLowerCase()) ||
           dishName.toLowerCase().includes(p.name.toLowerCase())
    );
    return partialMatch || null;
  };

  const getFallbackDishes = (): SuggestedDish[] => {
    const fallbackDishes: SuggestedDish[] = [];
    
    // Get first product from each category
    const categories = ['Đồ ăn', 'Đồ ăn thêm', 'Đồ uống'];
    const types: ('main_dish' | 'side_dish' | 'drink')[] = ['main_dish', 'side_dish', 'drink'];
    
    categories.forEach((categoryName, index) => {
      const product = allProducts.find(p => p.category.name === categoryName);
      if (product) {
        fallbackDishes.push({
          product,
          type: types[index]
        });
      }
    });

    return fallbackDishes;
  };

  const handleSubmit = async () => {
    if (!userInput.trim()) return;

    setIsLoading(true);
    setSuggestedDishes([]);
    setReason("");

    try {
      const response = await apiService.getAISuggestion(userInput);

      if (response.error) {
        // Fallback: get first dish from each category
        console.error('AI API error, using fallback:', response.error);
        const fallback = getFallbackDishes();
        setSuggestedDishes(fallback);
        setReason("Đây là những món phổ biến nhất của chúng tôi!");
      } else {
        // Match dishes from API response
        const dishes: SuggestedDish[] = [];
        
        const mainDish = findProductByName(response.data.main_dish);
        if (mainDish) {
          dishes.push({ product: mainDish, type: 'main_dish' });
        }

        const sideDish = findProductByName(response.data.side_dish);
        if (sideDish) {
          dishes.push({ product: sideDish, type: 'side_dish' });
        }

        const drink = findProductByName(response.data.drink);
        if (drink) {
          dishes.push({ product: drink, type: 'drink' });
        }

        // If no dishes found, use fallback
        if (dishes.length === 0) {
          const fallback = getFallbackDishes();
          setSuggestedDishes(fallback);
          setReason("Đây là những món phổ biến nhất của chúng tôi!");
        } else {
          setSuggestedDishes(dishes);
          setReason(response.data.reason);
        }
      }
    } catch (error) {
      console.error('Error getting AI suggestion:', error);
      // Fallback on any error
      const fallback = getFallbackDishes();
      setSuggestedDishes(fallback);
      setReason("Đây là những món phổ biến nhất của chúng tôi!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmOrder = () => {
    // Navigate to order page with suggested dishes
    // We'll pass the product IDs via URL params
    const productIds = suggestedDishes.map(d => d.product.productId).join(',');
    router.push(`/tao-don-hang?ai=${productIds}`);
    setIsOpen(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    setUserInput("");
    setSuggestedDishes([]);
    setReason("");
  };

  const getDishTypeLabel = (type: 'main_dish' | 'side_dish' | 'drink') => {
    switch (type) {
      case 'main_dish': return 'Món chính';
      case 'side_dish': return 'Món phụ';
      case 'drink': return 'Đồ uống';
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-20 right-4 sm:right-6 z-40 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full px-4 py-3 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 group"
      >
        <ChefHat className="h-5 w-5 group-hover:rotate-12 transition-transform" />
        <span className="hidden sm:inline font-medium">AI gợi ý món ăn</span>
        <Sparkles className="h-4 w-4 animate-pulse" />
      </button>

      {/* Slide Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-50 transition-opacity"
            onClick={handleClose}
          />

          {/* Panel */}
          <div className="fixed top-20 right-0 h-[40vh] w-full sm:w-[500px] bg-white z-50 shadow-2xl animate-slide-in-right overflow-hidden flex flex-col rounded-l-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-full">
                    <ChefHat className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Bếp phó Sanji</h2>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="hover:bg-white/20 p-2 rounded-full transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Input Area */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Muốn ăn gì nào ?
                </label>
                <Textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder=""
                  className="min-h-[80px] resize-none"
                  disabled={isLoading}
                />
              </div>

              {/* Quick Suggestions */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Gợi ý nhanh
                </label>
                <div className="flex flex-wrap gap-2">
                  {quickSuggestions.map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickSuggestion(suggestion.text)}
                      disabled={isLoading}
                      className="text-sm"
                    >
                      <span className="mr-1">{suggestion.emoji}</span>
                      {suggestion.text}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              {!suggestedDishes.length && (
                <Button
                  onClick={handleSubmit}
                  disabled={!userInput.trim() || isLoading}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Hmmm... Đang nghĩ...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Tìm món phù hợp
                    </>
                  )}
                </Button>
              )}

              {/* Loading State */}
              {isLoading && (
                <Card className="bg-purple-50 border-purple-200">
                  <CardContent className="p-4 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="relative">
                        <ChefHat className="h-10 w-10 text-purple-500 animate-bounce" />
                        <Sparkles className="h-4 w-4 text-pink-500 absolute -top-1 -right-1 animate-ping" />
                      </div>
                      <p className="text-sm text-purple-700 font-medium">
                        Đang phân tích sở thích của bạn...
                      </p>
                      <p className="text-xs text-purple-600">Hmmm... 🤔</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Results */}
              {suggestedDishes.length > 0 && !isLoading && (
                <div className="space-y-3">
                  {/* Reason */}
                  <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <Sparkles className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-gray-700">{reason}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Suggested Dishes */}
                  <div className="space-y-2">
                    {suggestedDishes.map((dish, index) => (
                      <Card key={index} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-3">
                          <div className="flex items-center gap-2">
                            <ProductImage
                              imageUrl={dish.product.image}
                              productName={dish.product.name}
                              categoryName={dish.product.category.name}
                              className="w-12 h-12 flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1 mb-0.5">
                                <span className="text-xs font-medium text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded">
                                  {getDishTypeLabel(dish.type)}
                                </span>
                              </div>
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {dish.product.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {dish.product.category.name}
                              </p>
                              <p className="text-xs font-semibold text-green-600 mt-0.5">
                                {dish.product.price.toLocaleString('vi-VN')} VNĐ
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Confirm Button */}
                  <Button
                    onClick={handleConfirmOrder}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                    size="lg"
                  >
                    Thêm vào đơn hàng
                  </Button>

                  {/* Try Again Button */}
                  <Button
                    onClick={() => {
                      setSuggestedDishes([]);
                      setReason("");
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Thử lại
                  </Button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
