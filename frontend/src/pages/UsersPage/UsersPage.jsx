import React, { useEffect, useState } from "react";
import "./UsersPage.scss";
import UsersList from "../../components/UsersList";
import UserModal from "../../components/UserModal";
import { api } from "../../api";

function getApiErrorMessage(error, fallbackMessage) {
    const details = error?.response?.data?.details;
    if (Array.isArray(details) && details.length > 0) {
        return `${fallbackMessage}: ${details.join(", ")}`;
    }
    const serverMessage = error?.response?.data?.error;
    if (serverMessage) {
        return `${fallbackMessage}: ${serverMessage}`;
    }
    return fallbackMessage;
}

export default function UsersPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("create");
    const [editingProduct, setEditingProduct] = useState(null);

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            setLoading(true);
            const data = await api.getProducts();
            setProducts(data);
        } catch (error) {
            console.error(error);
            alert("Failed to load products");
        } finally {
            setLoading(false);
        }
    };

    const openCreate = () => {
        setModalMode("create");
        setEditingProduct(null);
        setModalOpen(true);
    };

    const openEdit = (product) => {
        setModalMode("edit");
        setEditingProduct(product);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditingProduct(null);
    };

    const handleDelete = async (id) => {
        const ok = window.confirm("Delete this product?");
        if (!ok) return;

        try {
            await api.deleteProduct(id);
            setProducts((prev) => prev.filter((item) => item.id !== id));
        } catch (error) {
            console.error(error);
            alert("Failed to delete product");
        }
    };

    const handleSubmitModal = async (payload) => {
        try {
            if (modalMode === "create") {
                const newProduct = await api.createProduct(payload);
                setProducts((prev) => [...prev, newProduct]);
            } else {
                const updatedProduct = await api.updateProduct(payload.id, payload);
                setProducts((prev) =>
                    prev.map((item) => (item.id === payload.id ? updatedProduct : item))
                );
            }
            closeModal();
        } catch (error) {
            console.error(error);
            alert(getApiErrorMessage(error, "Failed to save product"));
        }
    };

    return (
        <div className="page">
            <header className="header">
                <div className="header__inner">
                    <div className="brand">TechStore</div>
                    <div className="header__right">React + Express</div>
                </div>
            </header>

            <main className="main">
                <div className="container">
                    <div className="toolbar">
                        <h1 className="title">Products Catalog</h1>
                        <button className="btn btn--primary" onClick={openCreate}>
                            + Add product
                        </button>
                    </div>

                    {loading ? (
                        <div className="empty">Loading...</div>
                    ) : (
                        <UsersList products={products} onEdit={openEdit} onDelete={handleDelete} />
                    )}
                </div>
            </main>

            <footer className="footer">
                <div className="footer__inner">{new Date().getFullYear()} TechStore</div>
            </footer>

            <UserModal
                open={modalOpen}
                mode={modalMode}
                initialProduct={editingProduct}
                onClose={closeModal}
                onSubmit={handleSubmitModal}
            />
        </div>
    );
}
