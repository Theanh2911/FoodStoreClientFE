const API_BASE_URL = 'http://localhost:8080/api';

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

export interface CreateOrderRequest {
  name: string;
  tableNumber: number;
  total: number;
  items: OrderItem[];
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

  async createOrder(orderData: CreateOrderRequest): Promise<ApiResponse<Order>> {

    return this.fetchWithErrorHandling<Order>(`${API_BASE_URL}/orders/create`, {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async getOrder(orderId: number): Promise<ApiResponse<Order>> {
    return this.fetchWithErrorHandling<Order>(`${API_BASE_URL}/orders/${orderId}`);
  }

  async getOrders(): Promise<ApiResponse<Order[]>> {
    return this.fetchWithErrorHandling<Order[]>(`${API_BASE_URL}/orders`);
  }

  async register(userData: AuthRegisterRequest): Promise<ApiResponse<AuthResponse>> {
    return this.fetchWithErrorHandling<AuthResponse>(`${API_BASE_URL}/auth/register`, {
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
    return this.fetchWithErrorHandling<UserOrder[]>(`${API_BASE_URL}/auth/orders/${userId}`);
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

