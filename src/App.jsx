import React, { useState, useEffect, useRef } from 'react';
import { Search, Star, Activity, Clock, TrendingUp, Loader2, Bell } from 'lucide-react';
import axios from 'axios';
import StockChart from './components/Chart';

const API_URL = window.location.hostname === 'localhost' 
  ? 'http://127.0.0.1:8000/api' 
  : '/api';

function App() {
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [lastUpdate, setLastUpdate] = useState('--:--:--');
  const [indices, setIndices] = useState([
    { ticker: '^BVSP', nome: 'Ibovespa', preco: '---', variacao: 0 },
    { ticker: 'USDBRL', nome: 'Dólar', preco: '---', variacao: 0 },
  ]);

  const searchRef = useRef(search);
  useEffect(() => { searchRef.current = search; }, [search]);

  // --- 1. MOTOR DE ÍNDICES MACRO (TOP BAR) ---
  useEffect(() => {
    const buscarIndicesMacro = async () => {
      try {
        const tickersIndices = '^BVSP,USDBRL,^IXIC,EURBRL=X';
        const response = await axios.get(`${API_URL}/stocks/${tickersIndices}`);
        
        // 🚀 BLINDAGEM: Só atualiza se a API retornar resultados válidos
        if (response.data?.results && response.data.results.length > 0) {
          const formatados = response.data.results.map(res => ({
            ticker: res.symbol,
            nome: res.shortName || res.symbol,
            preco: res.regularMarketPrice ? res.regularMarketPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '---',
            variacao: res.regularMarketChangePercent ? res.regularMarketChangePercent.toFixed(2) : '0'
          }));
          setIndices(formatados);
        }
      } catch (err) { 
        console.warn("API de índices indisponível, mantendo valores atuais."); 
      }
    };
    buscarIndicesMacro();
    const intIndices = setInterval(buscarIndicesMacro, 60000);
    return () => clearInterval(intIndices);
  }, []);

  // --- 2. MOTOR DE SINCRONIZAÇÃO (1 MINUTO) ---
  useEffect(() => {
    const sincronizarTudo = async () => {
      try {
        const resFavs = await axios.get(`${API_URL}/favoritos`);
        const listaFavoritosDB = resFavs.data;

        if (listaFavoritosDB && Array.isArray(listaFavoritosDB) && listaFavoritosDB.length > 0) {
          const tickers = listaFavoritosDB.map(f => f.ticker).join(',');
          const resPrecos = await axios.get(`${API_URL}/stocks/${tickers}`);
          
          if (resPrecos.data?.results && resPrecos.data.results.length > 0) {
            setFavorites(listaFavoritosDB.map(fav => {
              const vivo = resPrecos.data.results.find(r => r.symbol === fav.ticker);
              return {
                Ticker: fav.ticker, Nome: fav.nome,
                Preço: vivo ? vivo.regularMarketPrice : '---',
                Variação: vivo ? vivo.regularMarketChangePercent.toFixed(2) : '0'
              };
            }));
          }
        }
        
        const t = searchRef.current;
        if (t && t.length >= 4) await atualizarDados(t, false);
        setLastUpdate(new Date().toLocaleTimeString('pt-BR'));
      } catch (e) { 
        console.error("Erro na sincronização automática."); 
      }
    };
    const intervalo = setInterval(sincronizarTudo, 60000);
    return () => clearInterval(intervalo);
  }, []);

  const atualizarDados = async (ticker, mostrarLoading = true) => {
    if (mostrarLoading) setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/stocks/${ticker.toUpperCase()}`);
      if (res.data?.results && res.data.results.length > 0) {
        const s = res.data.results[0];
        setData({
          nome: s.shortName, preco: s.regularMarketPrice,
          variacao: s.regularMarketChangePercent ? s.regularMarketChangePercent.toFixed(2) : '0',
          historico: s.historicalDataPrice?.map(p => ({
            x: new Date(p.date * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            y: p.close
          })) || []
        });
        setSearch(ticker.toUpperCase());
      }
    } catch (err) {
      console.error("Ativo não encontrado ou erro na API.");
    } finally { setLoading(false); }
  };

  const handleSearch = (e) => { if (e.key === 'Enter') atualizarDados(search); };

  const toggleFavorite = async () => {
    if (!data) return;
    if (!favorites.find(f => f.Ticker === search)) {
      try {
        await axios.post(`${API_URL}/favoritos`, { ticker: search, nome: data.nome });
        const resFavs = await axios.get(`${API_URL}/favoritos`);
        setFavorites(resFavs.data); // Recarrega do banco
      } catch (e) { console.warn("Erro ao favoritar."); }
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-slate-200 font-sans selection:bg-blue-500/30 overflow-x-hidden">
      <div className="max-w-[1400px] mx-auto p-3 sm:p-6">
        
        {/* TOP BAR: ÍNDICES (PERSISTENTE) */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 border-b border-zinc-800/40 no-scrollbar">
          {indices.map((idx) => (
            <button key={idx.ticker} onClick={() => atualizarDados(idx.ticker)} className="flex-none bg-zinc-900/10 border border-zinc-800/40 rounded-lg px-3 py-2 min-w-[120px] text-left transition-all hover:border-blue-500/40 active:scale-95">
              <div className="flex justify-between items-center mb-0.5">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-tighter">{idx.nome}</span>
                <span className={`text-[9px] font-mono font-bold ${parseFloat(idx.variacao) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {parseFloat(idx.variacao) >= 0 ? '+' : ''}{idx.variacao}%
                </span>
              </div>
              <p className="text-xs sm:text-sm font-mono font-bold text-zinc-100">{idx.preco}</p>
            </button>
          ))}
        </div>

        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-zinc-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-500/20">
              <Activity className="text-white" size={22} />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tighter leading-none">BolsaAgente<span className="text-blue-500">.PRO</span></h1>
              <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-mono mt-1 uppercase tracking-wider">
                <span className="flex h-1.5 w-1.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                Mercado em Tempo Real
              </div>
            </div>
          </div>
          <div className="relative group w-full md:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
            <input 
              className="w-full bg-zinc-900/30 border border-zinc-800/50 rounded-lg py-2.5 pl-10 pr-4 focus:outline-none focus:ring-1 focus:ring-blue-500/40 text-xs font-mono uppercase transition-all" 
              placeholder="BUSCAR ATIVO..." value={search} 
              onChange={(e) => setSearch(e.target.value.toUpperCase())} onKeyDown={handleSearch} 
            />
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-9 space-y-5">
            {data ? (
              <div className="bg-zinc-900/20 border border-zinc-800/60 rounded-2xl p-4 sm:p-6 backdrop-blur-md">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-4xl font-black font-mono text-white tracking-tighter">{search}</h2>
                      <span className="bg-zinc-800/50 text-zinc-500 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest">B3_DATA_POSTGRES</span>
                    </div>
                    <p className="text-zinc-500 text-xs font-medium uppercase mt-1">{data.nome}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-3xl font-black font-mono text-white">R$ {data.preco?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      <div className={`text-xs font-bold ${parseFloat(data.variacao) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {parseFloat(data.variacao) >= 0 ? '+' : ''}{data.variacao}%
                      </div>
                    </div>
                    <button onClick={toggleFavorite} className={`p-2.5 rounded-lg border transition-all ${favorites.find(f => f.Ticker === search) ? 'bg-amber-500/10 border-amber-500/50 text-amber-500' : 'bg-zinc-800/40 border-zinc-700 text-zinc-500'}`}>
                      <Star size={18} fill={favorites.find(f => f.Ticker === search) ? "currentColor" : "none"} />
                    </button>
                  </div>
                </div>
                <div className="h-[400px] bg-zinc-950/60 rounded-xl border border-zinc-800/40 overflow-hidden relative">
                  {loading ? <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/20 backdrop-blur-sm z-10"><Loader2 className="animate-spin text-blue-500" /></div> : <StockChart seriesData={data.historico} />}
                </div>
              </div>
            ) : (
              <div className="bg-zinc-900/5 border border-dashed border-zinc-900/50 rounded-2xl h-[400px] flex items-center justify-center text-zinc-700 font-mono text-[10px] uppercase tracking-widest">Aguardando busca global</div>
            )}

            <div className="bg-blue-600/5 border border-blue-500/10 rounded-xl p-4 flex items-center gap-4">
              <Bell size={16} className="text-blue-500/50" />
              <div className="flex-1 text-[10px] text-zinc-600 font-mono uppercase tracking-tight">
                Backend FastAPI ativo | <span className="text-zinc-400">Status: OK</span>
              </div>
              <div className="text-[10px] font-mono text-zinc-500">B3_LIVE</div>
            </div>
          </div>

          <aside className="lg:col-span-3">
            <div className="bg-zinc-900/10 border border-zinc-800/40 rounded-2xl p-4 shadow-xl min-h-[400px]">
              <div className="flex justify-between items-center mb-5 border-b border-zinc-800/50 pb-3">
                <h2 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2"><Star size={12} className="text-amber-500" fill="currentColor"/> Watchlist</h2>
                <div className="flex items-center gap-1 text-[8px] text-zinc-600 font-mono bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800/50"><Clock size={10} /> {lastUpdate}</div>
              </div>
              <div className="space-y-2">
                {favorites.length === 0 ? <div className="text-[9px] text-center py-10 text-zinc-800 font-mono uppercase tracking-widest">Empty_Stack</div> : favorites.map((fav) => (
                  <button key={fav.Ticker} onClick={() => atualizarDados(fav.Ticker)} className="w-full flex justify-between items-center p-3 bg-zinc-950/30 border border-zinc-800/30 rounded-xl hover:border-blue-500/20 transition-all">
                    <div className="text-left">
                      <p className="font-bold text-sm text-zinc-300 tracking-tighter">{fav.Ticker}</p>
                      <p className="text-[8px] text-zinc-600 truncate max-w-[80px] uppercase font-bold">{fav.Nome}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-mono font-bold text-white">{fav.Preço ? `R$ ${fav.Preço}` : '---'}</p>
                      <p className={`text-[8px] font-bold ${parseFloat(fav.Variação) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{fav.Variação}%</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}

export default App;