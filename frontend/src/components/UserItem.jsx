import React from "react";

export default function UserItem({ product, onEdit, onDelete, onView }) {
    const price = Number(product.price);
    const title = product.name ?? product.title;
    return (
        <article className="productCard">
            <div className="productMedia">
                {product.imageUrl ? (
                    <img src={product.imageUrl} alt={title} className="productImage" />
                ) : (
                    <div className="productImage productImage--placeholder">No image</div>
                )}
            </div>
            <div className="productBody">
                <div className="productTopRow">
                    <h3 className="productTitle">{title}</h3>
                    <span className="productCategory">{product.category}</span>
                </div>

                <p className="productDescription">{product.description}</p>

                <div className="productMeta">
                    <span className="metaBadge">
                        Price: ${Number.isFinite(price) ? price.toFixed(2) : "0.00"}
                    </span>
                    <span className="metaBadge">Stock: {product.stock ?? 0}</span>
                    <span className="metaBadge">Rating: {product.rating?.toFixed(1) ?? "0.0"}/5</span>
                    <span className="metaBadge">ID: {product.id}</span>
                </div>

                <div className="userActions">
                    <button className="btn" onClick={() => onView(product.id)}>
                        View
                    </button>
                    <button className="btn" onClick={() => onEdit(product)}>
                        Edit
                    </button>
                    <button className="btn btn--danger" onClick={() => onDelete(product.id)}>
                        Delete
                    </button>
                </div>
            </div>
        </article>
    );
}
