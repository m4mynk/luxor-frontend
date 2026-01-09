import React, { useEffect, useState, useMemo } from 'react';
import api from "../utils/api";
import toast, { Toaster } from 'react-hot-toast';

const initialProductForm = {
  name: '',
  brand: '',
  category: '',
  description: '',
  price: '',
  countInStock: '',
  sizes: '',
  colors: '',
  images: [],
  imagesByColor: {},   // ✅ map { color: [urls] }
  isFeatured: false,
  active: true,
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState(initialProductForm);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [manualImageUrl, setManualImageUrl] = useState('');
  

  // ✅ Track selected file globally
  const [selectedFile, setSelectedFile] = useState(null);

  // Fetch products with filters, search, pagination
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {
        _page: page,
        _limit: limit,
      };
      if (searchTerm.trim()) params.q = searchTerm.trim();
      if (filterCategory) params.category = filterCategory;
      if (filterActive) params.active = filterActive === 'true';
      const { data, headers } = await api.get('/api/products', {
        params,
        withCredentials: true,
      });
      setProducts(data);
      // Calculate total pages from headers if available
      const totalCount = headers['x-total-count'] ? parseInt(headers['x-total-count'], 10) : data.length;
      setTotalPages(Math.ceil(totalCount / limit));
    } catch (error) {
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, searchTerm, filterCategory, filterActive]);

  // Handle checkbox toggle for single product
  const toggleProductSelection = (id) => {
    setSelectedProducts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Handle toggle all checkbox
  const toggleSelectAll = () => {
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(products.map((p) => p._id)));
    }
  };

  // Validate product form inputs
  const validateProductForm = () => {
    if (!productForm.name.trim()) {
      toast.error('Name is required');
      return false;
    }
    if (!productForm.brand.trim()) {
      toast.error('Brand is required');
      return false;
    }
    if (!productForm.category.trim()) {
      toast.error('Category is required');
      return false;
    }
    if (!productForm.price || isNaN(productForm.price) || Number(productForm.price) < 0) {
      toast.error('Price must be a non-negative number');
      return false;
    }
    if (
      productForm.countInStock === '' ||
      isNaN(productForm.countInStock) ||
      Number(productForm.countInStock) < 0
    ) {
      toast.error('Count In Stock must be a non-negative number');
      return false;
    }
    return true;
  };

  // Handle Add Product modal open
  const openAddModal = () => {
    setProductForm(initialProductForm);
    setManualImageUrl('');
    setShowAddModal(true);
  };

  // Handle Edit Product modal open
  const openEditModal = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name || '',
      brand: product.brand || '',
      category: product.category || '',
      description: product.description || '',
      price: product.price || '',
      countInStock: product.countInStock || '',
      sizes: (product.sizes || []).join(','),
      colors: (product.colors || []).join(','),
      imagesByColor: product.imagesByColor || {},
      images: product.images || [],
      isFeatured: !!product.isFeatured,
      variants: product.variants || [],
      active: product.active === undefined ? true : product.active,
    });
    setManualImageUrl('');
    setShowEditModal(true);
  };

  // ✅ Handle image upload (just select, upload on save)
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file); // ✅ save file for later upload
    toast.success("Image selected, will upload on save");
    e.target.value = null;
  };

  // Add manual image URL to images array
  const addManualImageUrl = () => {
    if (!manualImageUrl.trim()) {
      toast.error('Image URL cannot be empty');
      return;
    }
    setProductForm((prev) => ({
      ...prev,
      images: [...prev.images, manualImageUrl.trim()],
    }));
    setManualImageUrl('');
  };

  // Remove image from images array by index
  const removeImageAtIndex = (idx) => {
    setProductForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== idx),
    }));
  };

  // ✅ Handle create product
