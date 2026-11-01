import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { TransactionRecord, WalletSummary } from '../services/types.js';
import {
  Sparkles,
  Search,
  Mic,
  MicOff,
  ShieldCheck,
  ArrowRight,
  Store,
  ChevronRight,
  Shield,
  Layers
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<TransactionRecord[]>([]);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    api.getWallet('user_default')
      .then(setWallet)
      .catch(() => {});

    api.getTransactions(5)
      .then(setRecentTransactions)
      .catch(() => {});
  }, []);

  const handleStartShopping = (customPrompt?: string) => {
    const finalPrompt = customPrompt || prompt;
    if (!finalPrompt.trim()) return;
    navigate('/shop', { state: { prefilledPrompt: finalPrompt } });
  };

  const toggleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      // Fallback simulated dictation
      const sampleDictations = [
        'Find me 1 litre of Amul Taaza milk for around ₹150.',
        'Order 1 Apple MacBook Air M2 under ₹85,000.',
        'Buy 2 packs of Amul butter under ₹200.'
      ];
      const randomPrompt = sampleDictations[Math.floor(Math.random() * sampleDictations.length)];
      setPrompt(randomPrompt);
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setPrompt(transcript);
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const suggestedPrompts = [
    {
      label: '1L Amul Taaza Milk around ₹150',
      prompt: 'Find me 1 litre of Amul Taaza milk for around ₹150.',
      tag: 'Normal (ALLOW)',
      accent: 'border-emerald-200 bg-emerald-50/60 text-emerald-900'
    },
    {
      label: 'MacBook Air M2 under ₹85,000',
      prompt: 'Buy 1 Apple MacBook Air M2 under ₹85,000.',
      tag: 'High-Value (ALLOW)',
      accent: 'border-blue-200 bg-blue-50/60 text-blue-900'
    },
    {
      label: '2 Packs Amul Butter under ₹200',
      prompt: 'Buy 2 packs of Amul butter under ₹200.',
      tag: 'Multi-Pack (ALLOW)',
      accent: 'border-indigo-200 bg-indigo-50/60 text-indigo-900'
    },
    {
      label: 'Hindi: "1L doodh 150 rupaye me chahiye"',
      prompt: 'Ek litre Amul Taaza doodh chahiye 150 rupaye me',
      tag: 'Multilingual (ALLOW)',
      accent: 'border-purple-200 bg-purple-50/60 text-purple-900'
    },
    {
      label: 'Ambiguous: "Amul Taaza doodh chahiye"',
      prompt: 'Amul Taaza doodh chahiye',
      tag: 'Missing Budget (ASK)',
      accent: 'border-amber-200 bg-amber-50/60 text-amber-900'
    }
  ];

  const featuredItems = [
    {
      title: 'Amul Taaza Toned Milk (1 Litre)',
      brand: 'Amul',
      category: 'Dairy',
      image: '🥛',
      lowestPrice: '₹54.00',
      merchantsCount: 2,
      prompt: 'Find me 1 litre of Amul Taaza milk for around ₹150.'
    },
    {
      title: 'Apple MacBook Air M2 (8GB / 256GB)',
      brand: 'Apple',
      category: 'Electronics',
      image: '💻',
      lowestPrice: '₹79,900.00',
      merchantsCount: 2,
      prompt: 'Buy 1 Apple MacBook Air M2 under ₹85,000.'
    },
    {
      title: 'Amul Pasteurised Butter (500g)',
      brand: 'Amul',
      category: 'Dairy',
      image: '🧈',
      lowestPrice: '₹106.00',
      merchantsCount: 2,
      prompt: 'Buy 2 packs of Amul butter under ₹200.'
    },
    {
      title: 'Nike Revolution 6 Running Shoes',
      brand: 'Nike',
      category: 'Footwear',
      image: '👟',
      lowestPrice: '₹3,695.00',
      merchantsCount: 2,
      prompt: 'Buy 1 pair of Nike Revolution shoes under ₹4,000.'
    }
  ];

  return (
    <div className="px-4 py-5 space-y-6 animate-fade-in pb-20">
      {/* 1. Header & Identity */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 flex items-center gap-1">
              <Shield className="w-3 h-3 text-blue-600" />
              NIYAT Wall Active
            </span>
            <span className="text-[10px] font-semibold text-slate-400">
              Zero-Trust Layer
            </span>
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            AI Shopping Assistant
          </h1>
        </div>

        {/* Discreet Pocket Balance indicator */}
        <Link
          to="/profile"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white shadow-sm hover:bg-slate-800 transition touch-target"
          title="Demo Pocket Balance"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-mono font-bold">
            ₹{wallet ? wallet.balanceRupees.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '5,000'}
          </span>
        </Link>
      </div>

      {/* 2. Primary Promise Banner */}
      <div className="rounded-2xl p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-400/40 text-blue-300 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-5 h-5 text-blue-300" />
          </div>
          <div>
            <h2 className="text-sm font-black tracking-tight text-white">
              Autonomous AI Shopping with Independent Payment Security
            </h2>
            <p className="text-xs text-slate-300 font-medium leading-relaxed mt-1">
              "Your AI can shop for you, but it cannot spend your money without passing NIYAT verification."
            </p>
          </div>
        </div>
      </div>

      {/* 3. Primary Natural Language Shopping Input */}
      <div className="card p-4 space-y-3 shadow-sm border border-slate-200 bg-white">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Search className="w-4 h-4 text-blue-600" />
            <span>Tell your AI what to buy</span>
          </label>
          <span className="text-[10px] text-slate-400 font-medium">English • Hindi • Hinglish</span>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleStartShopping();
          }}
          className="space-y-2.5"
        >
          <div className="relative">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Find me 1 litre of Amul Taaza milk for around ₹150."
              className="w-full pl-3.5 pr-11 py-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50 transition touch-target"
            />
            <button
              type="button"
              onClick={toggleVoiceInput}
              className={`absolute right-2 top-2 p-1.5 rounded-lg transition touch-target ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
              }`}
              title={isListening ? 'Listening...' : 'Voice Input'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={!prompt.trim()}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition touch-target"
          >
            <Sparkles className="w-4 h-4" />
            <span>Dispatch AI Shopping Agent</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Suggested Prompts Carousel / Chips */}
        <div className="pt-2 border-t border-slate-100 space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Suggested Shopping Requests:
          </span>
          <div className="flex flex-col gap-1.5">
            {suggestedPrompts.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setPrompt(s.prompt);
                  handleStartShopping(s.prompt);
                }}
                className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between gap-2 touch-target hover:shadow-2xs ${s.accent}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold truncate">{s.prompt}</div>
                  <div className="text-[10px] opacity-75 font-medium">{s.label}</div>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/90 border border-current shrink-0">
                  {s.tag}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. How the NIYAT Wall Protects Every Purchase */}
      <div className="card p-4 space-y-3 bg-slate-50 border border-slate-200">
        <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2">
          <Layers className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            How The NIYAT Wall Protects You
          </h3>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
            <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center mx-auto">
              1
            </div>
            <div className="text-[11px] font-bold text-slate-900 leading-tight">AI Agent Shops</div>
            <p className="text-[10px] text-slate-500 leading-tight">Searches & compares merchant prices</p>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
            <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 font-bold text-xs flex items-center justify-center mx-auto">
              2
            </div>
            <div className="text-[11px] font-bold text-slate-900 leading-tight">Order Request</div>
            <p className="text-[10px] text-slate-500 leading-tight">Creates payment request without paying</p>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-blue-200 shadow-2xs space-y-1">
            <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 font-bold text-xs flex items-center justify-center mx-auto">
              3
            </div>
            <div className="text-[11px] font-bold text-slate-900 leading-tight">NIYAT Wall</div>
            <p className="text-[10px] text-slate-500 leading-tight">Intersects & independently verifies</p>
          </div>
        </div>
      </div>

      {/* 5. Featured Catalog SKUs (One-Tap Agent Shopping) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Store className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900">Featured Products</h3>
          </div>
          <Link
            to="/explore"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <span>Explore Catalog</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {featuredItems.map((item, idx) => (
            <div
              key={idx}
              className="card p-3 bg-white border border-slate-200 shadow-subtle hover:border-blue-300 transition flex flex-col justify-between"
            >
              <div>
                <div className="text-2xl mb-1.5">{item.image}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {item.brand} • {item.category}
                </div>
                <div className="text-xs font-bold text-slate-900 line-clamp-2 mt-0.5">
                  {item.title}
                </div>
              </div>

              <div className="pt-2.5 mt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-[9px] text-slate-400 font-medium">Landed from</div>
                  <div className="text-xs font-extrabold text-slate-900">{item.lowestPrice}</div>
                </div>
                <button
                  onClick={() => handleStartShopping(item.prompt)}
                  className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white text-[11px] font-bold transition flex items-center gap-1 touch-target shadow-2xs"
                >
                  <span>Shop</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Recent Shopping & Wall Interceptions */}
      <div className="card p-4 space-y-3 bg-white border border-slate-200 shadow-subtle">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Recent Wall Interceptions
            </h3>
          </div>
          <Link
            to="/orders"
            className="text-[11px] font-semibold text-blue-600 hover:text-blue-800"
          >
            View History
          </Link>
        </div>

        {recentTransactions.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {recentTransactions.slice(0, 4).map((tx) => (
              <div key={tx.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 truncate">
                    {tx.productTitle || tx.userRequest}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {tx.merchantName} • {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-bold text-slate-900">
                    ₹{(tx.totalAmountPaise / 100).toFixed(2)}
                  </div>
                  <span
                    className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider ${
                      tx.status === 'ALLOW'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : tx.status === 'ASK'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {tx.status === 'ALLOW' ? 'Verified' : tx.status === 'ASK' ? 'Review' : 'Blocked'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-5 text-center text-xs text-slate-400">
            No shopping transactions yet. Try submitting a prompt above!
          </div>
        )}
      </div>
    </div>
  );
};
