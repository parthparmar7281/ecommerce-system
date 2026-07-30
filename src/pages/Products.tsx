import { useEffect, useState } from "react";
import ProductForm from "../components/ProductForm";
import ProductList from "../components/ProductList";
import {
    createProduct,
    deleteProduct,
    getProducts,
    updateProduct,
    type Product,
} from "../services/productService";
import { canCreateProduct } from "../utils/permission";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";
import "./products.css";

const Products = () => {
    const { user } = useAuth();
    const emptyProduct: Product = {
        name: "",
        description: "",
        price: 0,
        quantity: 0,
        offer_price: null,
        image_url: null,
    };

    const [product, setProduct] = useState<Product>(emptyProduct);
    const [products, setProducts] = useState<Product[]>([]);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);

    // Backend filter states
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sortBy, setSortBy] = useState("name-asc");

    // Pagination states
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(6);
    const [totalCount, setTotalCount] = useState(0);

    // Debounce search query input by 300ms
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Reset to page 1 whenever search, status filter, or sorting changes
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, statusFilter, sortBy]);

    // Load products whenever filter/sort/pagination dependencies change
    useEffect(() => {
        loadProducts();
    }, [debouncedSearch, statusFilter, sortBy, page, pageSize]);

    const loadProducts = async () => {
        const filters: any = {
            search: debouncedSearch,
            status: statusFilter,
            sortBy: sortBy,
            page: page,
            pageSize: pageSize,
        };

        if (user?.role === "Seller") {
            filters.createdBy = user.id;
        }

        const { data, count, error } = await getProducts(filters);

        if (error) {
            toast.error(error.message);
            return;
        }

        setProducts(data || []);
        if (count !== null && count !== undefined) {
            setTotalCount(count);
        }
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setProduct({
            ...product,
            [name]: name === "price" || name === "quantity" || name === "offer_price"
                ? value === "" ? null : Number(value)
                : value,
        });
    };

    const handleImageChange = (imageUrl: string | null) => {
        setProduct((prev) => ({ ...prev, image_url: imageUrl }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        let response;

        if (editingId) {
            response = await updateProduct(editingId, product);
        } else {
            response = await createProduct(product);
        }

        if (response.error) {
            toast.error(response.error.message);
            return;
        }

        toast.success(editingId ? "Product updated successfully!" : "Product created successfully!");

        setProduct(emptyProduct);
        setEditingId(null);
        setIsFormOpen(false);

        loadProducts();
    };

    const handleEdit = (item: Product) => {
        setProduct({
            name: item.name,
            description: item.description,
            price: item.price,
            quantity: item.quantity,
            offer_price: item.offer_price !== undefined ? item.offer_price : null,
            image_url: item.image_url || null,
        });

        setEditingId(item.id!);
        setIsFormOpen(true);
    };

    const handleCancelEdit = () => {
        setProduct(emptyProduct);
        setEditingId(null);
        setIsFormOpen(false);
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this product?"))
            return;

        const { error } = await deleteProduct(id);

        if (error) {
            toast.error(error.message);
            return;
        }

        toast.success("Product deleted successfully!");

        // If we are currently editing the deleted product, clear the form
        if (editingId === id) {
            handleCancelEdit();
        }

        loadProducts();
    };

    const canAdd = canCreateProduct(user);

    return (
        <div className="products-page-wrapper">
            <div className="products-content">
                <div className="products-header-row">
                    <div className="products-header">
                        <h1 className="products-title">
                            <svg width="34" height="34" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            Product Management
                        </h1>
                        <p className="products-subtitle">
                            Monitor stock levels, calculate valuation, and modify products in real-time.
                        </p>
                    </div>

                    {canAdd && (
                        <button
                            className="btn-add-product"
                            onClick={() => {
                                setProduct(emptyProduct);
                                setEditingId(null);
                                setIsFormOpen(true);
                            }}
                        >
                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            <span>Add New Product</span>
                        </button>
                    )}
                </div>

                <ProductList
                    products={products}
                    user={user}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                    page={page}
                    setPage={setPage}
                    pageSize={pageSize}
                    setPageSize={setPageSize}
                    totalCount={totalCount}
                />
            </div>

            {isFormOpen && (
                <div className="modal-overlay" onClick={handleCancelEdit}>
                    <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                        <ProductForm
                            product={product}
                            editingId={editingId}
                            onChange={handleChange}
                            onImageChange={handleImageChange}
                            onSubmit={handleSubmit}
                            onCancel={handleCancelEdit}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Products;