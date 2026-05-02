import React, { useState } from 'react';
import { Mosque, ComparisonResult } from '../types';
import { compareMosqueData, parseMosqueFile } from '../utils';
import { Card, Button, Badge } from './UI';
import { Upload, ArrowRight, CheckCircle2, AlertCircle, Info, Download, Table as TableIcon, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const MosqueComparison: React.FC = () => {
  const [fileBefore, setFileBefore] = useState<{ name: string; data: Mosque[] } | null>(null);
  const [fileAfter, setFileAfter] = useState<{ name: string; data: Mosque[] } | null>(null);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'added' | 'removed' | 'modified'>('summary');
  const [modifiedFilter, setModifiedFilter] = useState<'all' | 'surfaces' | 'coordinates' | 'latrines'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const data = await parseMosqueFile(file);
      if (type === 'before') {
        setFileBefore({ name: file.name, data });
      } else {
        setFileAfter({ name: file.name, data });
      }
      setResult(null); // Reset result when files change
    } catch (err) {
      console.error("Error parsing file:", err);
      alert("Erreur lors de la lecture du fichier.");
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = () => {
    if (!fileBefore || !fileAfter) return;
    const comparisonResult = compareMosqueData(fileBefore.data, fileAfter.data);
    setResult(comparisonResult);
    setActiveTab('summary');
  };

  const filteredModified = result?.modified.filter(m => {
    const matchesSearch = m.after.dénomination_en_français?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         m.after.code.toString().includes(searchTerm);
    
    if (!matchesSearch) return false;

    if (modifiedFilter === 'surfaces') {
      return m.changes.some(c => c.includes('surface_salle_de_prière'));
    }
    if (modifiedFilter === 'coordinates') {
      return m.changes.some(c => c === 'longitude' || c === 'latitude');
    }
    if (modifiedFilter === 'latrines') {
      return m.changes.some(c => c.includes('surface_latrines'));
    }
    return true;
  }) || [];

  const filteredAdded = result?.added.filter(m => 
    m.dénomination_en_français?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.code.toString().includes(searchTerm)
  ) || [];

  const filteredRemoved = result?.removed.filter(m => 
    m.dénomination_en_français?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.code.toString().includes(searchTerm)
  ) || [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-6">
        {/* File Before */}
        <Card className="flex-1 p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Badge variant="default">1</Badge> Fichier "Avant"
          </h3>
          <div className="relative group">
            <input
              type="file"
              accept=".json,.xlsx,.xls"
              onChange={(e) => handleFileChange(e, 'before')}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-colors ${fileBefore ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10' : 'border-zinc-200 dark:border-zinc-800 group-hover:border-emerald-400'}`}>
              <Upload className={`w-8 h-8 mb-2 ${fileBefore ? 'text-emerald-600' : 'text-zinc-400'}`} />
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                {fileBefore ? fileBefore.name : "Cliquez ou glissez le fichier initial"}
              </p>
              {fileBefore && (
                <div className="mt-2">
                  <Badge variant="success">
                    {fileBefore.data.length} mosquées chargées
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </Card>

        <div className="flex items-center justify-center">
          <ArrowRight className="text-zinc-300 dark:text-zinc-700 hidden md:block" size={32} />
        </div>

        {/* File After */}
        <Card className="flex-1 p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Badge variant="default">2</Badge> Fichier "Après"
          </h3>
          <div className="relative group">
            <input
              type="file"
              accept=".json,.xlsx,.xls"
              onChange={(e) => handleFileChange(e, 'after')}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-colors ${fileAfter ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10' : 'border-zinc-200 dark:border-zinc-800 group-hover:border-emerald-400'}`}>
              <Upload className={`w-8 h-8 mb-2 ${fileAfter ? 'text-emerald-600' : 'text-zinc-400'}`} />
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                {fileAfter ? fileAfter.name : "Cliquez ou glissez le fichier final"}
              </p>
              {fileAfter && (
                <div className="mt-2">
                  <Badge variant="success">
                    {fileAfter.data.length} mosquées chargées
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      <div className="flex justify-center">
        <Button 
          onClick={handleCompare} 
          disabled={!fileBefore || !fileAfter || loading}
          className="px-12 py-4 text-lg shadow-lg shadow-emerald-500/20"
        >
          {loading ? "Chargement..." : "Comparer les données"}
        </Button>
      </div>

      {result && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => {
              const exportData = result.modified.map(m => ({
                Code: m.after.code,
                Nom: m.after.dénomination_en_français || m.after.dénomination_en_arabe,
                Commune: m.after.commune,
                Changements: m.changes.join(", ")
              }));
              // Add added and removed to export if needed
              // For now just modified
              const csvContent = [
                "Code,Nom,Commune,Changements",
                ...exportData.map(row => `${row.Code},"${row.Nom}","${row.Commune}","${row.Changements}"`)
              ].join("\n");
              const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
              const link = document.createElement("a");
              link.href = URL.createObjectURL(blob);
              link.download = `comparaison_${fileBefore?.name}_vs_${fileAfter?.name}.csv`;
              link.click();
            }}>
              <Download size={18} /> Exporter les changements
            </Button>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <Card className="p-4 bg-white dark:bg-zinc-900">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-1">Total Avant</p>
              <p className="text-xl font-bold">{result.summary.totalBefore}</p>
            </Card>
            <Card className="p-4 bg-white dark:bg-zinc-900">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-1">Total Après</p>
              <p className="text-xl font-bold">{result.summary.totalAfter}</p>
            </Card>
            <Card className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30">
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-semibold mb-1">Nouvelles</p>
              <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">+{result.summary.addedCount}</p>
            </Card>
            <Card className="p-4 bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30">
              <p className="text-[10px] text-red-600 dark:text-red-400 uppercase tracking-wider font-semibold mb-1">Supprimées</p>
              <p className="text-xl font-bold text-red-700 dark:text-red-300">-{result.summary.removedCount}</p>
            </Card>
            <Card className="p-4 bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30">
              <p className="text-[10px] text-blue-600 dark:text-blue-400 uppercase tracking-wider font-semibold mb-1">Δ Surfaces</p>
              <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{result.summary.surfaceChanges}</p>
            </Card>
            <Card className="p-4 bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30">
              <p className="text-[10px] text-amber-600 dark:text-amber-400 uppercase tracking-wider font-semibold mb-1">Δ Coords</p>
              <p className="text-xl font-bold text-amber-700 dark:text-amber-300">{result.summary.coordinateChanges}</p>
            </Card>
            <Card className="p-4 bg-purple-50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-900/30">
              <p className="text-[10px] text-purple-600 dark:text-purple-400 uppercase tracking-wider font-semibold mb-1">Δ Latrines</p>
              <p className="text-xl font-bold text-purple-700 dark:text-purple-300">{result.summary.latrineChanges}</p>
            </Card>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-zinc-200 dark:border-zinc-800">
            {[
              { id: 'summary', label: 'Résumé', icon: Info },
              { id: 'added', label: `Nouvelles (${result.summary.addedCount})`, icon: CheckCircle2 },
              { id: 'removed', label: `Supprimées (${result.summary.removedCount})`, icon: AlertCircle },
              { id: 'modified', label: `Modifiées (${result.summary.modifiedCount})`, icon: TableIcon },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
                  activeTab === tab.id 
                    ? 'border-emerald-600 text-emerald-600' 
                    : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search in results */}
          {activeTab !== 'summary' && (
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <input
                  type="text"
                  placeholder="Rechercher par nom ou code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              {activeTab === 'modified' && (
                <div className="flex gap-2">
                  {[
                    { id: 'all', label: 'Tout' },
                    { id: 'surfaces', label: 'Surfaces' },
                    { id: 'coordinates', label: 'Coordonnées' },
                    { id: 'latrines', label: 'Latrines' },
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setModifiedFilter(f.id as any)}
                      className={`px-3 py-1 text-xs font-medium rounded-full border transition-all ${
                        modifiedFilter === f.id 
                          ? 'bg-emerald-600 border-emerald-600 text-white' 
                          : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-emerald-500'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab Content */}
          <div className="min-h-[400px]">
            <AnimatePresence mode="wait">
              {activeTab === 'summary' && (
                <motion.div
                  key="summary"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-4"
                >
                  <Card className="p-6">
                    <h4 className="font-bold mb-4">Analyse de la comparaison</h4>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 shrink-0">
                          <CheckCircle2 size={18} />
                        </div>
                        <div>
                          <p className="font-medium">Croissance du parc</p>
                          <p className="text-sm text-zinc-500">
                            {result.summary.addedCount > result.summary.removedCount 
                              ? `Le nombre total de mosquées a augmenté de ${result.summary.addedCount - result.summary.removedCount}.`
                              : `Le nombre total de mosquées a diminué de ${result.summary.removedCount - result.summary.addedCount}.`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 shrink-0">
                          <TableIcon size={18} />
                        </div>
                        <div>
                          <p className="font-medium">Mises à jour de données</p>
                          <p className="text-sm text-zinc-500">
                            {result.summary.modifiedCount} mosquées existantes ont vu leurs informations modifiées.
                          </p>
                          <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div className="text-xs p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded">
                              <span className="font-bold text-blue-600">{result.summary.surfaceChanges}</span> changements de surfaces
                            </div>
                            <div className="text-xs p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded">
                              <span className="font-bold text-amber-600">{result.summary.coordinateChanges}</span> changements de coordonnées
                            </div>
                            <div className="text-xs p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded">
                              <span className="font-bold text-purple-600">{result.summary.latrineChanges}</span> changements de latrines
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}

              {activeTab === 'added' && (
                <motion.div
                  key="added"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                >
                  <Card className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                          <th className="p-4 font-semibold text-sm">Code</th>
                          <th className="p-4 font-semibold text-sm">Dénomination</th>
                          <th className="p-4 font-semibold text-sm">Commune</th>
                          <th className="p-4 font-semibold text-sm">Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAdded.map(m => (
                          <tr key={m.code} className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                            <td className="p-4 text-sm font-mono">{m.code}</td>
                            <td className="p-4 text-sm font-medium">{m.dénomination_en_français || m.dénomination_en_arabe}</td>
                            <td className="p-4 text-sm text-zinc-500">{m.commune}</td>
                            <td className="p-4 text-sm">
                              <Badge variant="default">{m.type_de_mosquée}</Badge>
                            </td>
                          </tr>
                        ))}
                        {filteredAdded.length === 0 && (
                          <tr>
                            <td colSpan={4} className="p-8 text-center text-zinc-500 italic">Aucune nouvelle mosquée trouvée.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </Card>
                </motion.div>
              )}

              {activeTab === 'removed' && (
                <motion.div
                  key="removed"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                >
                  <Card className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                          <th className="p-4 font-semibold text-sm">Code</th>
                          <th className="p-4 font-semibold text-sm">Dénomination</th>
                          <th className="p-4 font-semibold text-sm">Commune</th>
                          <th className="p-4 font-semibold text-sm">Raison possible</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRemoved.map(m => (
                          <tr key={m.code} className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                            <td className="p-4 text-sm font-mono">{m.code}</td>
                            <td className="p-4 text-sm font-medium">{m.dénomination_en_français || m.dénomination_en_arabe}</td>
                            <td className="p-4 text-sm text-zinc-500">{m.commune}</td>
                            <td className="p-4 text-sm text-red-500 font-medium">Supprimée / Code changé</td>
                          </tr>
                        ))}
                        {filteredRemoved.length === 0 && (
                          <tr>
                            <td colSpan={4} className="p-8 text-center text-zinc-500 italic">Aucune mosquée supprimée.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </Card>
                </motion.div>
              )}

              {activeTab === 'modified' && (
                <motion.div
                  key="modified"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-4"
                >
                  {filteredModified.map(m => (
                    <div key={m.after.code}>
                      <Card className="p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h5 className="font-bold">{m.after.dénomination_en_français || m.after.dénomination_en_arabe}</h5>
                            <p className="text-xs text-zinc-500 font-mono">CODE: {m.after.code}</p>
                          </div>
                          <Badge variant="warning">{m.changes.length} modifications</Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {m.changes.map(field => (
                            <div key={field} className="text-xs p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded border border-zinc-100 dark:border-zinc-800">
                              <p className="font-bold uppercase text-zinc-400 mb-1">{field.replace(/_/g, ' ')}</p>
                              <div className="flex items-center gap-2">
                                <span className="text-red-500 line-through truncate max-w-[150px]">{String(m.before[field] || "vide")}</span>
                                <ArrowRight size={12} className="text-zinc-400" />
                                <span className="text-emerald-600 font-medium truncate max-w-[150px]">{String(m.after[field] || "vide")}</span>
                                {typeof m.after[field] === 'number' && typeof m.before[field] === 'number' && (
                                  <span className={`text-[10px] px-1 rounded ${m.after[field] - m.before[field] > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                    {m.after[field] - m.before[field] > 0 ? '+' : ''}{m.after[field] - m.before[field]}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    </div>
                  ))}
                  {filteredModified.length === 0 && (
                    <Card className="p-8 text-center text-zinc-500 italic">Aucune modification détectée.</Card>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </div>
  );
};
