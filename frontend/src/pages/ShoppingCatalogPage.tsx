import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { ProductItem } from '../services/types.js';
import { PriceFormatter } from '../components/PriceFormatter.js';
import { Search, AlertTriangle, Eye, ShieldCheck } from 'lucide-react';

export const ShoppingCatalogPage: React.FC = () => {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeModalProduct, setActiveModalProduct] = useState<ProductItem | null>(null);

  const categories = ['all', 'Milk', 'Laptop', 'Smartphone', 'Shoes', 'Groceries'];

  const fetchCatalog = async () => {
    setLoading(true);
    try {
      const data = await api.getProducts(selectedCategory === 'all' ? undefined : selectedCategory, searchTerm || undefined);
      setProducts(data);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, [selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCatalog();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-[#172033] tracking-tight">
              Shared Marketplace Catalog
            </h1>
            <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 uppercase font-semibold">
              DEMO DATA
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Both Normal Shopping Mode and NIYAT Protected Mode query this identical synthetic marketplace.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition capitalize ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat === 'all' ? 'All Categories' : cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search items, brands..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </form>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading demo catalog...</div>
      ) : products.length === 0 ? (
        <div className="py-20 text-center text-xs text-slate-400">No products found matching filters.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(product => (
            <div
              key={product.id}
              className="niyat-card p-5 flex flex-col justify-between hover:border-slate-300 transition group space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-blue-600 uppercase tracking-wider text-[10px]">
                    {product.category}
                  </span>
                  {product.maliciousInstruction ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      <AlertTriangle className="w-3 h-3 text-rose-500" />
                      Contains Injection
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <ShieldCheck className="w-3 h-3 text-emerald-500" />
                      Clean SKU
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-sm text-[#172033] group-hover:text-blue-600 transition">
                  {product.title}
                </h3>

                <p className="text-xs text-slate-500 line-clamp-2">
                  {product.description}
                </p>

                <div className="pt-2 text-xs text-slate-600 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Brand:</span>
                    <span className="font-medium text-slate-800">{product.brand}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Merchant:</span>
                    <span className="font-medium text-slate-800">{product.merchant.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Payee VPA:</span>
                    <span className="font-mono text-[11px] text-slate-700">{product.merchant.payeeAddress}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Base Price</div>
                  <PriceFormatter paise={product.basePricePaise} className="text-base font-bold text-[#172033]" />
                </div>

                <button
                  onClick={() => setActiveModalProduct(product)}
                  className="niyat-btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  <span>Inspect Page</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product Detail Modal */}
      {activeModalProduct && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-elevated border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                  {activeModalProduct.category} • {activeModalProduct.brand}
                </span>
                <h3 className="text-base font-bold text-[#172033] mt-1">
                  {activeModalProduct.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveModalProduct(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400">Product Page Description</span>
                <p className="text-slate-700 mt-0.5 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {activeModalProduct.description}
                </p>
              </div>

              {activeModalProduct.maliciousInstruction ? (
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 space-y-1">
                  <span className="font-bold text-rose-800 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    Hidden Product Page Prompt Injection Payload:
                  </span>
                  <p className="font-mono text-[11px] text-rose-900 bg-rose-100/60 p-2 rounded whitespace-pre-wrap">
                    {activeModalProduct.maliciousInstruction}
                  </p>
                  <p className="text-[10px] text-rose-600 pt-1">
                    Normal AI shopping agents ingest this text directly into their LLM prompt, triggering unauthorized transactions.
                    NIYAT blocks this completely.
                  </p>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-emerald-800">
                  No hidden prompt injection detected in this catalog SKU description.
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                  <span className="text-slate-400">Base Price:</span>
                  <p className="font-bold text-slate-800 text-sm">
                    <PriceFormatter paise={activeModalProduct.basePricePaise} />
                  </p>
                </div>
                <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                  <span className="text-slate-400">Merchant Delivery Fee:</span>
                  <p className="font-bold text-slate-800 text-sm">
                    {activeModalProduct.merchant.deliveryFeePaise === 0 ? 'FREE' : <PriceFormatter paise={activeModalProduct.merchant.deliveryFeePaise} />}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setActiveModalProduct(null)}
                className="w-full py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
