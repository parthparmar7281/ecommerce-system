import { useState } from "react";
import type { Product } from "../types/product";
import { uploadProductImage } from "../services/productService";
import { toast } from "react-hot-toast";

interface ProductFormProps {
    product: Product;
    editingId: number | null;
    onChange: (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => void;
    onImageChange: (imageUrl: string | null) => void;
    onSubmit: (e: React.FormEvent) => void;
    onCancel?: () => void;
}

const ProductForm = ({
    product,
    editingId,
    onChange,
    onImageChange,
    onSubmit,
    onCancel,
}: ProductFormProps) => {
    const [uploading, setUploading] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Please select a valid image file");
            return;
        }

        setUploading(true);
        try {
            const publicUrl = await uploadProductImage(file);
            onImageChange(publicUrl);
            toast.success("Image uploaded successfully!");
        } catch (error: any) {
            console.error("Upload error:", error);
            toast.error("Failed to upload image: " + (error.message || "Unknown error"));
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="products-card">
            <div className="card-title-header">
                <h3>{editingId ? "Edit Product" : "Add New Product"}</h3>
            </div>

            <form onSubmit={onSubmit} className="product-form">
                <div className="form-input-group">
                    <input
                        type="text"
                        name="name"
                        id="prod-name"
                        placeholder=" "
                        value={product.name}
                        onChange={onChange}
                        required
                    />
                    <label htmlFor="prod-name">Product Name</label>
                </div>

                <div className="form-input-group">
                    <textarea
                        name="description"
                        id="prod-desc"
                        placeholder=" "
                        rows={3}
                        value={product.description}
                        onChange={onChange}
                    />
                    <label htmlFor="prod-desc">Description</label>
                </div>

                <div className="form-row-2">
                    <div className="form-input-group">
                        <input
                            type="number"
                            name="price"
                            id="prod-price"
                            placeholder=" "
                            min="0"
                            step="0.01"
                            value={product.price || ""}
                            onChange={onChange}
                            required
                        />
                        <label htmlFor="prod-price">Price (₹)</label>
                    </div>

                    <div className="form-input-group">
                        <input
                            type="number"
                            name="offer_price"
                            id="prod-offer-price"
                            placeholder=" "
                            min="0"
                            step="0.01"
                            value={product.offer_price || ""}
                            onChange={onChange}
                        />
                        <label htmlFor="prod-offer-price">Offer Price (₹)</label>
                    </div>
                </div>

                <div className="form-input-group">
                    <input
                        type="number"
                        name="quantity"
                        id="prod-qty"
                        placeholder=" "
                        min="0"
                        value={product.quantity || ""}
                        onChange={onChange}
                        required
                    />
                    <label htmlFor="prod-qty">Quantity</label>
                </div>

                {/* Product Image Section */}
                <div className="form-image-section">
                    <label className="form-section-label">Product Image</label>

                    {product.image_url ? (
                        <div className="product-image-preview-card">
                            <img
                                src={product.image_url}
                                alt={product.name || "Product Preview"}
                                loading="lazy"
                                className="product-form-preview-img"
                            />
                            <div className="preview-img-actions">
                                <button
                                    type="button"
                                    className="btn-remove-img"
                                    onClick={() => onImageChange(null)}
                                    title="Remove image"
                                >
                                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                    </svg>
                                    Remove
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="image-upload-box">
                            <label htmlFor="product-image-upload" className={`image-upload-dropzone ${uploading ? "uploading" : ""}`}>
                                {uploading ? (
                                    <div className="uploading-state">
                                        <div className="spinner"></div>
                                        <span>Uploading to Storage...</span>
                                    </div>
                                ) : (
                                    <>
                                        <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                                        </svg>
                                        <span className="upload-prompt-title">Click to upload product image</span>
                                        <span className="upload-prompt-subtitle">PNG, JPG, WEBP, GIF up to 5MB</span>
                                    </>
                                )}
                                <input
                                    type="file"
                                    id="product-image-upload"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    disabled={uploading}
                                    style={{ display: "none" }}
                                />
                            </label>
                        </div>
                    )}

                    <div className="form-input-group url-input-group">
                        <input
                            type="url"
                            name="image_url"
                            id="prod-img-url"
                            placeholder=" "
                            value={product.image_url || ""}
                            onChange={(e) => onImageChange(e.target.value || null)}
                        />
                        <label htmlFor="prod-img-url">Or paste Image URL</label>
                    </div>
                </div>

                <div className="form-actions">
                    <button
                        type="submit"
                        className={`btn-submit ${editingId ? "btn-editing" : ""}`}
                        disabled={uploading}
                    >
                        {editingId ? (
                            <>
                                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                                </svg>
                                <span>Update Product</span>
                            </>
                        ) : (
                            <>
                                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                                <span>Add Product</span>
                            </>
                        )}
                    </button>

                    {editingId && onCancel && (
                        <button
                            type="button"
                            className="btn-cancel"
                            onClick={onCancel}
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default ProductForm;