import React, { useEffect, useState } from "react";

export default function UserModal({ open, mode, initialProduct, onClose, onSubmit }) {
    const [form, setForm] = useState({
        name: "",
        category: "",
        description: "",
        price: "",
        stock: "",
        rating: "",
        imageUrl: "",
    });

    useEffect(() => {
        if (!open) return;

        setForm({
            name: initialProduct?.name ?? initialProduct?.title ?? "",
            category: initialProduct?.category ?? "",
            description: initialProduct?.description ?? "",
            price: initialProduct?.price != null ? String(initialProduct.price) : "",
            stock: initialProduct?.stock != null ? String(initialProduct.stock) : "",
            rating: initialProduct?.rating != null ? String(initialProduct.rating) : "",
            imageUrl: initialProduct?.imageUrl ?? "",
        });
    }, [open, initialProduct]);

    if (!open) return null;

    const title = mode === "edit" ? "Edit product" : "Create product";

    const setValue = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        const name = form.name.trim();
        const category = form.category.trim();
        const description = form.description.trim();
        const price = Number(form.price);
        const stock = Number(form.stock);
        const rating = form.rating.trim() === "" ? 0 : Number(form.rating);

        if (!name || !category || !description) {
            alert("Name, category and description are required");
            return;
        }

        if (!Number.isFinite(price) || price < 0) {
            alert("Price must be a non-negative number");
            return;
        }

        if (!Number.isInteger(stock) || stock < 0) {
            alert("Stock must be a non-negative integer");
            return;
        }

        if (!Number.isFinite(rating) || rating < 0 || rating > 5) {
            alert("Rating must be between 0 and 5");
            return;
        }

        const payload = {
            name,
            category,
            description,
            price,
            stock,
            rating,
            imageUrl: form.imageUrl.trim(),
        };

        if (mode === "edit" && initialProduct?.id) {
            payload.id = initialProduct.id;
        }

        onSubmit(payload);
    };

    return (
        <div className="backdrop" onMouseDown={onClose}>
            <div className="modal" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
                <div className="modal__header">
                    <div className="modal__title">{title}</div>
                    <button className="iconBtn" onClick={onClose} aria-label="Close modal">
                        x
                    </button>
                </div>

                <form className="form" onSubmit={handleSubmit}>
                    <label className="label">
                        Name
                        <input
                            className="input"
                            value={form.name}
                            onChange={(event) => setValue("name", event.target.value)}
                            placeholder="Aurora Mechanical Keyboard"
                            autoFocus
                        />
                    </label>

                    <label className="label">
                        Category
                        <input
                            className="input"
                            value={form.category}
                            onChange={(event) => setValue("category", event.target.value)}
                            placeholder="Peripherals"
                        />
                    </label>

                    <label className="label form__wide">
                        Description
                        <textarea
                            className="input input--textarea"
                            value={form.description}
                            onChange={(event) => setValue("description", event.target.value)}
                            placeholder="Short product description"
                        />
                    </label>

                    <label className="label">
                        Price
                        <input
                            className="input"
                            value={form.price}
                            onChange={(event) => setValue("price", event.target.value)}
                            placeholder="99.99"
                            inputMode="decimal"
                        />
                    </label>

                    <label className="label">
                        Stock
                        <input
                            className="input"
                            value={form.stock}
                            onChange={(event) => setValue("stock", event.target.value)}
                            placeholder="20"
                            inputMode="numeric"
                        />
                    </label>

                    <label className="label">
                        Rating
                        <input
                            className="input"
                            value={form.rating}
                            onChange={(event) => setValue("rating", event.target.value)}
                            placeholder="4.5"
                            inputMode="decimal"
                        />
                    </label>

                    <label className="label form__wide">
                        Image URL
                        <input
                            className="input"
                            value={form.imageUrl}
                            onChange={(event) => setValue("imageUrl", event.target.value)}
                            placeholder="https://..."
                        />
                    </label>

                    <div className="modal__footer form__wide">
                        <button type="button" className="btn" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn--primary">
                            {mode === "edit" ? "Save" : "Create"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
