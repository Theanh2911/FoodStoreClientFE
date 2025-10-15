"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, CreditCard, History, UtensilsCrossed, Coffee, Plus } from "lucide-react";

export function DashboardNav() {
  const router = useRouter();
  const [selectedMenuItem, setSelectedMenuItem] = React.useState<string | null>(null);

  const handleMenuItemClick = (item: string, route: string) => {
    setSelectedMenuItem(item);
    router.push(route);
  };

  const handleRevenueClick = () => {
    router.push("/thanh-toan");
  };

  const handleHistoryClick = () => {
    router.push("/lich-su");
  };

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between p-3 sm:p-4 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center">
        <h1 
          className="text-lg sm:text-xl font-bold text-gray-800 truncate cursor-pointer hover:text-blue-600 transition-colors"
          onClick={() => router.push("/")}
        >
          <span className="hidden sm:inline">Food Store Dashboard</span>
          <span className="sm:hidden">Food Store</span>
        </h1>
      </div>

      {/* Navigation Items (Right side) */}
      <div className="flex items-center space-x-2 sm:space-x-6">
        {/* Menu Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm"
              className="flex items-center space-x-1 sm:space-x-2 hover:bg-gray-100 transition-colors px-2 sm:px-3"
            >
              <UtensilsCrossed className="h-4 w-4" />
              <span className="hidden sm:inline">Menu</span>
              <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 sm:w-48">
            <DropdownMenuItem 
              className="cursor-pointer flex items-center space-x-2 hover:bg-gray-50 py-2 sm:py-3"
              onClick={() => handleMenuItemClick("Đồ ăn", "/do-an")}
            >
              <UtensilsCrossed className="h-4 w-4" />
              <span>Đồ ăn</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="cursor-pointer flex items-center space-x-2 hover:bg-gray-50 py-2 sm:py-3"
              onClick={() => handleMenuItemClick("Đồ uống", "/do-uong")}
            >
              <Coffee className="h-4 w-4" />
              <span>Đồ uống</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="cursor-pointer flex items-center space-x-2 hover:bg-gray-50 py-2 sm:py-3"
              onClick={() => handleMenuItemClick("Đồ ăn thêm", "/do-an-them")}
            >
              <Plus className="h-4 w-4" />
              <span>Đồ ăn thêm</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Doanh thu Button */}
        <Button 
          variant="ghost" 
          size="sm"
          className="flex items-center space-x-1 sm:space-x-2 hover:bg-gray-100 transition-colors px-2 sm:px-3"
          onClick={handleRevenueClick}
        >
          <CreditCard className="h-4 w-4" />
          <span className="hidden sm:inline">Thanh toán</span>
          <span className="sm:hidden text-xs">Thanh toán</span>
        </Button>

        <Button 
          variant="ghost" 
          size="sm"
          className="flex items-center space-x-1 sm:space-x-2 hover:bg-gray-100 transition-colors px-2 sm:px-3"
          onClick={handleHistoryClick}
        >
          <History className="h-4 w-4" />
          <span className="hidden sm:inline">Lịch sử</span>
          <span className="sm:hidden text-xs">Lịch sử</span>
        </Button>
      </div>

      {selectedMenuItem && (
        <div className="absolute top-14 sm:top-16 right-2 sm:right-4 bg-blue-100 text-blue-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm z-40">
          <span className="hidden sm:inline">Đang xem: </span>
          {selectedMenuItem}
        </div>
      )}
    </nav>
  );
}