const handleCreate = async () => {
  if (!validateProductForm()) return;

  try {
    if (selectedFile) {
      // --- CASE 1: File selected → use FormData ---
      const formData = new FormData();
      formData.append("image", selectedFile); // ✅ main file

      // append other text fields
      formData.append("name", productForm.name);
      formData.append("brand", productForm.brand);
      formData.append("category", productForm.category);
      formData.append("description", productForm.description);
      formData.append("price", Number(productForm.price));
      formData.append("countInStock", Number(productForm.countInStock));
      formData.append("isFeatured", productForm.isFeatured);
      formData.append("active", productForm.active);

      // append sizes
      productForm.sizes
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((s) => formData.append("sizes", s));

      // append colors
      productForm.colors
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean)
        .forEach((c) => formData.append("colors", c));

      // append manual image URLs
      productForm.images.forEach((url) => formData.append("images", url));

      // Instead of appending each variant separately
// Collect them into one array
const cleanVariants = (productForm.variants || []).map((v) => ({
  size: v.size,
  color: v.color,
  stock: Number(v.stock) || 0,
}));

formData.append("variants", JSON.stringify(cleanVariants));

      console.log("📤 Sending FormData (with file):");
      for (let pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }

      await api.post("/api/products", formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });
    } else {
      // --- CASE 2: Only URLs → send JSON ---
      const payload = {
        ...productForm,
        price: Number(productForm.price),
        countInStock: Number(productForm.countInStock),
        sizes: productForm.sizes
          ? productForm.sizes.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        colors: productForm.colors
          ? productForm.colors.split(",").map((c) => c.trim()).filter(Boolean)
          : [],
        images: productForm.images,
        variants: (productForm.variants || []).map(v => ({
  size: v.size,
  color: v.color,
  stock: Number(v.stock) || 0
})),
      };

      console.log("📤 Sending JSON payload:", payload);

      await api.post("/api/products", payload, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      });
    }

    toast.success("Product created ✅");
    setShowAddModal(false);
    setSelectedFile(null);
    fetchProducts();
  } catch (err) {
  if (err.response) {
    console.error("❌ Create product error:", err.response.data);
    toast.error(err.response.data.message || "Failed to create product");
  } else {
    console.error("❌ Ceate product error:", err);
    toast.error("Failed to create product");
  }
}
};

