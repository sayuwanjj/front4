import React from "react";
import UserItem from "./UserItem";

export default function UsersList({ products, onEdit, onDelete, onView }) {
    if (!products.length) {
        return <div className="empty">No products yet.</div>;
    }

    return (
        <div className="list">
            {products.map((product) => (
                <UserItem
                    key={product.id}
                    product={product}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onView={onView}
                />
            ))}
        </div>
    );
}
