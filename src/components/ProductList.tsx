import type { Product } from "../types/product";
import type { UserProfile } from "../types/user";
import ProductCard from "./ProductCard";

interface ProductListProps {
    products: Product[];
    user: UserProfile | null;
    onEdit: (product: Product) => void;
    onDelete: (id: number) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    statusFilter: string;
    setStatusFilter: (status: string) => void;
    sortBy: string;
    setSortBy: (sort: string) => void;
    page: number;
    setPage: (page: number) => void;
    pageSize: number;
    setPageSize: (size: number) => void;
    totalCount: number;
}

const ProductList = ({
    products,
    user,
    onEdit,
    onDelete,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalCount,
}: ProductListProps) => {
    const totalPages = Math.ceil(totalCount / pageSize) || 1;
    const startItem = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
    const endItem = Math.min(page * pageSize, totalCount);

    return (
        <div>
            {/* List Controls */}
            <div className="list-controls-panel">
                <div className="search-input-wrapper">
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search products by name or description..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="filters-group">
                    <select
                        className="select-custom"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        aria-label="Filter by Stock Status"
                    >
                        <option value="all">All Levels</option>
                        <option value="in-stock">In Stock</option>
                        <option value="low-stock">Low Stock</option>
                        <option value="out-of-stock">Out of Stock</option>
                    </select>

                    <select
                        className="select-custom"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        aria-label="Sort products"
                    >
                        <option value="name-asc">Name: A-Z</option>
                        <option value="name-desc">Name: Z-A</option>
                        <option value="price-asc">Price: Low to High</option>
                        <option value="price-desc">Price: High to Low</option>
                        <option value="qty-asc">Quantity: Low to High</option>
                        <option value="qty-desc">Quantity: High to Low</option>
                    </select>
                </div>
            </div>

            {/* List Content */}
            {products.length === 0 ? (
                <div className="no-products-fallback">
                    <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <h4>No Products Found</h4>
                    <p>Try modifying your search query or active level filter.</p>
                </div>
            ) : (
                <>
                    <div className="products-cards-grid">
                        {products.map((p) => (
                            <ProductCard
                                key={p.id}
                                product={p}
                                user={user}
                                onEdit={onEdit}
                                onDelete={onDelete}
                            />
                        ))}
                    </div>

                    {/* Pagination Bar */}
                    {totalCount > 0 && (
                        <div className="pagination-bar">
                            <div className="pagination-info">
                                Showing <span>{startItem}</span> - <span>{endItem}</span> of <span>{totalCount}</span> products
                            </div>

                            <div className="pagination-controls">
                                <div className="page-size-picker">
                                    <span className="page-size-lbl">Items:</span>
                                    <select
                                        className="select-custom select-pageSize"
                                        value={pageSize}
                                        onChange={(e) => {
                                            setPageSize(Number(e.target.value));
                                            setPage(1);
                                        }}
                                    >
                                        <option value={6}>6</option>
                                        <option value={8}>8</option>
                                        <option value={12}>12</option>
                                        <option value={24}>24</option>
                                    </select>
                                </div>

                                <div className="pagination-buttons">
                                    <button
                                        className="pagination-btn"
                                        disabled={page <= 1}
                                        onClick={() => setPage(page - 1)}
                                        aria-label="Previous Page"
                                    >
                                        <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                        </svg>
                                        <span>Prev</span>
                                    </button>

                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                                        <button
                                            key={pageNum}
                                            className={`pagination-num-btn ${pageNum === page ? "active" : ""}`}
                                            onClick={() => setPage(pageNum)}
                                        >
                                            {pageNum}
                                        </button>
                                    ))}

                                    <button
                                        className="pagination-btn"
                                        disabled={page >= totalPages}
                                        onClick={() => setPage(page + 1)}
                                        aria-label="Next Page"
                                    >
                                        <span>Next</span>
                                        <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ProductList;
