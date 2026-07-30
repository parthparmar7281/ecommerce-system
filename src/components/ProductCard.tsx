import { useCart } from "../context/CartContext";
import type { Product } from "../types/product";
import type { UserProfile } from "../types/user";
import { canEditProduct, canDeleteProduct } from "../utils/permission";

interface ProductCardProps {
    product: Product;
    user: UserProfile | null;
    onEdit: (product: Product) => void;
    onDelete: (id: number) => void;
}

const ProductCard = ({
    product,
    user,
    onEdit,
    onDelete,
}: ProductCardProps) => {
    const { addToCart } = useCart();

    const handleAddToCart = async () => {
        if (product.id) {
            await addToCart(product.id);
        }
    };
    const showEdit = canEditProduct(user, product);
    const showDelete = canDeleteProduct(user, product);

    const originalPrice = Number(product.price || 0);
    const hasDiscount = !!product.offer_price && Number(product.offer_price) < originalPrice;
    const activePrice = hasDiscount ? Number(product.offer_price) : originalPrice;

    return (
        <div className="single-product-card">
            <div className="product-card-top">
                {product.image_url ? (
                    <div className="product-card-img-area">
                        <img
                            src={product.image_url}
                            alt={product.name}
                            className="product-card-image"
                            loading="lazy"
                            decoding="async"
                        />
                    </div>
                ) : (
                    <div className="product-card-icon-area">
                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                    </div>
                )}
                {hasDiscount && (
                    <span className="product-sale-badge">Sale</span>
                )}
            </div>

            <div className="product-card-info">
                <h4 className="product-card-title">{product.name}</h4>
                <p className="product-card-desc" title={product.description}>
                    {product.description || "No description provided."}
                </p>
            </div>

            <div className="product-card-meta">
                <div className="product-card-price-section">
                    <span className="price-lbl">Price</span>
                    {hasDiscount ? (
                        <div className="product-card-discount-container">
                            <span className="price-val discounted-price">₹{activePrice.toFixed(2)}</span>
                            <span className="original-price-cross">₹{originalPrice.toFixed(2)}</span>
                        </div>
                    ) : (
                        <span className="price-val">₹{originalPrice.toFixed(2)}</span>
                    )}
                </div>
            </div>
            {user?.role === "Buyer" && (
                <div className="product-card-actions">
                    <button className="btn-add-to-cart" onClick={handleAddToCart}>
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ marginRight: '6px' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                        </svg>
                        Add To Cart
                    </button>
                </div>
            )}

            {(showEdit || showDelete) && (
                <div className="product-card-actions">
                    {showEdit && (
                        <button
                            className="btn-card-action btn-edit"
                            onClick={() => onEdit(product)}
                            aria-label="Edit product"
                        >
                            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                            </svg>
                            <span>Edit</span>
                        </button>
                    )}

                    {showDelete && (
                        <button
                            className="btn-card-action btn-delete"
                            onClick={() => onDelete(product.id!)}
                            aria-label="Delete product"
                        >
                            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                            <span>Delete</span>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default ProductCard;