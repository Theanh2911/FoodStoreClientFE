"use client";

import * as React from "react";
import { DashboardNav } from "@/components/dashboard-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { History, Clock, ShoppingBag, User, Lock, Phone, Eye, EyeOff, Loader2 } from "lucide-react";
import { apiService, UserOrder, formatPrice } from "@/lib/api";

interface User {
  userId: number;
  name: string;
  phoneNumber: string;
}

export default function LichSuPage() {
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const [isLogin, setIsLogin] = React.useState(true);
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [user, setUser] = React.useState<User | null>(null);
  const [orders, setOrders] = React.useState<UserOrder[]>([]);
  const [formData, setFormData] = React.useState({
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    name: ""
  });

  // Check authentication on component mount
  React.useEffect(() => {
    const checkAuth = () => {
      const userData = localStorage.getItem('userData');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsLoggedIn(true);
        fetchUserOrders(parsedUser.userId);
      } else {
        setShowAuthModal(true);
      }
    };
    
    checkAuth();
  }, []);

  // Fetch user orders
  const fetchUserOrders = async (userId: number) => {
    try {
      setIsLoading(true);
      const response = await apiService.getUserOrders(userId);
      if (response.error) {
        console.error('Error fetching orders:', response.error);
        setOrders([]);
      } else {
        setOrders(response.data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  // Handle login/register form submission
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
            alert('Đăng nhập thất bại: ' + response.error);
            return;
          }
          
          if (response.data.message === "Login successful") {
            const userData = {
              userId: response.data.userId,
              name: response.data.name,
              phoneNumber: response.data.phoneNumber
            };
            
            localStorage.setItem('userData', JSON.stringify(userData));
            setUser(userData);
            setIsLoggedIn(true);
            setShowAuthModal(false);
            setFormData({ phoneNumber: "", password: "", confirmPassword: "", name: "" });
            
            // Auto fetch orders after successful login
            await fetchUserOrders(userData.userId);
          } else {
            alert('Đăng nhập thất bại: ' + response.data.message);
          }
        }
      } else {
        // Handle register
        if (formData.phoneNumber && formData.password && formData.confirmPassword && formData.name) {
          if (formData.password !== formData.confirmPassword) {
            alert("Mật khẩu không khớp!");
            return;
          }
          
          const response = await apiService.register({
            name: formData.name,
            password: formData.password,
            phoneNumber: formData.phoneNumber
          });
          
          if (response.error) {
            alert('Đăng ký thất bại: ' + response.error);
            return;
          }
          
          if (response.data.message === "Registration successful") {
            alert('Đăng ký thành công! Vui lòng đăng nhập.');
            setIsLogin(true);
            setFormData({ phoneNumber: formData.phoneNumber, password: "", confirmPassword: "", name: "" });
          } else {
            alert('Đăng ký thất bại: ' + response.data.message);
          }
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      alert('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userData');
    setUser(null);
    setOrders([]);
    setIsLoggedIn(false);
    setShowAuthModal(true);
  };

  // Format date
  const formatDate = (dateString: string): string => {
    if (!dateString) return 'Chưa có thông tin';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Ngày không hợp lệ';
    
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav />
      
      <main className="container mx-auto px-3 sm:px-4 lg:px-6 pt-8 sm:pt-12 lg:pt-16 pb-3 sm:pb-4 lg:pb-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-16 lg:mb-20">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              Lịch sử đơn hàng
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Xem lại các đơn hàng đã đặt của bạn
            </p>
          </div>
          {isLoggedIn && user && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="text-sm text-gray-600">
                Xin chào, <span className="font-medium">{user.name}</span>
              </div>
              <Button 
                variant="outline"
                onClick={handleLogout}
                className="self-start sm:self-center"
              >
                <User className="h-4 w-4 mr-2" />
                Đăng xuất
              </Button>
            </div>
          )}
        </div>


        {/* Order History */}
        {isLoggedIn ? (
          <div className="space-y-6">
            {isLoading ? (
              <Card className="shadow-sm">
                <CardContent className="text-center py-12">
                  <Loader2 className="h-16 w-16 text-blue-600 mx-auto mb-6 animate-spin" />
                  <h3 className="text-xl font-medium text-gray-900 mb-3">
                    Đang tải lịch sử đơn hàng...
                  </h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Vui lòng đợi trong giây lát
                  </p>
                </CardContent>
              </Card>
            ) : orders.length === 0 ? (
              <Card className="shadow-sm">
                <CardContent className="text-center py-12">
                  <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-6" />
                  <h3 className="text-xl font-medium text-gray-900 mb-3">
                    Chưa có đơn hàng nào
                  </h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Bạn chưa có đơn hàng nào. Hãy đặt món ngay để bắt đầu trải nghiệm!
                  </p>
                </CardContent>
              </Card>
            ) : (
              orders.map((order) => (
                <Card key={order.orderId} className="hover:shadow-lg transition-all duration-200 shadow-sm">
                  <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <CardTitle className="flex items-center text-lg">
                        <History className="h-5 w-5 mr-3 text-blue-600" />
                        Đơn hàng #{order.orderId}
                      </CardTitle>
                      <div className="flex items-center text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
                        <Clock className="h-4 w-4 mr-2" />
                        {formatDate(order.orderTime)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-5">
                      {/* Order Items */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wide">
                          Món đã đặt
                        </h4>
                        <ul className="space-y-2 bg-gray-50 p-4 rounded-lg">
                          {order.items && order.items.length > 0 ? (
                            order.items.map((item, index) => (
                              <li key={index} className="flex items-center justify-between text-gray-700">
                                <div className="flex items-center">
                                  <ShoppingBag className="h-4 w-4 mr-3 text-gray-400" />
                                  <span className="font-medium">{item.productName || 'Món ăn không xác định'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-500">x{item.quantity || 1}</span>
                                  {item.note && (
                                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                      {item.note}
                                    </span>
                                  )}
                                </div>
                              </li>
                            ))
                          ) : (
                            <li className="text-gray-500 text-center py-2">
                              Không có thông tin món ăn
                            </li>
                          )}
                        </ul>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center">
                          <span className="text-sm text-gray-500 mr-3 font-medium">Trạng thái:</span>
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            order.status === 'Hoàn thành' || order.status === 'COMPLETED'
                              ? 'bg-green-100 text-green-700 border border-green-200' 
                              : order.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                              : 'bg-gray-100 text-gray-700 border border-gray-200'
                          }`}>
                            {order.status || 'Chưa xác định'}
                          </span>
                        </div>
                        <div className="text-xl font-bold text-green-600">
                          {order.totalAmount ? formatPrice(order.totalAmount) : 'Chưa có thông tin'}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        ) : (
          <Card className="shadow-sm">
            <CardContent className="text-center py-16">
              <Lock className="h-16 w-16 text-gray-400 mx-auto mb-6" />
              <h3 className="text-xl font-medium text-gray-900 mb-4">
                Vui lòng đăng nhập
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Bạn cần đăng nhập để xem lịch sử đơn hàng và theo dõi các đơn hàng đã đặt
              </p>
              <Button 
                onClick={() => setShowAuthModal(true)}
                size="lg"
                className="px-8 py-3"
              >
                <User className="h-4 w-4 mr-2" />
                Đăng nhập ngay
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

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
                  <Label htmlFor="name" className="mb-1 block text-sm font-medium">
                    Họ và tên
                  </Label>
                  <Input
                      id="name"
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
              <Label htmlFor="phoneNumber" className="mb-1 block text-sm font-medium">
                Số điện thoại
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"/>
                <Input
                    id="phoneNumber"
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
              <Label htmlFor="password" className="mb-1 block text-sm font-medium">
                Mật khẩu
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"/>
                <Input
                    id="password"
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
                  <Label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium">
                    Xác nhận mật khẩu
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"/>
                    <Input
                        id="confirmPassword"
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
    </div>
  );
}


