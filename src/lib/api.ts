const API_BASE_URL = 'https://api.yenhafood.site/api';

export interface Product {
  productId: number;
  name: string;
  price: number;
  image: string | null;
  category: {
    categoryId: number;
    name: string;
  };
}

export interface OrderItemRequest {
  productId: number;
  quantity: number;
  note?: string;
}

export interface UnifiedOrderRequest {
  sessionId: string;
  tableNumber: number;
  name?: string;
  userId?: number;
  promotionCode?: string;
  total: number;
  items: OrderItemRequest[];
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
}

export interface AuthRegisterRequest {
  name: string;
  password: string;
  phoneNumber: string;
}

export interface AuthLoginRequest {
  phoneNumber: string;
  password: string;
}

export interface AuthResponse {
  userId: number;
  name: string;
  phoneNumber: string;
  message: string;
  token?: string;
  refreshToken?: string;
  role?: string;
}

export interface UserOrderItem {
  orderItemId: number;
  productId: number;
  productName: string;
  productPrice: number;
  quantity: number;
  note: string;
}

export interface UserOrder {
  orderId: number;
  customerName: string;
  tableNumber: number;
  amount: number;
  totalAmount: number;
  orderTime: string;
  status: string;
  isRated: boolean;
  items: UserOrderItem[];
}

export interface BankAccount {
  id: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  qrCodeImageUrl: string | null;
  status: string;
}

export interface PaymentEvent {
  orderId: number;
  paymentId: number;
  status: string;
  amount: number;
  message: string;
  gateway: string;
  transactionDate: string;
}

export interface RatingResponse {
  ratingId: number;
  orderId: number;
  userId: string;
  comment: string;
  rating: number;
  imageUrls: string[];
  createdAt: string;
  orderDetails: UserOrder;
}

export interface AISuggestionResponse {
  main_dish: string;
  side_dish: string;
  drink: string;
  reason: string;
}

class ApiService {
  private async fetchWithErrorHandling<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      // API Request failed
      return {
        data: [] as unknown as T,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async getAllProducts(): Promise<ApiResponse<Product[]>> {
    return this.fetchWithErrorHandling<Product[]>(`${API_BASE_URL}/menu/products/getAll`);
  }

  async getProductsByCategory(categoryId: number): Promise<ApiResponse<Product[]>> {
    return this.fetchWithErrorHandling<Product[]>(`${API_BASE_URL}/menu/products/category/${categoryId}`);
  }

  async createOrder(orderData: UnifiedOrderRequest): Promise<ApiResponse<UserOrder>> {
    const token = localStorage.getItem('accessToken');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Nếu có token thì thêm Authorization header
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return this.fetchWithErrorHandling<UserOrder>(`${API_BASE_URL}/orders/create`, {
      method: 'POST',
      body: JSON.stringify(orderData),
      headers,
    });
  }

  async getOrderDetail(orderId: number): Promise<ApiResponse<UserOrder>> {
    return this.fetchWithErrorHandling<UserOrder>(`${API_BASE_URL}/orders/${orderId}`);
  }

  async register(userData: AuthRegisterRequest): Promise<ApiResponse<AuthResponse>> {
    return this.fetchWithErrorHandling<AuthResponse>(`${API_BASE_URL}/auth/client-register`, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials: AuthLoginRequest): Promise<ApiResponse<AuthResponse>> {
    return this.fetchWithErrorHandling<AuthResponse>(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async getUserOrders(userId: number): Promise<ApiResponse<UserOrder[]>> {
    const token = localStorage.getItem('accessToken');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return this.fetchWithErrorHandling<UserOrder[]>(`${API_BASE_URL}/auth/orders/${userId}`, {
      headers,
    });
  }

  async getActiveBankAccount(): Promise<ApiResponse<BankAccount>> {
    return this.fetchWithErrorHandling<BankAccount>(`${API_BASE_URL}/banks/active`);
  }


  async updatePassword(oldPassword: string, newPassword: string): Promise<ApiResponse<{ message: string }>> {
    const token = localStorage.getItem('accessToken');

    if (!token) {
      return {
        data: {} as { message: string },
        error: 'Vui lòng đăng nhập để đổi mật khẩu'
      };
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    return this.fetchWithErrorHandling<{ message: string }>(`${API_BASE_URL}/auth/update-password`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ oldPassword, newPassword }),
    });
  }

  async getAISuggestion(userDemand: string): Promise<ApiResponse<AISuggestionResponse>> {
    return this.fetchWithErrorHandling<AISuggestionResponse>(`${API_BASE_URL}/ai/suggestion`, {
      method: 'POST',
      body: JSON.stringify({ userDemand }),
    });
  }

  // Create rating for an order
  async createRating(orderId: number, ratingData: FormData): Promise<ApiResponse<RatingResponse>> {
    const token = localStorage.getItem('accessToken');

    if (!token) {
      return {
        data: {} as RatingResponse,
        error: 'Vui lòng đăng nhập để đánh giá'
      };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/ratings/${orderId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type for FormData - browser will set it with boundary
        },
        body: ratingData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || `API Error: ${response.status}`);
      }

      const responseData = await response.json();
      // Backend returns { message: "...", data: {...} }
      // Extract the data field
      return { data: responseData.data || responseData };
    } catch (error) {
      return {
        data: {} as RatingResponse,
        error: error instanceof Error ? error.message : 'Không thể gửi đánh giá'
      };
    }
  }

