import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { ProductItem } from '../services/types.js';
import { PriceFormatter } from '../components/PriceFormatter.js';
import {
  Search,
  AlertTriangle,
  Eye,
  ShieldCheck,
  ShoppingBag,
  Store,
  ArrowRight,
  X
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
    <div className="px-4 py-5 space-y-4">
      {/* Header & Demo Data Badge */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#F3EDF9] text-[#663A91] border border-[#E8E2EF] flex items-center gap-1">
            <ShoppingBag className="w-3.5 h-3.5 text-[#663A91]" />
            Shared Marketplace
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white text-[#766B82] border border-[#E8E2EF]">
            DEMO DATA
          </span>
        </div>
        <h1 className="text-xl font-black text-[#261633] tracking-tight">
          Marketplace Catalog & Injections
        </h1>
        <p className="text-xs text-[#766B82] leading-relaxed">
          Both Normal Shopping Mode and Protected Mode query this identical synthetic marketplace.
        </p>
      </div>

      {/* Search Input */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search items, brands, merchants..."
          className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#E8E2EF] text-xs font-medium text-[#261633] focus:outline-none focus:ring-2 focus:ring-[#663A91]/30 focus:border-[#663A91] bg-white transition"
        />
        <Search className="w-4 h-4 text-[#766B82] absolute left-3 top-3" />
      </form>

      {/* Category Pills (Horizontal Scrollable) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`text-[11px] px-3 py-1.5 rounded-xl font-semibold transition capitalize shrink-0 ${
              selectedCategory === cat
                ? 'bg-[#663A91] text-white shadow-xs'
                : 'bg-white border border-[#E8E2EF] text-[#766B82] hover:bg-[#F3EDF9]'
            }`}
          >
            {cat === 'all' ? 'All Items' : cat}
          </button>
        ))}
      </div>

      {/* Product List */}
      {loading ? (
        <div className="py-16 text-center text-xs text-[#766B82]">Loading marketplace catalog...</div>
      ) : products.length === 0 ? (
        <div className="py-16 text-center text-xs text-[#766B82]">No products found matching filters.</div>
      ) : (
        <div className="space-y-3">
          {products.map(product => (
            <div
              key={product.id}
              className="niyat-card p-4 space-y-3 shadow-card hover:border-[#663A91] transition"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#663A91]">
                    {product.category} • {product.brand}
                  </span>
                  {product.maliciousInstruction ? (
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-[#D64C55] bg-[#FBEDED] px-2 py-0.5 rounded-full border border-[#F7D2D5]">
                      <AlertTriangle className="w-3 h-3 text-[#D64C55]" />
                      Prompt Injection
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-[#168451] bg-[#E8F6EE] px-2 py-0.5 rounded-full border border-[#C4E8D3]">
                      <ShieldCheck className="w-3 h-3 text-[#168451]" />
                      Clean SKU
                    </span>
                  )}
                </div>

                <h3 className="font-extrabold text-sm text-[#261633] leading-snug">
                  {product.title}
                </h3>

                <p className="text-xs text-[#766B82] line-clamp-2 leading-relaxed">
                  {product.description}
                </p>

                <div className="pt-2 border-t border-[#E8E2EF] text-[11px] text-[#766B82] flex items-center justify-between">
                  <span className="flex items-center gap-1 truncate max-w-[170px]">
                    <Store className="w-3 h-3 text-[#766B82]" />
                    {product.merchant.name}
                  </span>
                  <span className="font-mono text-[10px] text-[#766B82] truncate max-w-[130px]">
                    {product.merchant.payeeAddress}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#E8E2EF] flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#766B82] block">Base Price</span>
                  <PriceFormatter paise={product.basePricePaise} className="text-sm font-black text-[#261633]" />
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setActiveModalProduct(product)}
                    className="niyat-btn-secondary px-3 py-1.5 text-xs flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#766B82]" />
                    <span>Inspect</span>
                  </button>

                  <button
                    onClick={() => handleTestInProtectedMode(product)}
                    className="niyat-btn-primary px-3 py-1.5 text-xs flex items-center gap-1"
                  >
                    <span>Test Protected</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product Inspector Modal */}
      {activeModalProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 space-y-4 shadow-plum border border-[#E8E2EF] max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-start pb-2 border-b border-[#E8E2EF]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#663A91]">
                  {activeModalProduct.category} • {activeModalProduct.brand}
                </span>
                <h3 className="text-sm font-extrabold text-[#261633] mt-0.5">
                  {activeModalProduct.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveModalProduct(null)}
                className="p-1 rounded-full text-[#766B82] hover:bg-[#F3F1F8]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#766B82] block">Product Description</span>
                <p className="text-xs text-[#261633] mt-1 bg-[#F3F1F8] p-3 rounded-xl border border-[#E8E2EF] leading-relaxed">
                  {activeModalProduct.description}
                </p>
              </div>

              {activeModalProduct.maliciousInstruction ? (
                <div className="bg-[#FBEDED] border border-[#F7D2D5] rounded-2xl p-3.5 space-y-2">
                  <span className="font-bold text-[#D64C55] flex items-center gap-1.5 text-xs">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#D64C55]" />
                    Hidden Product Page Prompt Injection Payload:
                  </span>
                  <pre className="font-mono text-[11px] text-[#D64C55] bg-white p-2.5 rounded-xl border border-[#F7D2D5] whitespace-pre-wrap leading-relaxed">
                    {activeModalProduct.maliciousInstruction}
                  </pre>
                  <p className="text-[10px] text-[#D64C55] leading-relaxed">
                    Standard AI shopping agents parse this text into context, which hijacks the transaction. NIYAT deterministic Blind Verifier blocks this automatically.
                  </p>
                </div>
              ) : (
                <div className="bg-[#E8F6EE] border border-[#C4E8D3] rounded-2xl p-3 text-[#168451] text-xs font-semibold flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#168451]" />
                  <span>No prompt injection detected in this catalog SKU description.</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="p-2.5 rounded-xl bg-[#F3F1F8] border border-[#E8E2EF]">
                  <span className="text-[10px] text-[#766B82] uppercase tracking-wider font-semibold block">Base Price:</span>
                  <PriceFormatter paise={activeModalProduct.basePricePaise} className="text-sm font-bold text-[#261633]" />
                </div>
                <div className="p-2.5 rounded-xl bg-[#F3F1F8] border border-[#E8E2EF]">
                  <span className="text-[10px] text-[#766B82] uppercase tracking-wider font-semibold block">Delivery Fee:</span>
                  <span className="text-sm font-bold text-[#261633]">
                    {activeModalProduct.merchant.deliveryFeePaise === 0 ? 'FREE' : <PriceFormatter paise={activeModalProduct.merchant.deliveryFeePaise} />}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={() => setActiveModalProduct(null)}
                className="flex-1 py-2.5 rounded-xl bg-[#F3F1F8] hover:bg-[#E8E2EF] text-[#261633] text-xs font-semibold"
              >
                Close
              </button>
              <button
                onClick={() => handleTestInProtectedMode(activeModalProduct)}
                className="flex-1 py-2.5 rounded-xl bg-[#663A91] hover:bg-[#552F7A] text-white text-xs font-semibold"
              >
                Test in Protected Mode
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
