import axios from "axios";

const apiClient = axios.create({
    baseURL: "http://localhost:3000/api",
    headers: {
        "Content-Type": "application/json",
        accept: "application/json",
    },
});

// Добавляем токен в каждый заголовок для защищенных маршрутов [cite: 13, 244]
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const api = {
    login: async (credentials) => {

    const response = await apiClient.post("/auth/login", credentials);
    if (response.data.accessToken) {
        localStorage.setItem("accessToken", response.data.accessToken);
    }
    return response.data;
},
    getMe: async () => {
        const response = await apiClient.get("/auth/me");
        return response.data;
    },
    getProducts: async () => {
        const response = await apiClient.get("/products");
        return response.data;
    },
    createProduct: async (product) => {
        // Заменяем name на title для бэкенда
        const payload = { ...product, title: product.name };
        const response = await apiClient.post("/products", payload);
        return response.data;
    },
    updateProduct: async (id, product) => {
        const payload = {
            title: product.name, // Используем title
            category: product.category,
            description: product.description,
            price: Number(product.price),
        };
        const response = await apiClient.put(`/products/${id}`, payload); // Используем PUT
        return response.data;
    },
    deleteProduct: async (id) => {
        await apiClient.delete(`/products/${id}`);
    },
};