  // Listen to payment events via SSE
  listenToPaymentEvents(
    orderId: number,
    onEvent: (event: PaymentEvent) => void,
    onError?: (error: Error) => void
  ): () => void {
    const eventSource = new EventSource(`${API_BASE_URL}/payment/events/${orderId}`);

    // Listen for 'connected' event
    eventSource.addEventListener('connected', (event: MessageEvent) => {
      console.log('SSE connected:', event.data);
    });

    // Listen for 'heartbeat' event
    eventSource.addEventListener('heartbeat', (event: MessageEvent) => {
      console.log('SSE heartbeat:', event.data);
    });

    // Listen for 'payment-status' event - theo đúng quy trình backend
    eventSource.addEventListener('payment-status', (event: MessageEvent) => {
      try {
        console.log('Raw payment-status event received:', event.data);

        // Parse JSON từ event.data
        const data: PaymentEvent = JSON.parse(event.data);
        console.log('Payment status event parsed:', data);

        // Kiểm tra status === 'SUCCESS'
        if (data.status === 'SUCCESS') {
          console.log('Payment SUCCESS detected!');
          onEvent(data);
        }
      } catch (error) {
        if (onError) {
          onError(error instanceof Error ? error : new Error('Parse error'));
        }
      }
    });

    return () => {
      console.log('Closing SSE connection for order:', orderId);
      eventSource.close();
    };
  }

  // Listen to order status events via SSE
  listenToOrderStatusEvents(
    orderId: number,
    onStatusChange: (order: UserOrder) => void,
    onError?: (error: Error) => void
  ): () => void {
    const eventSource = new EventSource(`${API_BASE_URL}/orders/${orderId}/stream`);

    // Listen for 'connected' event
    eventSource.addEventListener('connected', (event: MessageEvent) => {
      console.log(`Order SSE connected for order ${orderId}:`, event.data);
    });

    // Listen for 'heartbeat' event
    eventSource.addEventListener('heartbeat', (event: MessageEvent) => {
      console.log(`Order SSE heartbeat for order ${orderId}:`, event.data);
    });

    // Listen for 'order-status-changed' event
    eventSource.addEventListener('order-status-changed', (event: MessageEvent) => {
      try {
        console.log(`Order status changed event received for ${orderId}:`, event.data);

        // Parse JSON từ event.data
        const orderData: UserOrder = JSON.parse(event.data);
        console.log('Order status event parsed:', orderData);

        // Call callback với dữ liệu order mới
        onStatusChange(orderData);
      } catch (error) {
        if (onError) {
          onError(error instanceof Error ? error : new Error('Parse error'));
        }
      }
    });

    return () => {
      console.log('Closing order SSE connection for order:', orderId);
      eventSource.close();
    };
  }
}

export const apiService = new ApiService();

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('vi-VN').format(price) + ' VNĐ';
};

export const getPlaceholderImage = (categoryName: string): string => {
  const placeholders: Record<string, string> = {
    'Đồ ăn': '🍽️',
    'Đồ uống': '🥤',
    'Đồ ăn thêm': '🍯',
    'food': '🍽️',
    'drinks': '🥤',
    'additional': '🍯',
  };

  return placeholders[categoryName.toLowerCase()] || '🍽️';
};

export const CATEGORY_IDS = {
  FOOD: 1,
  DRINKS: 2,
  ADDITIONAL: 3,
} as const;

