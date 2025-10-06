// API service for backend communication
const API_BASE_URL = 'http://192.168.1.12:8080/api';

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
      console.error('API Request failed:', error);
      return { 
        data: [] as unknown as T, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  // Fetch all products
  async getAllProducts(): Promise<ApiResponse<Product[]>> {
    return this.fetchWithErrorHandling<Product[]>(`${API_BASE_URL}/menu/products/getAll`);
  }

  // Fetch products by category ID
  async getProductsByCategory(categoryId: number): Promise<ApiResponse<Product[]>> {
    return this.fetchWithErrorHandling<Product[]>(`${API_BASE_URL}/menu/products/category/${categoryId}`);
  }

  // Add new product
  async addProduct(productData: {
    name: string;
    price: number;
    categoryId: number;
    image?: string;
  }): Promise<ApiResponse<Product>> {
    console.log('🚀 Adding new product:', productData);
    
    return this.fetchWithErrorHandling<Product>(`${API_BASE_URL}/menu/products/create`, {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  // Update product
  async updateProduct(productId: number, productData: {
    productId: number;
    name: string;
    price: number;
    image: string;
    categoryId: number;
  }): Promise<ApiResponse<Product>> {
    console.log('🔄 Updating product:', productId, productData);
    
    return this.fetchWithErrorHandling<Product>(`${API_BASE_URL}/menu/products/update/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  }

  // Delete product (for future use)
  async deleteProduct(productId: number): Promise<ApiResponse<void>> {
    return this.fetchWithErrorHandling<void>(`${API_BASE_URL}/menu/products/delete/${productId}`, {
      method: 'DELETE',
    });
  }

  // Submit order to backend
  async createOrder(orderData: CreateOrderRequest): Promise<ApiResponse<Order>> {
    console.log('🚀 Creating new order:', orderData);
    
    return this.fetchWithErrorHandling<Order>(`${API_BASE_URL}/orders/create`, {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  // Get order by ID (for future use)
  async getOrder(orderId: number): Promise<ApiResponse<Order>> {
    return this.fetchWithErrorHandling<Order>(`${API_BASE_URL}/orders/${orderId}`);
  }

  // Get all orders (for future use)
  async getOrders(): Promise<ApiResponse<Order[]>> {
    return this.fetchWithErrorHandling<Order[]>(`${API_BASE_URL}/orders`);
  }
}

export const apiService = new ApiService();

// Helper function to format price for display
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('vi-VN').format(price) + ' VNĐ';
};

// Helper function to get placeholder image for items without images
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

// Category ID mapping (based on your backend structure)
export const CATEGORY_IDS = {
  FOOD: 1,        // Đồ ăn
  DRINKS: 2,      // Đồ uống  
  ADDITIONAL: 3,  // Đồ ăn thêm
} as const;

