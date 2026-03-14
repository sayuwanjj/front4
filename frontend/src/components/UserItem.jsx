import React from "react";

export default function UserItem({ product, onEdit, onDelete }) {
    return (
        <article className="productCard">
            <div className="productMedia">
                {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="productImage" />
                ) : (
                    <div className="productImage productImage--placeholder">No image</div>
                )}
            </div>

            <div className="productBody">
                <div className="productTopRow">
                    <h3 className="productTitle">{product.name}</h3>
                    <span className="productCategory">{product.category}</span>
                </div>

                <p className="productDescription">{product.description}</p>

                <div className="productMeta">
                    <span className="metaBadge">Price: ${product.price.toFixed(2)}</span>
                    <span className="metaBadge">Stock: {product.stock}</span>
                    <span className="metaBadge">Rating: {product.rating?.toFixed(1) ?? "0.0"}/5</span>
                </div>

                <div className="userActions">
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
