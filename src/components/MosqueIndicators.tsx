import React, { useMemo, useState } from 'react';
import { Mosque } from '../types';
import { Card, Badge } from './UI';
import { BarChart3, TrendingUp, Users, Home, Table as TableIcon, Search, ArrowUpDown } from 'lucide-react';

interface MosqueIndicatorsProps {
  mosques: Mosque[];
}

type SortField = 'name' | 'count' | 'ratioLatrineHomme' | 'ratioLatrineFemme' | 'ratioSallePriereFemme' | 'ratioSallePriereHomme';

export const MosqueIndicators: React.FC<MosqueIndicatorsProps> = ({ mosques }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [minRatio, setMinRatio] = useState<number>(0);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const stats = useMemo(() => {
    const totals = {
      latrineHommeSurface: 0,
      latrineHommeCount: 0,
      latrineFemmeSurface: 0,
      latrineFemmeCount: 0,
      sallePriereFemmeSurface: 0,
      sallePriereFemmeCount: 0,
      sallePriereHommeSurface: 0,
      sallePriereHommeCount: 0,
    };

    mosques.forEach(m => {
      totals.latrineHommeSurface += parseFloat(m.surface_latrines_homme?.toString() || '0');
      totals.latrineHommeCount += parseFloat(m.nombre_latrines_homme?.toString() || '0');
      totals.latrineFemmeSurface += parseFloat(m.surface_latrines_femme?.toString() || '0');
      totals.latrineFemmeCount += parseFloat(m.nombre_latrines_femme?.toString() || '0');
      totals.sallePriereFemmeSurface += parseFloat(m.surface_salle_de_prière_femme?.toString() || '0');
      totals.sallePriereFemmeCount += parseFloat(m.nombre_salle_de_prière_femme?.toString() || '0');
      totals.sallePriereHommeSurface += parseFloat(m.surface_salle_de_prière_hommes?.toString() || '0');
      totals.sallePriereHommeCount += parseFloat(m.nombre_salle_de_prière_hommes?.toString() || '0');
    });

    return {
      ratioLatrineHomme: totals.latrineHommeCount > 0 ? (totals.latrineHommeSurface / totals.latrineHommeCount).toFixed(2) : '0.00',
      ratioLatrineFemme: totals.latrineFemmeCount > 0 ? (totals.latrineFemmeSurface / totals.latrineFemmeCount).toFixed(2) : '0.00',
      ratioSallePriereFemme: totals.sallePriereFemmeCount > 0 ? (totals.sallePriereFemmeSurface / totals.sallePriereFemmeCount).toFixed(2) : '0.00',
      ratioSallePriereHomme: totals.sallePriereHommeCount > 0 ? (totals.sallePriereHommeSurface / totals.sallePriereHommeCount).toFixed(2) : '0.00',
    };
  }, [mosques]);

  const communeStats = useMemo(() => {
    const groups: Record<string, any> = {};

    mosques.forEach(m => {
      const commune = m.commune || 'Inconnu';
      if (!groups[commune]) {
        groups[commune] = {
          latrineHommeSurface: 0,
          latrineHommeCount: 0,
          latrineFemmeSurface: 0,
          latrineFemmeCount: 0,
          sallePriereFemmeSurface: 0,
          sallePriereFemmeCount: 0,
          sallePriereHommeSurface: 0,
          sallePriereHommeCount: 0,
          count: 0
        };
      }
      groups[commune].latrineHommeSurface += parseFloat(m.surface_latrines_homme?.toString() || '0');
      groups[commune].latrineHommeCount += parseFloat(m.nombre_latrines_homme?.toString() || '0');
      groups[commune].latrineFemmeSurface += parseFloat(m.surface_latrines_femme?.toString() || '0');
      groups[commune].latrineFemmeCount += parseFloat(m.nombre_latrines_femme?.toString() || '0');
      groups[commune].sallePriereFemmeSurface += parseFloat(m.surface_salle_de_prière_femme?.toString() || '0');
      groups[commune].sallePriereFemmeCount += parseFloat(m.nombre_salle_de_prière_femme?.toString() || '0');
      groups[commune].sallePriereHommeSurface += parseFloat(m.surface_salle_de_prière_hommes?.toString() || '0');
      groups[commune].sallePriereHommeCount += parseFloat(m.nombre_salle_de_prière_hommes?.toString() || '0');
      groups[commune].count++;
    });

    return Object.entries(groups).map(([name, g]) => ({
      name,
      count: g.count,
      ratioLatrineHomme: g.latrineHommeCount > 0 ? (g.latrineHommeSurface / g.latrineHommeCount).toFixed(2) : '0.00',
      ratioLatrineFemme: g.latrineFemmeCount > 0 ? (g.latrineFemmeSurface / g.latrineFemmeCount).toFixed(2) : '0.00',
      ratioSallePriereFemme: g.sallePriereFemmeCount > 0 ? (g.sallePriereFemmeSurface / g.sallePriereFemmeCount).toFixed(2) : '0.00',
      ratioSallePriereHomme: g.sallePriereHommeCount > 0 ? (g.sallePriereHommeSurface / g.sallePriereHommeCount).toFixed(2) : '0.00',
    }));
  }, [mosques]);

  const filteredCommuneStats = useMemo(() => {
    let result = [...communeStats];

    // Filter by search term
    if (searchTerm) {
      result = result.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    // Filter by min ratio
    if (minRatio > 0 && sortField !== 'name' && sortField !== 'count') {
      result = result.filter(r => parseFloat(r[sortField] as string) >= minRatio);
    }

    // Sort
    result.sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      
      let comparison = 0;
      if (sortField === 'name') {
        comparison = (valA as string).localeCompare(valB as string);
      } else {
        comparison = parseFloat(valA as string) - parseFloat(valB as string);
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [communeStats, searchTerm, sortField, sortOrder]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Indicateurs de Performance</h2>
          <p className="text-zinc-500">Moyennes calculées sur l'ensemble des {mosques.length} mosquées filtrées.</p>
        </div>
        <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl text-emerald-600">
          <TrendingUp size={24} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 border-l-4 border-l-emerald-500">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600">
              <Users size={20} />
            </div>
            <h3 className="font-bold text-zinc-600 dark:text-zinc-400 text-sm uppercase tracking-wider">Ratio Latrines Homme</h3>
          </div>
          <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{stats.ratioLatrineHomme} <span className="text-sm font-normal text-zinc-500">m²/u</span></p>
          <p className="text-xs text-zinc-400 mt-2">Surface totale / Nombre total</p>
        </Card>

        <Card className="p-6 border-l-4 border-l-blue-500">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600">
              <Users size={20} />
            </div>
            <h3 className="font-bold text-zinc-600 dark:text-zinc-400 text-sm uppercase tracking-wider">Ratio Latrines Femme</h3>
          </div>
          <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{stats.ratioLatrineFemme} <span className="text-sm font-normal text-zinc-500">m²/u</span></p>
          <p className="text-xs text-zinc-400 mt-2">Surface totale / Nombre total</p>
        </Card>

        <Card className="p-6 border-l-4 border-l-amber-500">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-600">
              <Home size={20} />
            </div>
            <h3 className="font-bold text-zinc-600 dark:text-zinc-400 text-sm uppercase tracking-wider">Ratio Salle Prière Femme</h3>
          </div>
          <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{stats.ratioSallePriereFemme} <span className="text-sm font-normal text-zinc-500">m²/u</span></p>
          <p className="text-xs text-zinc-400 mt-2">Surface totale / Nombre total</p>
        </Card>

        <Card className="p-6 border-l-4 border-l-purple-500">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600">
              <Home size={20} />
            </div>
            <h3 className="font-bold text-zinc-600 dark:text-zinc-400 text-sm uppercase tracking-wider">Ratio Salle Prière Homme</h3>
          </div>
          <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{stats.ratioSallePriereHomme} <span className="text-sm font-normal text-zinc-500">m²/u</span></p>
          <p className="text-xs text-zinc-400 mt-2">Surface totale / Nombre total</p>
        </Card>
      </div>

      <Card className="overflow-hidden border-zinc-200 dark:border-zinc-800">
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <h3 className="font-bold flex items-center gap-2 whitespace-nowrap">
              <TableIcon size={18} className="text-emerald-600" />
              Détails par Commune
            </h3>
            <Badge variant="default">{filteredCommuneStats.length} Communes</Badge>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
              <input 
                type="text"
                placeholder="Rechercher une commune..."
                className="w-full pl-9 pr-4 py-1.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {sortField !== 'name' && sortField !== 'count' && (
              <div className="flex items-center gap-2">
                <label className="text-xs text-zinc-500 whitespace-nowrap">Ratio min:</label>
                <input 
                  type="number"
                  step="0.1"
                  min="0"
                  className="w-20 px-2 py-1.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  value={minRatio}
                  onChange={(e) => setMinRatio(parseFloat(e.target.value) || 0)}
                />
              </div>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-zinc-100 dark:bg-zinc-900 text-[10px] uppercase tracking-wider font-bold text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
                <th className="p-4 cursor-pointer hover:text-emerald-600 transition-colors" onClick={() => toggleSort('name')}>
                  <div className="flex items-center gap-1">
                    Commune <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="p-4 text-center cursor-pointer hover:text-emerald-600 transition-colors" onClick={() => toggleSort('count')}>
                  <div className="flex items-center justify-center gap-1">
                    Mosquées <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="p-4 text-center text-emerald-600 cursor-pointer hover:text-emerald-700 transition-colors" onClick={() => toggleSort('ratioLatrineHomme')}>
                  <div className="flex items-center justify-center gap-1">
                    Latrines (H) <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="p-4 text-center text-blue-600 cursor-pointer hover:text-blue-700 transition-colors" onClick={() => toggleSort('ratioLatrineFemme')}>
                  <div className="flex items-center justify-center gap-1">
                    Latrines (F) <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="p-4 text-center text-amber-600 cursor-pointer hover:text-amber-700 transition-colors" onClick={() => toggleSort('ratioSallePriereFemme')}>
                  <div className="flex items-center justify-center gap-1">
                    S. Prière (F) <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="p-4 text-center text-purple-600 cursor-pointer hover:text-purple-700 transition-colors" onClick={() => toggleSort('ratioSallePriereHomme')}>
                  <div className="flex items-center justify-center gap-1">
                    S. Prière (H) <ArrowUpDown size={12} />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredCommuneStats.length > 0 ? (
                filteredCommuneStats.map((c) => (
                  <tr key={c.name} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                    <td className="p-4 font-medium">{c.name}</td>
                    <td className="p-4 text-center text-zinc-500">{c.count}</td>
                    <td className="p-4 text-center font-mono font-bold text-emerald-600">{c.ratioLatrineHomme}</td>
                    <td className="p-4 text-center font-mono font-bold text-blue-600">{c.ratioLatrineFemme}</td>
                    <td className="p-4 text-center font-mono font-bold text-amber-600">{c.ratioSallePriereFemme}</td>
                    <td className="p-4 text-center font-mono font-bold text-purple-600">{c.ratioSallePriereHomme}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-500 italic">
                    Aucune commune ne correspond à votre recherche.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-8 bg-zinc-900 text-white">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-2">Analyse Comparative</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Ces indicateurs permettent d'évaluer la densité d'occupation et le confort des espaces. 
              Un ratio élevé peut indiquer des espaces généreux, tandis qu'un ratio faible peut signaler 
              un besoin d'extension ou une forte affluence par rapport à la capacité installée.
            </p>
          </div>
          <div className="flex gap-4">
            <div className="text-center">
              <p className="text-emerald-500 text-2xl font-bold">{(parseFloat(stats.ratioSallePriereHomme) / parseFloat(stats.ratioLatrineHomme) || 0).toFixed(1)}x</p>
              <p className="text-[10px] uppercase tracking-widest text-zinc-500">Facteur Espace/Service</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
