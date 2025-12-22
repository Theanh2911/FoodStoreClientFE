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

export interface OrderItem {
  productId: number;
  name: string;
  quantity: number;
  note?: string;
}

// Legacy - Keep for backward compatibility
export interface CreateOrderRequest {
  name: string;
  tableNumber: number;
  sessionId: string;
  userId?: string;
  total: number;
  items: OrderItem[];
}

// New API structures
export interface OrderItemRequest {
  productId: number;
  quantity: number;
  note?: string;
}

// Unified order request structure
export interface UnifiedOrderRequest {
  sessionId: string;
  tableNumber: number;
  name?: string; // Tên khách (guest hoặc user đã đăng nhập)
  userId?: number; // Id khách hàng (khi đã đăng nhập)
  total: number;
  items: OrderItemRequest[];
}

// Legacy - Keep for backward compatibility
export interface AuthenticatedOrderRequest {
  sessionId: string;
  tableNumber: number;
  userId?: number;
  total: number;
  items: OrderItemRequest[];
}

export interface GuestOrderRequest {
  name: string;
  sessionId: string;
  total: number;
  items: OrderItemRequest[];
}

export interface Order {
  orderId: number;
  name: string;
  tableNumber: number;
  total: number;
  items: OrderItem[];
  status?: string;
  createdAt?: string;
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
  totalAmount: number;
  orderTime: string;
  status: string;
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

  async addProduct(productData: {
    name: string;
    price: number;
    categoryId: number;
    image?: string;
  }): Promise<ApiResponse<Product>> {
    
    return this.fetchWithErrorHandling<Product>(`${API_BASE_URL}/menu/products/create`, {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  async updateProduct(productId: number, productData: {
    productId: number;
    name: string;
    price: number;
    image: string;
    categoryId: number;
  }): Promise<ApiResponse<Product>> {

    return this.fetchWithErrorHandling<Product>(`${API_BASE_URL}/menu/products/update/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  }

  async deleteProduct(productId: number): Promise<ApiResponse<void>> {
    return this.fetchWithErrorHandling<void>(`${API_BASE_URL}/menu/products/delete/${productId}`, {
      method: 'DELETE',
    });
  }

  // Unified order creation - Backend phân biệt qua Authorization header
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

  // Legacy methods - Keep for backward compatibility
  async createAuthenticatedOrder(orderData: AuthenticatedOrderRequest): Promise<ApiResponse<Order>> {
    const token = localStorage.getItem('accessToken');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return this.fetchWithErrorHandling<Order>(`${API_BASE_URL}/orders/create`, {
      method: 'POST',
      body: JSON.stringify(orderData),
      headers,
    });
  }

  async createGuestOrder(orderData: GuestOrderRequest): Promise<ApiResponse<Order>> {
    return this.fetchWithErrorHandling<Order>(`${API_BASE_URL}/orders/create`, {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async getOrder(orderId: number): Promise<ApiResponse<Order>> {
    return this.fetchWithErrorHandling<Order>(`${API_BASE_URL}/orders/${orderId}`);
  }

  // Get order detail with full information (UserOrder format)
  async getOrderDetail(orderId: number): Promise<ApiResponse<UserOrder>> {
    return this.fetchWithErrorHandling<UserOrder>(`${API_BASE_URL}/orders/${orderId}`);
  }

  async getOrders(): Promise<ApiResponse<Order[]>> {
    return this.fetchWithErrorHandling<Order[]>(`${API_BASE_URL}/orders`);
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

  async logout(): Promise<ApiResponse<{ message: string }>> {
    const token = localStorage.getItem('accessToken');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return this.fetchWithErrorHandling<{ message: string }>(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers,
    });
  }

  // Listen to payment events via SSE
  listenToPaymentEvents(
    orderId: number,
    onEvent: (event: PaymentEvent) => void,
    onError?: (error: Error) => void
  ): () => void {
    const eventSource = new EventSource(`${API_BASE_URL}/payment/events/${orderId}`);

    eventSource.onmessage = (event) => {
      try {
        const data: PaymentEvent = JSON.parse(event.data);
        console.log('Payment event received:', data);
        onEvent(data);
      } catch (error) {
        console.error('Error parsing payment event:', error);
        if (onError) {
          onError(error instanceof Error ? error : new Error('Parse error'));
        }
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      if (onError) {
        onError(new Error('SSE connection failed'));
      }
    };

    // Return cleanup function
    return () => {
      console.log('Closing SSE connection for order:', orderId);
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

