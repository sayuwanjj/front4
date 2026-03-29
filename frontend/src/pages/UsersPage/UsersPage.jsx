import React, { useEffect, useState } from "react";
import "./UsersPage.scss";
import UsersList from "../../components/UsersList";
import UserModal from "../../components/UserModal";
import { api } from "../../api";

export default function UsersPage() {
    const [products, setProducts] = useState([]);
    const [user, setUser] = useState(null); // Текущий пользователь [cite: 391]
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("create");
    const [editingProduct, setEditingProduct] = useState(null);
    const [actionId, setActionId] = useState("");
    const [usersList, setUsersList] = useState([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [authMode, setAuthMode] = useState("login");
    const [authForm, setAuthForm] = useState({
        email: "",
        password: "",
        first_name: "",
        last_name: "",
    });

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = localStorage.getItem("accessToken");
        if (token) {
            try {
                const userData = await api.getMe(); // Валидируем токен [cite: 245, 393]
                setUser(userData);
                loadProducts();
            } catch {
                handleLogout();
            }
        }
    };

    const handleLogin = async (event) => {
        event.preventDefault();
        const email = authForm.email.trim();
        const password = authForm.password.trim();
        try {
            await api.login({ email, password }); // Получаем токен [cite: 65, 134]
            await checkAuth();
            setAuthForm((prev) => ({ ...prev, password: "" }));
            alert("Welcome!");
        } catch (error) {
            alert("Login failed: " + (error.response?.data?.error || "Unknown error"));
        }
    };

    const handleRegister = async (event) => {
        event.preventDefault();
        const email = authForm.email.trim();
        const password = authForm.password.trim();
        const first_name = authForm.first_name.trim();
        const last_name = authForm.last_name.trim();
        try {
            await api.register({ email, password, first_name, last_name });
            await api.login({ email, password });
            await checkAuth();
            setAuthForm({ email: "", password: "", first_name: "", last_name: "" });
        } catch (error) {
            alert("Registration failed: " + (error.response?.data?.error || "Unknown error"));
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        setUser(null);
    };

    const loadProducts = async () => {
        try {
            setLoading(true);
            const data = await api.getProducts();
            setProducts(data);
        } catch (error) {
            alert("Failed to load products");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!user) return alert("Please login first");
        if (user.role !== "admin") return alert("Only admin can delete products");
        if (!window.confirm("Delete?")) return;
        try {
            await api.deleteProduct(id); // Защищенный маршрут [cite: 397]
            setProducts((prev) => prev.filter((p) => p.id !== id));
        } catch (error) {
            alert("Access denied or session expired");
        }
    };

    const handleSubmitModal = async (payload) => {
        try {
            if (modalMode === "create") {
                if (!user || (user.role !== "seller" && user.role !== "admin")) {
                    return alert("Only seller or admin can create products");
                }
                const res = await api.createProduct(payload);
                setProducts([...products, res]);
            } else {
                if (!user || (user.role !== "seller" && user.role !== "admin")) {
                    return alert("Only seller or admin can edit products");
                }
                const res = await api.updateProduct(payload.id, payload); // [cite: 396]
                setProducts(products.map(p => p.id === payload.id ? res : p));
            }
            setModalOpen(false);
        } catch (error) {
            if (error.response?.status === 401) {
                handleLogout();
                alert("Session expired. Please login again.");
            } else {
                alert("Error saving product. Are you logged in?");
            }
        }
    };

    const handleAuthInput = (key, value) => {
        setAuthForm((prev) => ({ ...prev, [key]: value }));
    };

    const loadUsers = async () => {
        try {
            setUsersLoading(true);
            const data = await api.getUsers();
            setUsersList(data);
        } catch (error) {
            alert("Failed to load users");
        } finally {
            setUsersLoading(false);
        }
    };

    const handleUserEdit = async (current) => {
        const email = prompt("Email:", current.email);
        if (email === null) return;
        const first_name = prompt("First name:", current.first_name ?? "");
        if (first_name === null) return;
        const last_name = prompt("Last name:", current.last_name ?? "");
        if (last_name === null) return;
        const role = prompt("Role (user/seller/admin):", current.role);
        if (role === null) return;
        try {
            const updated = await api.updateUser(current.id, { email, first_name, last_name, role });
            setUsersList((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
        } catch (error) {
            alert("Failed to update user");
        }
    };

    const handleUserBlock = async (id) => {
        if (!window.confirm("Block this user?")) return;
        try {
            await api.blockUser(id);
            setUsersList((prev) => prev.map((u) => (u.id === id ? { ...u, blocked: true } : u)));
        } catch (error) {
            alert("Failed to block user");
        }
    };

    return (
        <div className="page">
            <header className="header">
                <div className="header__inner">
                    <div className="brand">TechStore</div>
                    <div className="header__right">
                        {user ? (
                            <>
                                <span>Hello, {user.first_name || user.email}</span>
                                <button className="btn btn--link" onClick={handleLogout}>Logout</button>
                            </>
                        ) : (
                            <span className="header__hint">Please login or register</span>
                        )}
                    </div>
                </div>
            </header>

            <main className="main">
                <div className="container">
                    {!user ? (
                        <section className="auth">
                            <div className="auth__panel">
                                <div className="auth__tabs">
                                    <button
                                        className={`btn ${authMode === "login" ? "btn--primary" : ""}`}
                                        onClick={() => setAuthMode("login")}
                                    >
                                        Login
                                    </button>
                                    <button
                                        className={`btn ${authMode === "register" ? "btn--primary" : ""}`}
                                        onClick={() => setAuthMode("register")}
                                    >
                                        Register
                                    </button>
                                </div>

                                {authMode === "login" ? (
                                    <form className="form auth__form" onSubmit={handleLogin}>
                                        <label className="label">
                                            Email
                                            <input
                                                className="input"
                                                value={authForm.email}
                                                onChange={(event) => handleAuthInput("email", event.target.value)}
                                                placeholder="you@example.com"
                                            />
                                        </label>
                                        <label className="label">
                                            Password
                                            <input
                                                className="input"
                                                type="password"
                                                value={authForm.password}
                                                onChange={(event) => handleAuthInput("password", event.target.value)}
                                                placeholder="••••••••"
                                            />
                                        </label>
                                        <div className="auth__actions">
                                            <button type="submit" className="btn btn--primary">
                                                Login
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <form className="form auth__form" onSubmit={handleRegister}>
                                        <label className="label">
                                            First name
                                            <input
                                                className="input"
                                                value={authForm.first_name}
                                                onChange={(event) => handleAuthInput("first_name", event.target.value)}
                                                placeholder="Ivan"
                                            />
                                        </label>
                                        <label className="label">
                                            Last name
                                            <input
                                                className="input"
                                                value={authForm.last_name}
                                                onChange={(event) => handleAuthInput("last_name", event.target.value)}
                                                placeholder="Petrov"
                                            />
                                        </label>
                                        <label className="label">
                                            Email
                                            <input
                                                className="input"
                                                value={authForm.email}
                                                onChange={(event) => handleAuthInput("email", event.target.value)}
                                                placeholder="you@example.com"
                                            />
                                        </label>
                                        <label className="label">
                                            Password
                                            <input
                                                className="input"
                                                type="password"
                                                value={authForm.password}
                                                onChange={(event) => handleAuthInput("password", event.target.value)}
                                                placeholder="••••••••"
                                            />
                                        </label>
                                        <div className="auth__actions">
                                            <button type="submit" className="btn btn--primary">
                                                Create account
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </section>
                    ) : (
                        <>
                            <div className="toolbar">
                                <h1 className="title">Products Catalog</h1>
                                <div className="toolbar__actions">
                                    <input
                                        className="input toolbar__input"
                                        value={actionId}
                                        onChange={(event) => setActionId(event.target.value)}
                                        placeholder="Product ID"
                                    />
                                    <button
                                        className="btn"
                                        onClick={async () => {
                                            const id = actionId.trim() || prompt("Product ID");
                                            if (!id) return;
                                            try {
                                                const data = await api.getProductById(id);
                                                alert(
                                                    `ID: ${data.id}\n${data.title ?? data.name}\n${data.category}\n${data.description}\nPrice: ${data.price}`
                                                );
                                            } catch {
                                                alert("Failed to load product by id");
                                            }
                                        }}
                                    >
                                        Find by ID
                                    </button>
                                    <button
                                        className="btn"
                                        onClick={async () => {
                                            if (!user || (user.role !== "seller" && user.role !== "admin")) {
                                                return alert("Only seller or admin can edit products");
                                            }
                                            const id = actionId.trim() || prompt("Product ID");
                                            if (!id) return;
                                            try {
                                                const data = await api.getProductById(id);
                                                setEditingProduct(data);
                                                setModalMode("edit");
                                                setModalOpen(true);
                                            } catch {
                                                alert("Failed to load product by id");
                                            }
                                        }}
                                    >
                                        Edit by ID
                                    </button>
                                    <button
                                        className="btn btn--danger"
                                        onClick={async () => {
                                            if (!user || user.role !== "admin") {
                                                return alert("Only admin can delete products");
                                            }
                                            const id = actionId.trim() || prompt("Product ID");
                                            if (!id) return;
                                            if (!window.confirm("Delete?")) return;
                                            try {
                                                await api.deleteProduct(id);
                                                setProducts((prev) => prev.filter((p) => String(p.id) !== String(id)));
                                                setActionId("");
                                                await loadProducts();
                                            } catch {
                                                alert("Failed to delete product by id");
                                            }
                                        }}
                                    >
                                        Delete by ID
                                    </button>
                                    <button
                                        className="btn btn--primary"
                                        onClick={() => {
                                            if (!user || (user.role !== "seller" && user.role !== "admin")) {
                                                return alert("Only seller or admin can add products");
                                            }
                                            setModalMode("create");
                                            setModalOpen(true);
                                        }}
                                    >
                                        + Add product
                                    </button>
                                </div>
                            </div>

                            {loading ? (
                                <div className="empty">Loading...</div>
                            ) : (
                                <UsersList
                                    products={products}
                                    onView={async (id) => {
                                        try {
                                            const data = await api.getProductById(id);
                                            alert(
                                                `ID: ${data.id}\n${data.title ?? data.name}\n${data.category}\n${data.description}\nPrice: ${data.price}`
                                            );
                                        } catch {
                                            alert("Failed to load product by id");
                                        }
                                    }}
                                    onEdit={(p) => {
                                        if (!user || (user.role !== "seller" && user.role !== "admin")) {
                                            return alert("Only seller or admin can edit products");
                                        }
                                        setEditingProduct(p);
                                        setModalMode("edit");
                                        setModalOpen(true);
                                    }}
                                    onDelete={handleDelete}
                                />
                            )}

                            {user?.role === "admin" && (
                                <section className="usersPanel">
                                    <div className="usersPanel__header">
                                        <h2 className="usersPanel__title">Users Management</h2>
                                        <button className="btn" onClick={loadUsers}>
                                            Refresh users
                                        </button>
                                    </div>

                                    {usersLoading ? (
                                        <div className="empty">Loading users...</div>
                                    ) : (
                                        <div className="usersPanel__list">
                                            {usersList.map((u) => (
                                                <div key={u.id} className="usersPanel__row">
                                                    <div>
                                                        <div className="usersPanel__name">{u.first_name} {u.last_name}</div>
                                                        <div className="usersPanel__meta">{u.email}</div>
                                                        <div className="usersPanel__meta">ID: {u.id}</div>
                                                        <div className="usersPanel__meta">Role: {u.role}</div>
                                                        <div className="usersPanel__meta">Blocked: {u.blocked ? "yes" : "no"}</div>
                                                    </div>
                                                    <div className="usersPanel__actions">
                                                        <button className="btn" onClick={() => handleUserEdit(u)}>
                                                            Edit
                                                        </button>
                                                        <button className="btn btn--danger" onClick={() => handleUserBlock(u.id)}>
                                                            Block
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            {!usersList.length && (
                                                <div className="empty">No users found.</div>
                                            )}
                                        </div>
                                    )}
                                </section>
                            )}
                        </>
                    )}
                </div>
            </main>

            <UserModal
                open={modalOpen}
                mode={modalMode}
                initialProduct={editingProduct}
                onClose={() => setModalOpen(false)}
                onSubmit={handleSubmitModal}
            />
        </div>
    );
}
