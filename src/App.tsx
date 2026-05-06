import React, { useState, useMemo } from 'react';
import { Mosque, CommuneStats, NUMERIC_FIELD_THRESHOLDS, Threshold } from './types';
import { calculateStats, exportToCSV, validateCoordinate, parseMosqueFile } from './utils';
import { Dashboard } from './components/Dashboard';
import { StatsTable } from './components/StatsTable';
import { MosqueMap } from './components/MosqueMap';
import { MosqueSearch } from './components/MosqueSearch';
import { MosqueIndicators } from './components/MosqueIndicators';
import { MosqueComparison } from './components/MosqueComparison';
import { Button, Card, Badge, cn } from './components/UI';
import { Upload, Search, Download, Map as MapIcon, BarChart3, Table as TableIcon, Sun, Moon, Filter, X, AlertTriangle, FileText, TrendingUp, GitCompare, Settings } from 'lucide-react';

export default function App() {
  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'dashboard' | 'table' | 'map' | 'search' | 'indicators' | 'comparison'>('dashboard');
  const [selectedMosque, setSelectedMosque] = useState<Mosque | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [files, setFiles] = useState<string[]>([]);
  const [thresholds, setThresholds] = useState<Record<string, Threshold>>(NUMERIC_FIELD_THRESHOLDS);
  
  // Filters
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    commune: "",
    region: "",
    province: "",
    type: "",
    etat: "",
    status: ""
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles) return;

    setLoading(true);
    const fileList = Array.from(uploadedFiles) as File[];
    setFiles(prev => [...prev, ...fileList.map(f => f.name)]);

    const promises = fileList.map(file => parseMosqueFile(file));

    Promise.all(promises).then(results => {
      const merged = results.flat();
      if (merged.length > 0) {
        setMosques(prev => [...prev, ...merged]);
      }
      setLoading(false);
      e.target.value = '';
    }).catch(err => {
      console.error("Error processing files:", err);
      setLoading(false);
      e.target.value = '';
    });
  };

  const filteredMosques = useMemo(() => {
    return mosques.filter(m => {
      const matchesSearch = 
        (m.code?.toString().includes(search)) ||
        (m.dénomination_en_français?.toLowerCase().includes(search.toLowerCase())) ||
        (m.dénomination_en_arabe?.includes(search));
      
      const matchesCommune = !filters.commune || m.commune === filters.commune;
      const matchesRegion = !filters.region || m.region === filters.region;
      const matchesProvince = !filters.province || m.province === filters.province;
      const matchesType = !filters.type || m.type_de_mosquée === filters.type;
      const matchesEtat = !filters.etat || m.etat_batiment === filters.etat;
      const matchesStatus = !filters.status || m.status === filters.status;

      return matchesSearch && matchesCommune && matchesRegion && matchesProvince && matchesType && matchesEtat && matchesStatus;
    });
  }, [mosques, search, filters]);

  const stats = useMemo(() => calculateStats(filteredMosques, thresholds), [filteredMosques, thresholds]);

  const uniqueValues = useMemo(() => {
    return {
      communes: Array.from(new Set(mosques.map(m => m.commune).filter(Boolean))).sort(),
      regions: Array.from(new Set(mosques.map(m => m.region).filter(Boolean))).sort(),
      provinces: Array.from(new Set(mosques.map(m => m.province).filter(Boolean))).sort(),
      types: Array.from(new Set(mosques.map(m => m.type_de_mosquée).filter(Boolean))).sort(),
      etats: Array.from(new Set(mosques.map(m => m.etat_batiment).filter(Boolean))).sort(),
      statuses: Array.from(new Set(mosques.map(m => m.status).filter(Boolean))).sort(),
    };
  }, [mosques]);

  const handleExportStats = () => {
    const exportData = stats.map(s => ({
      Commune: s.commune,
      Total: s.count,
      ...Object.entries(s.numericFields).reduce((acc, [f, v]) => ({
        ...acc,
        [`${f}_Total`]: (v as any).total,
        [`${f}_Null`]: (v as any).nullMissing,
        [`${f}_Flagged`]: (v as any).flaggedCount,
      }), {}),
      ...Object.entries(s.booleanFields).reduce((acc, [f, v]) => ({
        ...acc,
        [`${f}_Y`]: (v as any).totalY,
        [`${f}_N`]: (v as any).totalN,
        [`${f}_Null`]: (v as any).nullMissing,
      }), {}),
      Coord_Valide: s.coordinates.valid,
      Coord_Suspect: s.coordinates.invalid,
      Coord_Null: s.coordinates.null,
    }));
    exportToCSV(exportData, "statistiques_communes.csv");
  };

  const handleExportFlagged = () => {
    const flagged = mosques.filter(m => {
      const lonRes = validateCoordinate(m.longitude, "lon");
      const latRes = validateCoordinate(m.latitude, "lat");
      return lonRes.isSuspicious || latRes.isSuspicious || (!lonRes.isValid && !lonRes.isNull) || (!latRes.isValid && !latRes.isNull);
    }).map(m => {
      const lonRes = validateCoordinate(m.longitude, "lon");
      const latRes = validateCoordinate(m.latitude, "lat");
      return {
        code: m.code,
        commune: m.commune,
        longitude: m.longitude,
        latitude: m.latitude,
        flag_reason: `${lonRes.reason || ""} ${latRes.reason || ""}`.trim()
      };
    });
    exportToCSV(flagged, "coordonnees_suspectes.csv");
  };

  const handleShowOnMap = (mosque: Mosque) => {
    setSelectedMosque(mosque);
    setView('map');
  };

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans transition-colors">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">M</div>
              <h1 className="text-xl font-bold tracking-tight">Mosquée Data Analyser</h1>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Upload Section */}
          <section className="mb-8">
            <Card className="p-8 border-dashed border-2 flex flex-col items-center justify-center text-center">
              <Upload className="w-12 h-12 text-emerald-600 mb-4" />
              <h2 className="text-xl font-bold mb-2">Importer des données xlsx</h2>
              <p className="text-zinc-500 mb-6 max-w-md">
                Sélectionnez un fichier xlsx contenant l'inventaire des mosquées.
              </p>
              <input 
                type="file" 
                multiple 
                accept=".json,.xlsx,.xls" 
                onChange={handleFileUpload}
                className="hidden" 
                id="file-upload"
              />
              <label 
                htmlFor="file-upload" 
                className={cn(
                  "px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer",
                  "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20",
                  loading && "opacity-50 cursor-not-allowed"
                )}
              >
                <Upload size={20} />
                {loading ? "Chargement..." : "Choisir des fichiers"}
              </label>
            </Card>

            {mosques.length > 0 && (
              <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between">
                <div>
                  <p className="font-bold text-emerald-800 dark:text-emerald-400">
                    {mosques.length} enregistrements chargés
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-500">
                    Sources: {files.join(", ")}
                  </p>
                </div>
                <Button variant="ghost" onClick={() => { setMosques([]); setFiles([]); }} className="text-emerald-700">
                  <X size={16} /> Réinitialiser
                </Button>
              </div>
            )}
          </section>

          {mosques.length > 0 && (
            <>
              {/* Search & Filter */}
              <section className="mb-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="relative md:col-span-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                    <input 
                      type="text"
                      placeholder="Rechercher par code, nom (FR/AR)..."
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 md:col-span-2">
                    <Button variant="secondary" onClick={handleExportStats} className="flex-1">
                      <Download size={18} /> Stats CSV
                    </Button>
                    <Button variant="danger" onClick={handleExportFlagged} className="flex-1">
                      <AlertTriangle size={18} /> Flagged CSV
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <select 
                    className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs"
                    value={filters.commune}
                    onChange={(e) => setFilters({...filters, commune: e.target.value})}
                  >
                    <option value="">Toutes les Communes</option>
                    {uniqueValues.communes.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select 
                    className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs"
                    value={filters.region}
                    onChange={(e) => setFilters({...filters, region: e.target.value})}
                  >
                    <option value="">Toutes les Régions</option>
                    {uniqueValues.regions.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <select 
                    className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs"
                    value={filters.province}
                    onChange={(e) => setFilters({...filters, province: e.target.value})}
                  >
                    <option value="">Toutes les Provinces</option>
                    {uniqueValues.provinces.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <select 
                    className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs"
                    value={filters.type}
                    onChange={(e) => setFilters({...filters, type: e.target.value})}
                  >
                    <option value="">Tous les Types</option>
                    {uniqueValues.types.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <select 
                    className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs"
                    value={filters.etat}
                    onChange={(e) => setFilters({...filters, etat: e.target.value})}
                  >
                    <option value="">Tous les États</option>
                    {uniqueValues.etats.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                  <select 
                    className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs"
                    value={filters.status}
                    onChange={(e) => setFilters({...filters, status: e.target.value})}
                  >
                    <option value="">Tous les Statuts</option>
                    {uniqueValues.statuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </section>

              {/* Navigation Tabs */}
              <div className="flex gap-2 mb-6 border-b border-zinc-200 dark:border-zinc-800">
                <button 
                  onClick={() => setView('dashboard')}
                  className={`px-4 py-2 font-medium flex items-center gap-2 border-b-2 transition-all ${view === 'dashboard' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-zinc-500'}`}
                >
                  <BarChart3 size={18} /> Dashboard
                </button>
                <button 
                  onClick={() => setView('table')}
                  className={`px-4 py-2 font-medium flex items-center gap-2 border-b-2 transition-all ${view === 'table' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-zinc-500'}`}
                >
                  <TableIcon size={18} /> Statistiques
                </button>
                <button 
                  onClick={() => setView('map')}
                  className={`px-4 py-2 font-medium flex items-center gap-2 border-b-2 transition-all ${view === 'map' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-zinc-500'}`}
                >
                  <MapIcon size={18} /> Carte
                </button>
                <button 
                  onClick={() => setView('search')}
                  className={`px-4 py-2 font-medium flex items-center gap-2 border-b-2 transition-all ${view === 'search' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-zinc-500'}`}
                >
                  <FileText size={18} /> Fiche Mosquée
                </button>
                <button 
                  onClick={() => setView('indicators')}
                  className={`px-4 py-2 font-medium flex items-center gap-2 border-b-2 transition-all ${view === 'indicators' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-zinc-500'}`}
                >
                  <TrendingUp size={18} /> Indicateurs
                </button>
                <button 
                  onClick={() => setView('comparison')}
                  className={`px-4 py-2 font-medium flex items-center gap-2 border-b-2 transition-all ${view === 'comparison' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-zinc-500'}`}
                >
                  <GitCompare size={18} /> Comparaison
                </button>
              </div>

              {/* Main Content */}
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {view === 'dashboard' && <Dashboard mosques={filteredMosques} />}
                {view === 'table' && (
                  <StatsTable 
                    stats={stats} 
                    mosques={filteredMosques} 
                    onShowOnMap={handleShowOnMap}
                    thresholds={thresholds}
                    setThresholds={setThresholds}
                  />
                )}
                {view === 'map' && <MosqueMap mosques={filteredMosques} selectedMosque={selectedMosque} />}
                {view === 'search' && <MosqueSearch mosques={mosques} />}
                {view === 'indicators' && <MosqueIndicators mosques={filteredMosques} />}
          {view === 'comparison' && <MosqueComparison />}
        </div>
      </>
    )}
  </main>
</div>
    </div>
  );
}