// ✅ Handle update product
const handleUpdate = async () => {
  if (!validateProductForm()) return;

  try {
    if (selectedFile) {
      // --- CASE 1: File selected → use FormData ---
      const formData = new FormData();
      formData.append("image", selectedFile);

      formData.append("name", productForm.name);
      formData.append("brand", productForm.brand);
      formData.append("category", productForm.category);
      formData.append("description", productForm.description);
      formData.append("price", Number(productForm.price));
      formData.append("countInStock", Number(productForm.countInStock));
      formData.append("isFeatured", productForm.isFeatured);
      formData.append("active", productForm.active);

      productForm.sizes
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((s) => formData.append("sizes", s));

      productForm.colors
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean)
        .forEach((c) => formData.append("colors", c));

      productForm.images.forEach((url) => formData.append("images", url));
      
      // Instead of appending each variant separately
// Collect them into one array
const cleanVariants = (productForm.variants || []).map((v) => ({
  size: v.size,
  color: v.color,
  stock: Number(v.stock) || 0,
}));

formData.append("variants", JSON.stringify(cleanVariants));

      console.log("📤 Updating with FormData (with file):");
      for (let pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }

      await api.put(
        `/api/products/${editingProduct._id}`,
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
    } else {
      // --- CASE 2: Only URLs → send JSON ---
      const payload = {
        ...productForm,
        price: Number(productForm.price),
        countInStock: Number(productForm.countInStock),
        sizes: productForm.sizes
          ? productForm.sizes.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        colors: productForm.colors
          ? productForm.colors.split(",").map((c) => c.trim()).filter(Boolean)
          : [],
        images: productForm.images,
        variants: (productForm.variants || []).map(v => ({
  size: v.size,
  color: v.color,
  stock: Number(v.stock) || 0
})),
      };

      console.log("📤 Updating with JSON payload:", payload);

      await api.put(
        `/api/products/${editingProduct._id}`,
        payload,
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    toast.success("Product updated ✅");
    setShowEditModal(false);
    setEditingProduct(null);
    setSelectedFile(null);
    fetchProducts();
  } catch (err) {
  if (err.response) {
    console.error("❌ Update product error:", err.response.data);
    toast.error(err.response.data.message || "Failed to update product");
  } else {
    console.error("❌ Update product error:", err);
    toast.error("Failed to update product");
  }
}
};
  // Handle delete product
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/api/products/${id}`, {
  withCredentials: true,
});
      toast.success('Product deleted');
      setSelectedProducts((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      fetchProducts();
    } catch {
      toast.error('Failed to delete product');
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
  if (selectedProducts.size === 0) {
    toast.error('No products selected');
    return;
  }

  if (!window.confirm(`Are you sure you want to delete ${selectedProducts.size} products?`)) return;

  try {
    await api.delete("/api/products", {
      data: { ids: Array.from(selectedProducts) }, // send array of IDs
      withCredentials: true,
    });

    toast.success('Selected products deleted');
    setSelectedProducts(new Set()); // clear selection
    fetchProducts(); // refresh product list
  } catch (err) {
    console.error("❌ Bulk delete error:", err);
    toast.error('Failed to delete selected products');
  }
};


  // Handle toggle active status for a product
  const handleToggleActive = async (product) => {
  try {
    const newStatus = !product.active; // flip the status

    await api.put(
      `/api/products/${product._id}`,
      { active: newStatus }, // only send the active field
      { withCredentials: true }
    );

    toast.success(`Product ${newStatus ? "activated" : "deactivated"} ✅`);
    fetchProducts(); // refresh product list after toggle
  } catch (err) {
    console.error("❌ Toggle active error:", err.response?.data || err.message);
    toast.error("Failed to toggle active status");
  }
};

  // Export displayed products to CSV
const handleExportCSV = () => {
  if (products.length === 0) {
    toast.error('No products to export');
    return;
  }

  // ✅ Category normalizer (Zara style)
  const normalizeCategory = (cat) => {
    if (!cat) return "";
    const c = cat.toLowerCase();
    if (c.includes("tshirt") || c.includes("tee")) return "T-Shirt";
    if (c.includes("shirt")) return "Shirt";
    if (c.includes("jean")) return "Jeans";
    if (c.includes("hood")) return "Hoodie";
    if (c.includes("pant") || c.includes("trouser")) return "Trousers";
    return cat; // fallback: keep original
  };

  const headers = [
    'ID',
    'Name',
    'Brand',
    'Category',
    'Description',
    'Price',
    'CountInStock',
    'Sizes',
    'Colors',
    'Images',
    'IsFeatured',
    'Active',
  ];

  const rows = products.map((p) => [
    p._id,
    p.name,
    p.brand,
    normalizeCategory(p.category), // ✅ Normalized here
    p.description ? p.description.replace(/(\r\n|\n|\r)/gm, ' ') : '',
    `₹${p.price}`, // ✅ Rupees
    p.countInStock,
    (p.sizes || []).join('|'),
    (p.colors || []).join('|'),
    (p.images || []).join('|'),
    p.isFeatured ? 'Yes' : 'No',
    p.active ? 'Yes' : 'No',
  ]);

  const csvContent =
    'data:text/csv;charset=utf-8,' +
    [headers, ...rows]
      .map((e) =>
        e.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','),
      )
      .join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `products_export_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

  // Pagination controls
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Toaster position="top-right" />
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <h1 className="text-3xl font-semibold text-gray-800">Admin Products</h1>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={openAddModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow"
            type="button"
          >
            Add Product
          </button>
          <button
            onClick={handleBulkDelete}
            disabled={selectedProducts.size === 0}
            className={`px-4 py-2 rounded shadow ${
              selectedProducts.size === 0
                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
            type="button"
          >
            Delete Selected
          </button>
          <button
            onClick={handleExportCSV}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow"
            type="button"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-4">
        <input
          type="text"
          placeholder="Search by name, brand, category..."
          value={searchTerm}
          onChange={(e) => {
            setPage(1);
            setSearchTerm(e.target.value);
          }}
          className="flex-grow max-w-xs px-3 py-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={filterCategory}
          onChange={(e) => {
            setPage(1);
            setFilterCategory(e.target.value);
          }}
          className="px-3 py-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Categories</option>
          {[...new Set(products.map((p) => p.category).filter(Boolean))].map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <select
          value={filterActive}
          onChange={(e) => {
            setPage(1);
            setFilterActive(e.target.value);
          }}
          className="px-3 py-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="w-full text-left text-sm text-gray-700">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">
                <input
                  type="checkbox"
                  onChange={toggleSelectAll}
                  checked={selectedProducts.size === products.length && products.length > 0}
                  aria-label="Select all products"
                />
              </th>
              <th className="p-3">Name</th>
              <th className="p-3">Brand</th>
              <th className="p-3">Category</th>
              <th className="p-3">Price</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Featured</th>
              <th className="p-3">Active</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" className="text-center p-6 text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center p-6 text-gray-500">
                  No products found.
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr
                  key={product._id}
                  className="border-t hover:bg-gray-50 transition-colors"
                >
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selectedProducts.has(product._id)}
                      onChange={() => toggleProductSelection(product._id)}
                      aria-label={`Select product ${product.name}`}
                    />
                  </td>
                  <td className="p-3 font-medium">{product.name}</td>
                  <td className="p-3">{product.brand}</td>
                  <td className="p-3">{product.category}</td>
                  <td className="p-3">₹{product.price?.toFixed(2)}</td>
                  <td className="p-3">{product.countInStock}</td>
                  <td className="p-3 text-center">
                    {product.isFeatured ? (
                      <span className="text-green-600 font-semibold">Yes</span>
                    ) : (
                      'No'
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleToggleActive(product)}
                      className={`px-2 py-1 rounded text-white text-xs ${
                        product.active ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 hover:bg-gray-500'
                      }`}
                      type="button"
                      aria-label={`Toggle active status for ${product.name}`}
                    >
                      {product.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="p-3 space-x-2 whitespace-nowrap">
                    <button
                      onClick={() => openEditModal(product)}
                      className="text-blue-600 hover:text-blue-800 font-semibold"
                      type="button"
                      aria-label={`Edit product ${product.name}`}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product._id)}
                      className="text-red-600 hover:text-red-800 font-semibold"
                      type="button"
                      aria-label={`Delete product ${product.name}`}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-between items-center">
        <button
          type="button"
          onClick={() => canPrev && setPage(page - 1)}
          disabled={!canPrev}
          className={`px-4 py-2 rounded shadow ${
            canPrev
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-300 text-gray-600 cursor-not-allowed'
          }`}
          aria-label="Previous page"
        >
          Previous
        </button>
        <span className="text-gray-700">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          onClick={() => canNext && setPage(page + 1)}
          disabled={!canNext}
          className={`px-4 py-2 rounded shadow ${
            canNext
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-300 text-gray-600 cursor-not-allowed'
          }`}
          aria-label="Next page"
        >
          Next
        </button>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <Modal title="Add Product" onClose={() => setShowAddModal(false)}>
          <ProductForm
            productForm={productForm}
            setProductForm={setProductForm}
            uploadingImage={uploadingImage}
            handleImageUpload={handleImageUpload}
            manualImageUrl={manualImageUrl}
            setManualImageUrl={setManualImageUrl}
            addManualImageUrl={addManualImageUrl}
            removeImageAtIndex={removeImageAtIndex}
            onSubmit={handleCreate}
            submitLabel="Create"
            onCancel={() => setShowAddModal(false)}
          />
        </Modal>
      )}

      {/* Edit Product Modal */}
      {showEditModal && (
        <Modal title="Edit Product" onClose={() => setShowEditModal(false)}>
          <ProductForm
            productForm={productForm}
            setProductForm={setProductForm}
            uploadingImage={uploadingImage}
            handleImageUpload={handleImageUpload}
            manualImageUrl={manualImageUrl}
            setManualImageUrl={setManualImageUrl}
            addManualImageUrl={addManualImageUrl}
            removeImageAtIndex={removeImageAtIndex}
            onSubmit={handleUpdate}
            submitLabel="Update"
            onCancel={() => setShowEditModal(false)}
          />
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 relative">
        <h2 id="modal-title" className="text-2xl font-semibold mb-4">
          {title}
        </h2>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-600 hover:text-gray-900"
          aria-label="Close modal"
          type="button"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {children}
      </div>
    </div>
  );
}

function ProductForm({
  productForm,
  setProductForm,
  uploadingImage,
  handleImageUpload,
  manualImageUrl,
  setManualImageUrl,
  addManualImageUrl,
  removeImageAtIndex,
  onSubmit,
  submitLabel,
  onCancel,
}) {
  // ✅ Local variant states (fix)
  const [variantSize, setVariantSize] = useState('');
  const [variantColor, setVariantColor] = useState('');
  const [variantStock, setVariantStock] = useState('');
  const [galleryColor, setGalleryColor] = React.useState("");
  const [galleryUrl, setGalleryUrl] = React.useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="block font-medium mb-1">
            Name <span className="text-red-600">*</span>
          </label>
          <input
            id="name"
            type="text"
            value={productForm.name}
            onChange={(e) => setProductForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            autoComplete="off"
          />
        </div>
        <div>
          <label htmlFor="brand" className="block font-medium mb-1">
            Brand <span className="text-red-600">*</span>
          </label>
          <input
            id="brand"
            type="text"
            value={productForm.brand}
            onChange={(e) => setProductForm((f) => ({ ...f, brand: e.target.value }))}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            autoComplete="off"
          />
        </div>
        <div>
          <label htmlFor="category" className="block font-medium mb-1">
            Category <span className="text-red-600">*</span>
          </label>
          <input
            id="category"
            type="text"
            value={productForm.category}
            onChange={(e) => setProductForm((f) => ({ ...f, category: e.target.value }))}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            autoComplete="off"
          />
        </div>
        <div>
          <label htmlFor="price" className="block font-medium mb-1">
            Price <span className="text-red-600">₹</span>
          </label>
          <input
            id="price"
            type="number"
            min="0"
            step="0.01"
            value={productForm.price}
            onChange={(e) => setProductForm((f) => ({ ...f, price: e.target.value }))}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label htmlFor="countInStock" className="block font-medium mb-1">
            Count In Stock <span className="text-red-600">*</span>
          </label>
          <input
            id="countInStock"
            type="number"
            min="0"
            step="1"
            value={productForm.countInStock}
            onChange={(e) => setProductForm((f) => ({ ...f, countInStock: e.target.value }))}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label htmlFor="sizes" className="block font-medium mb-1">
            Sizes (comma-separated)
          </label>
          <input
            id="sizes"
            type="text"
            value={productForm.sizes}
            onChange={(e) => setProductForm((f) => ({ ...f, sizes: e.target.value }))}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoComplete="off"
          />
        </div>
        <div>
          <label htmlFor="colors" className="block font-medium mb-1">
            Colors (comma-separated)
          </label>
          <input
            id="colors"
            type="text"
            value={productForm.colors}
            onChange={(e) => setProductForm((f) => ({ ...f, colors: e.target.value }))}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoComplete="off"
          />
        </div>
        {/* Variants Manager */}
<div className="md:col-span-2">
  <label className="block font-medium mb-1">Variants (Size + Color + Stock)</label>

  <div className="flex gap-2 mb-3">
    <input
      type="text"
      placeholder="Size (e.g. M)"
      value={variantSize}
      onChange={(e) => setVariantSize(e.target.value)}
      className="border p-2 rounded w-1/4"
    />
    <input
      type="text"
      placeholder="Color (e.g. Black)"
      value={variantColor}
      onChange={(e) => setVariantColor(e.target.value)}
      className="border p-2 rounded w-1/4"
    />
    <input
      type="number"
      placeholder="Stock"
      value={variantStock}
      onChange={(e) => setVariantStock(e.target.value)}
      className="border p-2 rounded w-1/4"
    />
    <button
      type="button"
      onClick={() => {
        if (!variantSize || !variantColor || !variantStock) return;
        setProductForm((f) => ({
          ...f,
          variants: [...(f.variants || []), { size: variantSize, color: variantColor, stock: Number(variantStock) }],
        }));
        setVariantSize('');
        setVariantColor('');
        setVariantStock('');
      }}
      className="px-3 py-2 bg-black text-white rounded"
    >
      + Add
    </button>
  </div>

  {(productForm.variants || []).map((v, i) => (
    <div key={i} className="flex justify-between items-center bg-gray-100 p-2 rounded mb-1">
      <span>{v.size} - {v.color} - {v.stock} in stock</span>
      <button
        type="button"
        onClick={() =>
          setProductForm((f) => ({
            ...f,
            variants: f.variants.filter((_, idx) => idx !== i),
          }))
        }
        className="text-red-600"
      >
        ✕
      </button>
    </div>
  ))}
</div>
        <div className="md:col-span-2">
          <label htmlFor="description" className="block font-medium mb-1">
            Description
          </label>
          <textarea
            id="description"
            rows="3"
            value={productForm.description}
            onChange={(e) => setProductForm((f) => ({ ...f, description: e.target.value }))}
            className="w-full px-3 py-2 border rounded resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block font-medium mb-1">Images</label>
        <div className="flex flex-wrap gap-2 items-center mb-2">
          {productForm.images.map((url, idx) => (
            <div
              key={idx}
              className="relative w-20 h-20 rounded overflow-hidden border border-gray-300"
            >
              <img
                src={url}
                alt={`Product image ${idx + 1}`}
                className="object-cover w-full h-full"
              />
              <button
                type="button"
                onClick={() => removeImageAtIndex(idx)}
                className="absolute top-0 right-0 bg-red-600 text-white rounded-bl px-1 text-xs hover:bg-red-700"
                aria-label={`Remove image ${idx + 1}`}
              >
                &times;
              </button>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <label
            htmlFor="imageUpload"
            className={`cursor-pointer inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow-sm ${
              uploadingImage ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {uploadingImage ? 'Uploading...' : 'Upload Image'}
            <input
              id="imageUpload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploadingImage}
              className="hidden"
            />
          </label>
          <div className="flex gap-2 items-center">
            <input
              type="text"
              placeholder="Enter image URL"
              value={manualImageUrl}
              onChange={(e) => setManualImageUrl(e.target.value)}
              className="px-3 py-2 border rounded w-60 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="off"
            />
            <button
              type="button"
              onClick={addManualImageUrl}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded shadow"
            >
              Add URL
            </button>
          </div>
        </div>
      </div>
      {/* 🖼️ Images by Color */}
<div className="mt-4 p-3 border rounded">
  <label className="block font-medium mb-2">Images by Color</label>

  {/* Input row */}
  <div className="flex gap-2 mb-3">
    <input
      type="text"
      placeholder="Color (e.g. Black)"
      value={galleryColor}
      onChange={(e) => setGalleryColor(e.target.value)}
      className="px-3 py-2 border rounded w-40"
    />
    <input
      type="text"
      placeholder="Image URL"
      value={galleryUrl}
      onChange={(e) => setGalleryUrl(e.target.value)}
      className="px-3 py-2 border rounded flex-1"
    />
    <button
      type="button"
      className="px-3 py-2 bg-black text-white rounded"
      onClick={() => {
        if (!galleryColor.trim() || !galleryUrl.trim()) return;
        setProductForm((f) => {
          const map = { ...(f.imagesByColor || {}) };
          const key = galleryColor.trim();
          map[key] = [...(map[key] || []), galleryUrl.trim()];
          return { ...f, imagesByColor: map };
        });
        setGalleryUrl("");
      }}
    >
      + Add
    </button>
  </div>

  {/* Existing color galleries */}
  {Object.entries(productForm.imagesByColor || {}).map(([color, urls]) => (
    <div key={color} className="mb-2">
      <div className="font-semibold mb-1">{color}</div>
      <div className="flex flex-wrap gap-2">
        {urls.map((url, idx) => (
          <div key={idx} className="relative w-16 h-16 border rounded overflow-hidden">
            <img src={url} alt={`${color}-${idx}`} className="object-cover w-full h-full" />
            <button
              type="button"
              className="absolute top-0 right-0 bg-red-600 text-white text-xs px-1"
              onClick={() =>
                setProductForm((f) => {
                  const map = { ...(f.imagesByColor || {}) };
                  map[color] = map[color].filter((_, i) => i !== idx);
                  if (map[color].length === 0) delete map[color];
                  return { ...f, imagesByColor: map };
                })
              }
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  ))}
</div>

      <div className="flex items-center gap-6">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={productForm.isFeatured}
            onChange={(e) => setProductForm((f) => ({ ...f, isFeatured: e.target.checked }))}
          />
          <span>Featured</span>
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={productForm.active}
            onChange={(e) => setProductForm((f) => ({ ...f, active: e.target.checked }))}
          />
          <span>Active</span>
        </label>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded border hover:bg-gray-100"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded shadow"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
