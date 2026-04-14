import React, { useState, useEffect } from 'react';
import { Search, Star, Activity, Clock, ArrowUpRight, ArrowDownRight, TrendingUp, Loader2, Bell } from 'lucide-react';
import axios from 'axios';
import StockChart from './components/Chart';

// ==========================================================
// 🚀 CONFIGURAÇÃO DE CONEXÃO (DevTunnels Porta 5678)
// ==========================================================
const URL_BASE = 'https://w6t6njlw-5678.brs.devtunnels.ms';

function App() {
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [lastUpdate, setLastUpdate] = useState('--:--:--');
  const [emailAlert, setEmailAlert] = useState('');
  const [indices, setIndices] = useState([
    { ticker: '^BVSP', nome: 'Ibovespa', preco: '---', variacao: 0 },
    { ticker: 'USDBRL', nome: 'Dólar', preco: '---', variacao: 0 },
  ]);

  // --- 1. MOTOR DE ÍNDICES MACRO (TOP BAR) ---
  useEffect(() => {
    const buscarIndicesMacro = async () => {
      try {
        const response = await axios.get(`${URL_BASE}/webhook/indices-macro`);
        if (response.data && Array.isArray(response.data)) {
          const listaMisturada = response.data.sort(() => Math.random() - 0.5);
          setIndices(listaMisturada);
        }
      } catch (err) { 
        console.warn("Erro ao carregar índices macro."); 
      }
    };
    buscarIndicesMacro();
    const intIndices = setInterval(buscarIndicesMacro, 60000);
    return () => clearInterval(intIndices);
  }, []);

  // --- 2. MOTOR DE SINCRONIZAÇÃO TOTAL (GRÁFICO + FAVORITOS + RELÓGIO) ---
  useEffect(() => {
    const buscarDadosAtuais = async () => {
      try {
        // A. Sincroniza os Favoritos (Lê planilha + Busca preço vivo)
        const responseSheet = await axios.get(`${URL_BASE}/webhook/listar-favoritos`);
        if (responseSheet.data && responseSheet.data.length > 0) {
          const promessas = responseSheet.data.map(async (fav) => {
            try {
              const resVivo = await axios.post(`${URL_BASE}/webhook/busca-bolsa`, { ativo: fav.Ticker });
              return {
                Ticker: fav.Ticker, 
                Nome: fav.Nome || resVivo.data.nome,
                Preço: resVivo.data.preco || fav.Preço, 
                Variação: resVivo.data.variacao || fav.Variação 
              };
            } catch (err) { return fav; }
          });
          const atualizados = await Promise.all(promessas);
          setFavorites(atualizados);
        }

        // B. Atualiza o Gráfico Principal (Se houver um ativo selecionado)
        if (search) {
          const resGrafico = await axios.post(`${URL_BASE}/webhook/busca-bolsa`, { ativo: search });
          setData(resGrafico.data);
        }

        // C. Atualiza o relógio (Força o re-render do gráfico via Key)
        setLastUpdate(new Date().toLocaleTimeString('pt-BR'));

      } catch (err) { 
        console.error("Erro na sincronização automática:", err); 
      }
    };

    buscarDadosAtuais();
    const intervalo = setInterval(buscarDadosAtuais, 40000); // Ciclo de 40s
    return () => clearInterval(intervalo);
  }, [search]); 

  // --- 3. LÓGICA DE BUSCA MANUAL E CLIQUE ---
  const buscarDadosAtivo = async (tickerParaBuscar) => {
    if (!tickerParaBuscar) return;
    setLoading(true);

    // Inteligência para índices (Adiciona o ^ se o usuário esquecer)
    let tickerFinal = tickerParaBuscar.toUpperCase();
    if ((tickerFinal === 'BVSP' || tickerFinal === 'IXIC') && !tickerFinal.startsWith('^')) {
      tickerFinal = `^${tickerFinal}`;
    }

    try {
      const response = await axios.post(`${URL_BASE}/webhook/busca-bolsa`, { ativo: tickerFinal });
      setData(response.data);
      setSearch(tickerFinal);
      setLastUpdate(new Date().toLocaleTimeString('pt-BR'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) { 
      console.error("Ativo não encontrado.");
    } finally { 
      setLoading(false); 
    }
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter' && search) buscarDadosAtivo(search);
  };

  const toggleFavorite = async () => {
    if (!data) return;
    const isFavorite = favorites.find(fav => fav.Ticker === search);
    if (isFavorite) {
      setFavorites(favorites.filter(fav => fav.Ticker !== search));
    } else {
      const newFav = { Ticker: search, Nome: data.nome, Preço: data.preco, Variação: data.variacao };
      setFavorites([...favorites, newFav]);
      try { 
        await axios.post(`${URL_BASE}/webhook/f853e9a1-54f1-4ce4-8614-1972eb9a69e4`, newFav); 
      } catch (e) { console.warn("Erro ao salvar favorito."); }
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-slate-200 font-sans selection:bg-blue-500/30">
      <div className="max-w-[1400px] mx-auto p-3 sm:p-6 overflow-x-hidden">
        
        {/* TOP BAR: TICKER TAPE (CLICÁVEL) */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 border-b border-zinc-800/40 no-scrollbar">
          {indices.map((idx) => (
            <button key={idx.ticker} onClick={() => buscarDadosAtivo(idx.ticker)} className="flex-none bg-zinc-900/10 border border-zinc-800/40 rounded-lg px-3 py-2 min-w-[120px] text-left transition-all hover:border-blue-500/40 active:scale-95">
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

        {/* HEADER: LOGO E STATUS LIVE */}
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-blue-500 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="BUSCAR ATIVO..." 
              className="w-full bg-zinc-900/30 border border-zinc-800/50 rounded-lg py-2.5 pl-10 pr-4 focus:outline-none focus:ring-1 focus:ring-blue-500/40 text-xs font-mono uppercase transition-all" 
              value={search} 
              onChange={(e) => setSearch(e.target.value.toUpperCase())} 
              onKeyDown={handleSearch} 
            />
          </div>
        </header>

        {/* GRID PRINCIPAL */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* LADO ESQUERDO: GRÁFICO (9 Colunas no Desktop) */}
          <div className="lg:col-span-9 space-y-5">
            {data ? (
              <div className="bg-zinc-900/20 border border-zinc-800/60 rounded-2xl p-4 sm:p-6 backdrop-blur-md">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-4xl font-black font-mono text-white tracking-tighter">{search}</h2>
                      <span className="bg-zinc-800/50 text-zinc-500 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest">B3_LISTED</span>
                    </div>
                    <p className="text-zinc-500 text-xs font-medium uppercase mt-1">{data.nome || data.Nome}</p>
                  </div>
                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between">
                    <div className="text-right">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl font-black font-mono text-white">
                          <small className="text-zinc-600 text-base font-sans mr-1">R$</small>
                          {data?.preco?.toString().replace('R$', '').trim()}
                        </span>
                        <div className={`px-2 py-0.5 rounded-md font-bold font-mono text-xs ${parseFloat(data.variacao) >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                          {parseFloat(data.variacao) >= 0 ? '+' : ''}{data.variacao}%
                        </div>
                      </div>
                    </div>
                    <button onClick={toggleFavorite} className={`p-2.5 rounded-lg border transition-all ${favorites.find(f => f.Ticker === search) ? 'bg-amber-500/10 border-amber-500/50 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.1)]' : 'bg-zinc-800/40 border-zinc-700 text-zinc-500'}`}>
                      <Star size={18} fill={favorites.find(f => f.Ticker === search) ? "currentColor" : "none"} />
                    </button>
                  </div>
                </div>

                {/* AREA DO GRÁFICO COM KEY DINÂMICA */}
                <div className="h-[320px] sm:h-[400px] bg-zinc-950/60 rounded-xl border border-zinc-800/40 overflow-hidden relative shadow-inner">
                  {loading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/20 backdrop-blur-sm z-10">
                      <Loader2 className="animate-spin text-blue-500 mb-2" size={24} />
                      <span className="text-[9px] font-mono text-zinc-600 tracking-widest uppercase">Fetching_Data</span>
                    </div>
                  ) : (
                    data?.historico ? (
                      <StockChart 
                        key={`chart-${search}-${lastUpdate}`} // 🚀 Força atualização a cada batida do relógio
                        seriesData={data.historico} 
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center text-zinc-800 font-mono text-[9px] tracking-widest uppercase">Waiting_Selection</div>
                    )
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-zinc-900/5 border border-dashed border-zinc-900/50 rounded-2xl h-[400px] flex flex-col items-center justify-center text-center p-10 opacity-50">
                <TrendingUp size={40} className="text-zinc-900 mb-4" />
                <p className="text-zinc-700 text-[10px] uppercase tracking-widest font-mono">Terminal aguardando busca global</p>
              </div>
            )}

            {/* STATUS BOX */}
            <div className="bg-blue-600/5 border border-blue-500/10 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4">
              <Bell size={16} className="text-blue-500/50" />
              <div className="flex-1 text-[10px] text-zinc-600 font-mono uppercase tracking-tight">
                Sincronização automática ativa para <span className="text-zinc-400">{search || 'o terminal'}</span>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <input type="email" placeholder="E-MAIL" className="bg-zinc-950/50 border border-zinc-800 rounded px-3 py-1.5 text-[10px] flex-1 sm:w-40 focus:border-blue-500 outline-none text-zinc-400" value={emailAlert} onChange={(e) => setEmailAlert(e.target.value)} />
                <button className="bg-blue-600 text-white font-bold px-4 py-1.5 rounded text-[9px] tracking-widest hover:bg-blue-500 transition-colors">SET</button>
              </div>
            </div>
          </div>

          {/* LADO DIREITO: WATCHLIST (3 Colunas no Desktop) */}
          <aside className="lg:col-span-3 space-y-4">
            <div className="bg-zinc-900/10 border border-zinc-800/40 rounded-2xl p-4 backdrop-blur-sm shadow-xl">
              <div className="flex justify-between items-center mb-5 border-b border-zinc-800/50 pb-3">
                <h2 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <Star size={12} className="text-amber-500" fill="currentColor"/> Watchlist
                </h2>
                <div className="flex items-center gap-1 text-[8px] text-zinc-600 font-mono bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800/50">
                  <Clock size={10} /> {lastUpdate}
                </div>
              </div>
              
              <div className="space-y-2">
                {favorites.length === 0 ? (
                  <div className="text-[9px] text-center py-10 text-zinc-800 font-mono uppercase tracking-[0.2em]">Empty_Stack</div>
                ) : (
                  favorites.map((fav) => (
                    <button key={fav.Ticker} onClick={() => buscarDadosAtivo(fav.Ticker)} className="w-full flex justify-between items-center p-3 bg-zinc-950/30 border border-zinc-800/30 rounded-xl hover:border-blue-500/20 transition-all group">
                      <div className="text-left">
                        <p className="font-bold text-xs text-zinc-300 group-hover:text-blue-400 transition-colors tracking-tighter">{fav.Ticker}</p>
                        <p className="text-[8px] text-zinc-600 truncate max-w-[80px] uppercase font-bold">{fav.Nome}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-mono font-bold text-white">{fav.Preço?.toString().replace('R$', '').trim()}</p>
                        <p className={`text-[8px] font-bold font-mono ${parseFloat(fav.Variação) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {parseFloat(fav.Variação) >= 0 ? '+' : ''}{fav.Variação}%
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}

export default App;