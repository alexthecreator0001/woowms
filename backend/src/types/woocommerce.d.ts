declare module '@woocommerce/woocommerce-rest-api' {
  interface WooCommerceRestApiOptions {
    url: string;
    consumerKey: string;
    consumerSecret: string;
    version?: string;
    wpAPIPrefix?: string;
    queryStringAuth?: boolean;
  }

  interface WooCommerceRestApiResponse<T = unknown> {
    data: T;
    status: number;
    headers: Record<string, string>;
  }

  class WooCommerceRestApi {
    constructor(options: WooCommerceRestApiOptions);
    get<T = unknown>(endpoint: string, params?: Record<string, unknown>): Promise<WooCommerceRestApiResponse<T>>;
    post<T = unknown>(endpoint: string, data?: Record<string, unknown>): Promise<WooCommerceRestApiResponse<T>>;
    put<T = unknown>(endpoint: string, data?: Record<string, unknown>): Promise<WooCommerceRestApiResponse<T>>;
    delete<T = unknown>(endpoint: string, params?: Record<string, unknown>): Promise<WooCommerceRestApiResponse<T>>;
  }

  export default WooCommerceRestApi;
}
