import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { ProductItem } from '../services/types.js';
import { PriceFormatter } from '../components/PriceFormatter.js';
import {
  Search,
  ShieldCheck,
  ShoppingBag,
  Store,
  X,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

export const ShoppingCatalogPage: React.FC = () => {
  const navigate = useNavigate();
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

  const handleTestInProtectedMode = (p: ProductItem) => {
    setActiveModalProduct(null);
    navigate('/protected-mode', {
      state: { prefilledPrompt: `Buy 1 ${p.brand} ${p.title} under ₹${Math.ceil((p.basePricePaise * 1.2) / 100)}.` }
    });
  };

  return (
    <div className="px-4 py-6 space-y-4">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
            <ShoppingBag className="w-3.5 h-3.5 text-slate-700" />
            Marketplace
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white text-slate-500 border border-slate-200">
            DEMO DATA
          </span>
        </div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">
          Product Catalog & Payloads
        </h1>
        <p className="text-xs text-slate-600 leading-relaxed">
          Synthetic catalog items containing hidden prompt injection instructions.
        </p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search items, brands, merchants..."
          className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white transition"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
      </form>

      {/* Category Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition capitalize shrink-0 touch-target ${
              selectedCategory === cat
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {cat === 'all' ? 'All Items' : cat}
          </button>
        ))}
      </div>

      {/* Product List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-400" />
            <span>Loading catalog items...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
            No products match your search.
          </div>
        ) : (
          products.map(product => (
            <div
              key={product.id}
              className="fintech-card p-4 space-y-3 bg-white"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {product.category} • {product.brand}
                  </span>
                  <h3 className="font-bold text-sm text-slate-900 leading-snug">
                    {product.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-0.5">
                    <Store className="w-3.5 h-3.5 text-slate-400" />
                    <span>{product.merchant.name}</span>
                    <span>•</span>
                    <span className="font-mono text-[11px]">{product.merchant.payeeAddress}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-base font-extrabold text-slate-900 block">
                    <PriceFormatter paise={product.basePricePaise} />
                  </span>
                  {product.maliciousInstruction && (
                    <span className="inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 mt-1">
                      Injected
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                {product.maliciousInstruction && (
                  <button
                    onClick={() => setActiveModalProduct(product)}
                    className="flex-1 py-2 px-3 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 flex items-center justify-center gap-1.5 transition touch-target"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>View Attack Payload</span>
                  </button>
                )}

                <button
                  onClick={() => handleTestInProtectedMode(product)}
                  className="flex-1 py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition touch-target"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Test in Protected Mode</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Attack Payload Modal */}
      {activeModalProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 border border-slate-200 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Hidden Prompt Injection Payload
              </span>
              <button
                onClick={() => setActiveModalProduct(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 touch-target flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Found inside HTML description of <strong>{activeModalProduct.title}</strong>:
            </p>

            <pre className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] leading-relaxed whitespace-pre-wrap overflow-x-auto max-h-48 border border-slate-800">
              {activeModalProduct.maliciousInstruction}
            </pre>

            <div className="pt-1 flex gap-2">
              <button
                onClick={() => setActiveModalProduct(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 touch-target"
              >
                Close
              </button>
              <button
                onClick={() => handleTestInProtectedMode(activeModalProduct)}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold touch-target"
              >
                Test Protected Mode
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
