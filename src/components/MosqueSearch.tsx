import React, { useState, useMemo } from 'react';
import { Mosque } from '../types';
import { Card, Button, cn } from './UI';
import { Search, FileText, Download, Printer } from 'lucide-react';
import * as XLSX from 'xlsx';

interface MosqueSearchProps {
  mosques: Mosque[];
}

export const MosqueSearch: React.FC<MosqueSearchProps> = ({ mosques }) => {
  const [searchCode, setSearchCode] = useState('');
  const [foundMosque, setFoundMosque] = useState<Mosque | null>(null);
  const [comparisonData, setComparisonData] = useState<Record<string, { est: string; real: string }>>({});

  const printRef = React.useRef<HTMLDivElement>(null);

  const handleSearch = () => {
    const mosque = mosques.find(m => m.code?.toString() === searchCode);
    setFoundMosque(mosque || null);
    setComparisonData({});
  };

  const handleInputChange = (field: string, type: 'est' | 'real', value: string) => {
    setComparisonData(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        [type]: value
      }
    }));
  };

  const fields = useMemo(() => {
    if (mosques.length === 0) return [];
    const allKeys = new Set<string>();
    mosques.forEach(m => {
      Object.keys(m).forEach(key => {
        if (key !== 'code' && typeof m[key] !== 'object') {
          allKeys.add(key);
        }
      });
    });
    
    const priority = ['dénomination_en_arabe', 'dénomination_en_français', 'region', 'province', 'commune', 'type_de_mosquée', 'status'];
    const sortedKeys = Array.from(allKeys).sort((a, b) => {
      const indexA = priority.indexOf(a);
      const indexB = priority.indexOf(b);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.localeCompare(b);
    });

    return ['code', ...sortedKeys];
  }, [mosques]);

  const exportToXLSX = () => {
    if (!foundMosque) return;
    const data = fields.map(field => ({
      Field: field,
      RNM: foundMosque[field]?.toString() || '',
      'الاستمارة': comparisonData[field]?.est || '',
      'المعطيات بالواقع': comparisonData[field]?.real || ''
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Fiche Mosquée");
    XLSX.writeFile(wb, `Fiche_Mosquee_${foundMosque.code}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 no-print">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium text-zinc-500">Code Mosquée</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input
                type="text"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Entrez le code de la mosquée..."
                className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSearch} className="h-10 px-8">
              Rechercher
            </Button>
            {foundMosque && (
              <>
                <Button variant="secondary" onClick={exportToXLSX} className="h-10">
                  <Download size={18} /> XLSX
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>

      {foundMosque ? (
        <div 
          className="print-container text-black cursor-pointer hover:bg-zinc-50/50 transition-colors" 
          ref={printRef}
          onClick={handlePrint}
          title="Cliquez pour imprimer"
        >
          <div className="mb-8 border-b-2 border-emerald-600 pb-4">
            <h1 className="text-2xl font-bold text-emerald-800">Fiche de Recensement Mosquée</h1>
            <div className="flex justify-between mt-2 text-sm text-zinc-600">
              <p>Code: <span className="font-mono font-bold">{foundMosque.code}</span></p>
              <p>Date: {new Date().toLocaleDateString()}</p>
            </div>
          </div>
          
          <Card className="overflow-x-auto border-none shadow-none md:border md:shadow-sm bg-white">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-100 border-b border-zinc-200">
                  <th className="px-4 py-3 font-bold text-sm uppercase tracking-wider">Champ</th>
                  <th className="px-4 py-3 font-bold text-sm uppercase tracking-wider">RNM</th>
                  <th className="px-4 py-3 font-bold text-sm uppercase tracking-wider text-right font-tahoma">الاستمارة</th>
                  <th className="px-4 py-3 font-bold text-sm uppercase tracking-wider text-right font-tahoma">المعطيات بالواقع</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {fields.map((field) => (
                  <tr key={field} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-4 py-2 text-sm font-medium text-zinc-600">
                      {field}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      <div className="min-h-[2.5rem] flex items-center px-3 py-1 bg-zinc-50 border border-zinc-200 rounded">
                        {foundMosque[field]?.toString() || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-right font-tahoma">
                      <div className="min-h-[2rem] px-3 py-1">
                        {comparisonData[field]?.est || ''}
                      </div>
                      <input 
                        type="text" 
                        value={comparisonData[field]?.est || ''}
                        onChange={(e) => handleInputChange(field, 'est', e.target.value)}
                        className="w-full px-3 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded focus:ring-1 focus:ring-emerald-500 outline-none no-print"
                      />
                    </td>
                    <td className="px-4 py-2 text-right font-tahoma">
                      <div className="min-h-[2rem] px-3 py-1">
                        {comparisonData[field]?.real || ''}
                      </div>
                      <input 
                        type="text" 
                        value={comparisonData[field]?.real || ''}
                        onChange={(e) => handleInputChange(field, 'real', e.target.value)}
                        className="w-full px-3 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded focus:ring-1 focus:ring-emerald-500 outline-none no-print"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          
          <div className="mt-12 pt-8 border-t border-zinc-200 text-center text-xs text-zinc-400">
            Document généré par le Système de Statistique des Mosquées
          </div>
        </div>
      ) : searchCode && (
        <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
          <FileText size={48} className="mb-4 opacity-20" />
          <p>Aucune mosquée trouvée avec le code "{searchCode}"</p>
        </div>
      )}
    </div>
  );
};
