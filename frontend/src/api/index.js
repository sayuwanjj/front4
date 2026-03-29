import axios from "axios";

const apiClient = axios.create({
    baseURL: "http://localhost:3000/api",
    headers: {
        "Content-Type": "application/json",
        accept: "application/json",
    },
});

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

let isRefreshing = false;
let refreshQueue = [];

const resolveRefreshQueue = (token) => {
    refreshQueue.forEach((cb) => cb(token));
    refreshQueue = [];
};

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const status = error.response?.status;
        const refreshToken = localStorage.getItem("refreshToken");

        const isAuthRequest =
            originalRequest?.url?.includes("/auth/login") ||
            originalRequest?.url?.includes("/auth/register") ||
            originalRequest?.url?.includes("/auth/refresh");

        if (status === 401 && refreshToken && !originalRequest._retry && !isAuthRequest) {
            originalRequest._retry = true;

            if (isRefreshing) {
                return new Promise((resolve) => {
                    refreshQueue.push((newToken) => {
                        originalRequest.headers.Authorization = `Bearer ${newToken}`;
                        resolve(apiClient(originalRequest));
                    });
                });
            }

            isRefreshing = true;
            try {
                const refreshResponse = await apiClient.post(
                    "/auth/refresh",
                    {},
                    { headers: { "x-refresh-token": refreshToken } }
                );
                const { accessToken, refreshToken: newRefresh } = refreshResponse.data;
                if (accessToken) {
                    localStorage.setItem("accessToken", accessToken);
                }
                if (newRefresh) {
                    localStorage.setItem("refreshToken", newRefresh);
                }
                resolveRefreshQueue(accessToken);
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return apiClient(originalRequest);
            } catch (refreshError) {
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");
                resolveRefreshQueue(null);
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export const api = {
    register: async (payload) => {
        const response = await apiClient.post("/auth/register", payload);
        return response.data;
    },
    login: async (credentials) => {
        const response = await apiClient.post("/auth/login", credentials);
        if (response.data.accessToken) {
            localStorage.setItem("accessToken", response.data.accessToken);
        }
        if (response.data.refreshToken) {
            localStorage.setItem("refreshToken", response.data.refreshToken);
        }
        return response.data;
    },
    refresh: async () => {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) throw new Error("No refresh token");
        const response = await apiClient.post(
            "/auth/refresh",
            {},
            { headers: { "x-refresh-token": refreshToken } }
        );
        if (response.data.accessToken) {
            localStorage.setItem("accessToken", response.data.accessToken);
        }
        if (response.data.refreshToken) {
            localStorage.setItem("refreshToken", response.data.refreshToken);
        }
        return response.data;
    },
    getMe: async () => {
        const response = await apiClient.get("/auth/me");
        return response.data;
    },
    getUsers: async () => {
        const response = await apiClient.get("/users");
        return response.data;
    },
    getUserById: async (id) => {
        const response = await apiClient.get(`/users/${id}`);
        return response.data;
    },
    updateUser: async (id, payload) => {
        const response = await apiClient.put(`/users/${id}`, payload);
        return response.data;
    },
    blockUser: async (id) => {
        await apiClient.delete(`/users/${id}`);
    },
    createProduct: async (product) => {
        const payload = {
            title: product.title ?? product.name,
            category: product.category,
            description: product.description,
            price: Number(product.price),
            stock: product.stock,
            rating: product.rating,
            imageUrl: product.imageUrl,
        };
        const response = await apiClient.post("/products", payload);
        return response.data;
    },
    getProducts: async () => {
        const response = await apiClient.get("/products");
        return response.data;
    },
    getProductById: async (id) => {
        const response = await apiClient.get(`/products/${id}`);
        return response.data;
    },
    updateProduct: async (id, product) => {
        const payload = {
            title: product.title ?? product.name,
            category: product.category,
            description: product.description,
            price: Number(product.price),
            stock: product.stock,
            rating: product.rating,
            imageUrl: product.imageUrl,
        };
        const response = await apiClient.put(`/products/${id}`, payload);
        return response.data;
    },
    deleteProduct: async (id) => {
        await apiClient.delete(`/products/${id}`);
    },
};
