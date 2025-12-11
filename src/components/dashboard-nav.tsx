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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown, CreditCard, User, LogOut, UtensilsCrossed, Coffee, Plus, Phone, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { apiService } from "@/lib/api";

interface UserData {
  userId: number;
  name: string;
  phoneNumber: string;
}

export function DashboardNav() {
  const router = useRouter();
  const [selectedMenuItem, setSelectedMenuItem] = React.useState<string | null>(null);
  const [user, setUser] = React.useState<UserData | null>(null);
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const [isLogin, setIsLogin] = React.useState(true);
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [showRoleErrorModal, setShowRoleErrorModal] = React.useState(false);
  const [showErrorModal, setShowErrorModal] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [formData, setFormData] = React.useState({
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    name: ""
  });

  // Check authentication status on mount and when localStorage changes
  React.useEffect(() => {
    const checkAuth = () => {
      const userData = localStorage.getItem('userData');
      if (userData) {
        setUser(JSON.parse(userData));
      } else {
        setUser(null);
      }
    };

    checkAuth();

    // Listen for storage changes (when user logs in/out in another tab or component)
    window.addEventListener('storage', checkAuth);
    
    // Custom event for same-tab updates
    window.addEventListener('authChange', checkAuth);

    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('authChange', checkAuth);
    };
  }, []);

  const handleMenuItemClick = (item: string, route: string) => {
    setSelectedMenuItem(item);
    router.push(route);
  };

  const handleRevenueClick = () => {
    router.push("/thanh-toan");
  };

  const handleLoginClick = () => {
    setIsLogin(true);
    setFormData({ phoneNumber: "", password: "", confirmPassword: "", name: "" });
    setShowAuthModal(true);
  };

  const handleHistoryClick = () => {
    router.push("/lich-su");
  };

  const handleLogout = async () => {
    try {
      // Call logout API to revoke token on server
      const token = localStorage.getItem('accessToken');
      if (token) {
        await apiService.logout();
        console.log('Logged out from server');
      }
    } catch (error) {
      console.error('Logout API error:', error);
      // Continue with local logout even if API fails
    } finally {
      // Clear local storage
      localStorage.removeItem('userData');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new Event('authChange'));
      
      // Redirect to home page
      router.push("/");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (isLogin) {
        // Handle login
        if (formData.phoneNumber && formData.password) {
          const response = await apiService.login({
            phoneNumber: formData.phoneNumber,
            password: formData.password
          });
          
          if (response.error) {
            setErrorMessage('Số điện thoại hoặc mật khẩu không đúng.\nVui lòng thử lại.');
            setShowAuthModal(false);
            setShowErrorModal(true);
            return;
          }
          
          // Check role - only allow CLIENT role
          if (response.data.role && response.data.role !== "CLIENT") {
            setShowAuthModal(false);
            setShowRoleErrorModal(true);
            setFormData({ phoneNumber: "", password: "", confirmPassword: "", name: "" });
            return;
          }
          
          if (response.data.message === "Login successful") {
            const userData = {
              userId: response.data.userId,
              name: response.data.name,
              phoneNumber: response.data.phoneNumber
            };
            
            // Store tokens if available
            if (response.data.token) {
              localStorage.setItem('accessToken', response.data.token);
            }
            if (response.data.refreshToken) {
              localStorage.setItem('refreshToken', response.data.refreshToken);
            }
            
            localStorage.setItem('userData', JSON.stringify(userData));
            setUser(userData);
            setShowAuthModal(false);
            setFormData({ phoneNumber: "", password: "", confirmPassword: "", name: "" });
            
            // Dispatch custom event to notify other components
            window.dispatchEvent(new Event('authChange'));
            
            // Redirect to history page after successful login
            router.push("/lich-su");
          } else {
            setErrorMessage('Đăng nhập thất bại.\nVui lòng thử lại.');
            setShowAuthModal(false);
            setShowErrorModal(true);
          }
        }
      } else {
        // Handle register
        if (formData.phoneNumber && formData.password && formData.confirmPassword && formData.name) {
          if (formData.password !== formData.confirmPassword) {
            setErrorMessage("Mật khẩu không khớp!");
            setShowAuthModal(false);
            setShowErrorModal(true);
            return;
          }
          
          const response = await apiService.register({
            name: formData.name,
            password: formData.password,
            phoneNumber: formData.phoneNumber
          });
          
          if (response.error) {
            setErrorMessage('Đăng ký thất bại.\nVui lòng thử lại.');
            setShowAuthModal(false);
            setShowErrorModal(true);
            return;
          }
          
          if (response.data.message === "Registration successful") {
            setErrorMessage('Đăng ký thành công!\nVui lòng đăng nhập.');
            setShowAuthModal(false);
            setShowErrorModal(true);
            setIsLogin(true);
            setFormData({ phoneNumber: formData.phoneNumber, password: "", confirmPassword: "", name: "" });
          } else {
            setErrorMessage('Đăng ký thất bại.\nVui lòng thử lại.');
            setShowAuthModal(false);
            setShowErrorModal(true);
          }
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      setErrorMessage('Có lỗi xảy ra. Vui lòng thử lại.');
      setShowAuthModal(false);
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
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

        {/* Login/User Button */}
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                className="flex items-center space-x-1 sm:space-x-2 hover:bg-gray-100 transition-colors px-2 sm:px-3"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{user.name}</span>
                <span className="sm:hidden text-xs">User</span>
                <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 sm:w-48">
              <DropdownMenuItem 
                className="cursor-pointer flex items-center space-x-2 hover:bg-gray-50 py-2 sm:py-3"
                onClick={handleHistoryClick}
              >
                <User className="h-4 w-4" />
                <span>Lịch sử đơn hàng</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer flex items-center space-x-2 hover:bg-gray-50 py-2 sm:py-3 text-red-600"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                <span>Đăng xuất</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button 
            variant="ghost" 
            size="sm"
            className="flex items-center space-x-1 sm:space-x-2 hover:bg-gray-100 transition-colors px-2 sm:px-3"
            onClick={handleLoginClick}
          >
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Đăng nhập</span>
            <span className="sm:hidden text-xs">Đăng nhập</span>
          </Button>
        )}
      </div>

      {selectedMenuItem && (
        <div className="absolute top-14 sm:top-16 right-2 sm:right-4 bg-blue-100 text-blue-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm z-40">
          <span className="hidden sm:inline">Đang xem: </span>
          {selectedMenuItem}
        </div>
      )}

      {/* Authentication Modal */}
      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl text-center">
              {isLogin ? "Đăng nhập" : "Đăng ký"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAuthSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-1.5">
                <Label htmlFor="nav-name" className="mb-1 block text-sm font-medium">
                  Họ và tên
                </Label>
                <Input
                  id="nav-name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Nhập họ và tên"
                  required={!isLogin}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="nav-phoneNumber" className="mb-1 block text-sm font-medium">
                Số điện thoại
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"/>
                <Input
                  id="nav-phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="Nhập số điện thoại"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="nav-password" className="mb-1 block text-sm font-medium">
                Mật khẩu
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"/>
                <Input
                  id="nav-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Nhập mật khẩu"
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-1.5">
                <Label htmlFor="nav-confirmPassword" className="mb-1 block text-sm font-medium">
                  Xác nhận mật khẩu
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"/>
                  <Input
                    id="nav-confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Nhập lại mật khẩu"
                    className="pl-10"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <Button type="submit" className="w-full mt-2" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isLogin ? "Đang đăng nhập..." : "Đang đăng ký..."}
                </>
              ) : (
                isLogin ? "Đăng nhập" : "Đăng ký"
              )}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {isLogin ? "Chưa có tài khoản? Đăng ký ngay" : "Đã có tài khoản? Đăng nhập"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Role Error Modal */}
      <Dialog open={showRoleErrorModal} onOpenChange={setShowRoleErrorModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl text-center text-red-600">
              Truy cập bị từ chối
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <Lock className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <p className="text-center text-gray-700">
              Tài khoản này không có quyền truy cập vào hệ thống khách hàng.
            </p>
            <p className="text-center text-sm text-gray-500">
              Chỉ tài khoản khách hàng (CLIENT) mới có thể đăng nhập vào ứng dụng này.
            </p>
            <Button 
              onClick={() => {
                setShowRoleErrorModal(false);
                setShowAuthModal(true);
              }}
              className="w-full"
            >
              Đăng nhập lại
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* General Error Modal */}
      <Dialog open={showErrorModal} onOpenChange={setShowErrorModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl text-center text-gray-900">
              Thông báo
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="h-8 w-8 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            <p className="text-center text-gray-700 whitespace-pre-line">
              {errorMessage}
            </p>
            <Button 
              onClick={() => {
                setShowErrorModal(false);
                if (errorMessage.includes("thành công")) {
                  // If registration successful, don't reopen auth modal
                  return;
                }
                setShowAuthModal(true);
              }}
              className="w-full"
            >
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </nav>
  );
}
