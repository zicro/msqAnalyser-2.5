import React, { useState, useMemo } from 'react';
import { Mosque, CommuneStats, NUMERIC_FIELDS, BOOLEAN_FIELDS, Threshold } from '../types';
import { validateCoordinate } from '../utils';
import { Card, Badge, Button } from './UI';
import { ChevronDown, ChevronUp, AlertTriangle, X, Download, Map as MapIcon } from 'lucide-react';

interface FilterState {
  commune: string;
  label: string;
  predicate: (m: Mosque) => boolean;
}

export const StatsTable = ({ 
  stats, 
  mosques, 
  onShowOnMap,
  thresholds,
  setThresholds
}: { 
  stats: CommuneStats[]; 
  mosques: Mosque[];
  onShowOnMap?: (m: Mosque) => void;
  thresholds: Record<string, Threshold>;
  setThresholds: React.Dispatch<React.SetStateAction<Record<string, Threshold>>>;
}) => {
  const [expandedCommune, setExpandedCommune] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterState | null>(null);

  const toggleExpand = (commune: string) => {
    setExpandedCommune(expandedCommune === commune ? null : commune);
  };

  const handleThresholdChange = (field: string, value: number) => {
    setThresholds(prev => ({
      ...prev,
      [field]: { ...prev[field], value }
    }));
  };

  const filteredMosques = useMemo(() => {
    if (!activeFilter) return [];
    return mosques.filter(m => m.commune === activeFilter.commune && activeFilter.predicate(m));
  }, [activeFilter, mosques]);

  const handleDownloadCSV = () => {
    if (!activeFilter || filteredMosques.length === 0) return;

    const headers = Object.keys(filteredMosques[0]).join(',');
    const rows = filteredMosques.map(m => 
      Object.values(m).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')
    );
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `mosques_${activeFilter.commune}_${activeFilter.label.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full overflow-hidden">
      <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 shadow-sm transition-all">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 uppercase text-xs font-bold">
            <tr>
              <th rowSpan={2} className="p-4 sticky left-0 bg-zinc-50 dark:bg-zinc-800 z-10 border-r border-zinc-200 dark:border-zinc-700 min-w-[200px]">Commune</th>
              <th rowSpan={2} className="p-4 border-r border-zinc-200 dark:border-zinc-700">Total</th>
              
              {NUMERIC_FIELDS.map(f => (
                <th key={f} colSpan={3} className="p-2 text-center border-r border-zinc-200 dark:border-zinc-700">
                  {f.replace(/_/g, ' ')}
                </th>
              ))}

              {BOOLEAN_FIELDS.map(f => (
                <th key={f} colSpan={3} className="p-2 text-center border-r border-zinc-200 dark:border-zinc-700">
                  {f.replace(/_/g, ' ')}
                </th>
              ))}

              <th colSpan={4} className="p-2 text-center">Coordonnées</th>
            </tr>
            <tr className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700">
              {NUMERIC_FIELDS.map(f => (
                <React.Fragment key={`${f}-subs`}>
                  <th className="p-2 text-[10px] border-r border-zinc-200 dark:border-zinc-700">Total</th>
                  <th className="p-2 text-[10px] border-r border-zinc-200 dark:border-zinc-700">Null</th>
                  <th className="p-2 text-[10px] border-r border-zinc-200 dark:border-zinc-700 bg-amber-50 dark:bg-amber-900/10">
                    <div className="flex items-center justify-center gap-1">
                      <span>{thresholds[f]?.operator || ">"}</span>
                      <input 
                        type="number" 
                        value={thresholds[f]?.value ?? 1000}
                        onChange={(e) => handleThresholdChange(f, parseInt(e.target.value) || 0)}
                        className="w-12 p-0.5 bg-white dark:bg-zinc-800 border border-amber-200 dark:border-amber-800 rounded text-center text-amber-700 font-bold focus:ring-1 focus:ring-amber-500 outline-none"
                      />
                    </div>
                  </th>
                </React.Fragment>
              ))}
              {BOOLEAN_FIELDS.map(f => (
                <React.Fragment key={`${f}-subs`}>
                  <th className="p-2 text-[10px] border-r border-zinc-200 dark:border-zinc-700">Y</th>
                  <th className="p-2 text-[10px] border-r border-zinc-200 dark:border-zinc-700">N</th>
                  <th className="p-2 text-[10px] border-r border-zinc-200 dark:border-zinc-700">Null</th>
                </React.Fragment>
              ))}
              <th className="p-2 text-[10px] border-r border-zinc-200 dark:border-zinc-700">Valide</th>
              <th className="p-2 text-[10px] border-r border-zinc-200 dark:border-zinc-700">Suspect</th>
              <th className="p-2 text-[10px] border-r border-zinc-200 dark:border-zinc-700">Hors Prov.</th>
              <th className="p-2 text-[10px]">Null</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {stats.map(row => (
              <React.Fragment key={row.commune}>
                <tr 
                  className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors"
                  onClick={() => toggleExpand(row.commune)}
                >
                  <td className="p-4 sticky left-0 bg-white dark:bg-zinc-900 z-10 border-r border-zinc-200 dark:border-zinc-700 font-medium flex items-center justify-between">
                    {row.commune}
                    {expandedCommune === row.commune ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </td>
                  <td 
                    className="p-4 border-r border-zinc-200 dark:border-zinc-700 text-center hover:bg-emerald-50 dark:hover:bg-emerald-900/20 cursor-pointer font-bold"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveFilter({
                        commune: row.commune,
                        label: "Total",
                        predicate: () => true
                      });
                    }}
                  >
                    {row.count}
                  </td>
                  
                  {NUMERIC_FIELDS.map(f => (
                    <React.Fragment key={`${row.commune}-${f}`}>
                      <td 
                        className="p-2 text-center border-r border-zinc-200 dark:border-zinc-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveFilter({
                            commune: row.commune,
                            label: `${f} (Total)`,
                            predicate: (m) => m[f as keyof Mosque] !== null && m[f as keyof Mosque] !== undefined && m[f as keyof Mosque] !== ""
                          });
                        }}
                      >
                        {row.numericFields[f].total}
                      </td>
                      <td 
                        className="p-2 text-center border-r border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveFilter({
                            commune: row.commune,
                            label: `${f} (Manquant)`,
                            predicate: (m) => m[f as keyof Mosque] === null || m[f as keyof Mosque] === undefined || m[f as keyof Mosque] === ""
                          });
                        }}
                      >
                        {row.numericFields[f].nullMissing}
                      </td>
                      <td 
                        className="p-2 text-center border-r border-zinc-200 dark:border-zinc-700 text-amber-600 font-bold hover:bg-emerald-50 dark:hover:bg-emerald-900/20 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          const threshold = thresholds[f] || { value: 1000, operator: '>' };
                          setActiveFilter({
                            commune: row.commune,
                            label: `${f} (${threshold.operator}${threshold.value})`,
                            predicate: (m) => {
                              const num = Number(m[f as keyof Mosque]);
                              return threshold.operator === '>' 
                                ? num > threshold.value 
                                : num < threshold.value;
                            }
                          });
                        }}
                      >
                        {row.numericFields[f].flaggedCount}
                      </td>
                    </React.Fragment>
                  ))}

                  {BOOLEAN_FIELDS.map(f => (
                    <React.Fragment key={`${row.commune}-${f}`}>
                      <td 
                        className="p-2 text-center border-r border-zinc-200 dark:border-zinc-700 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveFilter({
                            commune: row.commune,
                            label: `${f} (OUI)`,
                            predicate: (m) => {
                              const val = m[f as keyof Mosque];
                              const strVal = String(val).toLowerCase();
                              return strVal === "y" || strVal === "o" || strVal === "oui" || val === true || val === 1 || val === "1";
                            }
                          });
                        }}
                      >
                        {row.booleanFields[f].totalY}
                      </td>
                      <td 
                        className="p-2 text-center border-r border-zinc-200 dark:border-zinc-700 text-red-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveFilter({
                            commune: row.commune,
                            label: `${f} (NON)`,
                            predicate: (m) => {
                              const val = m[f as keyof Mosque];
                              const strVal = String(val).toLowerCase();
                              return strVal === "n" || strVal === "non" || val === false || val === 0 || val === "0";
                            }
                          });
                        }}
                      >
                        {row.booleanFields[f].totalN}
                      </td>
                      <td 
                        className="p-2 text-center border-r border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveFilter({
                            commune: row.commune,
                            label: `${f} (Manquant)`,
                            predicate: (m) => {
                              const val = m[f as keyof Mosque];
                              const strVal = String(val).toLowerCase();
                              const isY = strVal === "y" || strVal === "o" || strVal === "oui" || val === true || val === 1 || val === "1";
                              const isN = strVal === "n" || strVal === "non" || val === false || val === 0 || val === "0";
                              return val === null || val === undefined || val === "" || (!isY && !isN);
                            }
                          });
                        }}
                      >
                        {row.booleanFields[f].nullMissing}
                      </td>
                    </React.Fragment>
                  ))}

                  <td 
                    className="p-2 text-center border-r border-zinc-200 dark:border-zinc-700 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveFilter({
                        commune: row.commune,
                        label: "Coordonnées Valides",
                        predicate: (m) => {
                          const lonRes = validateCoordinate(m.longitude, "lon");
                          const latRes = validateCoordinate(m.latitude, "lat");
                          return lonRes.isValid && latRes.isValid && !lonRes.isSuspicious && !latRes.isSuspicious;
                        }
                      });
                    }}
                  >
                    {row.coordinates.valid}
                  </td>
                  <td 
                    className="p-2 text-center border-r border-zinc-200 dark:border-zinc-700 text-amber-600 font-bold hover:bg-emerald-50 dark:hover:bg-emerald-900/20 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveFilter({
                        commune: row.commune,
                        label: "Coordonnées Suspectes",
                        predicate: (m) => {
                          const lonRes = validateCoordinate(m.longitude, "lon");
                          const latRes = validateCoordinate(m.latitude, "lat");
                          return (lonRes.isSuspicious || latRes.isSuspicious) && lonRes.isValid && latRes.isValid && lonRes.reason !== "Hors limites Maroc" && latRes.reason !== "Hors limites Maroc";
                        }
                      });
                    }}
                  >
                    {row.coordinates.invalid}
                  </td>
                  <td 
                    className="p-2 text-center border-r border-zinc-200 dark:border-zinc-700 text-purple-600 font-bold hover:bg-emerald-50 dark:hover:bg-emerald-900/20 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      
                      // Re-calculate centroids for filter logic
                      const provinceCentroids: Record<string, { sumLon: number; sumLat: number; count: number }> = {};
                      mosques.forEach(m => {
                        const province = m.province || "Inconnu";
                        const lonRes = validateCoordinate(m.longitude, "lon");
                        const latRes = validateCoordinate(m.latitude, "lat");
                        if (lonRes.isValid && !lonRes.isSuspicious && latRes.isValid && !latRes.isSuspicious) {
                          if (!provinceCentroids[province]) provinceCentroids[province] = { sumLon: 0, sumLat: 0, count: 0 };
                          provinceCentroids[province].sumLon += Number(m.longitude);
                          provinceCentroids[province].sumLat += Number(m.latitude);
                          provinceCentroids[province].count++;
                        }
                      });
                      const centroids = Object.entries(provinceCentroids).reduce((acc, [name, s]) => {
                        acc[name] = { avgLon: s.sumLon / s.count, avgLat: s.sumLat / s.count };
                        return acc;
                      }, {} as Record<string, { avgLon: number; avgLat: number }>);

                      setActiveFilter({
                        commune: row.commune,
                        label: "Hors Province",
                        predicate: (m) => {
                          const province = m.province || "Inconnu";
                          const centroid = centroids[province];
                          if (!centroid) return false;
                          const lonRes = validateCoordinate(m.longitude, "lon");
                          const latRes = validateCoordinate(m.latitude, "lat");
                          if (!lonRes.isValid || !latRes.isValid || lonRes.isSuspicious || latRes.isSuspicious) return false;
                          const lon = Number(m.longitude);
                          const lat = Number(m.latitude);
                          const dist = Math.sqrt(Math.pow(lon - centroid.avgLon, 2) + Math.pow(lat - centroid.avgLat, 2));
                          return dist > 1.5;
                        }
                      });
                    }}
                  >
                    {row.coordinates.outsideProvince}
                  </td>
                  <td 
                    className="p-2 text-center text-zinc-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveFilter({
                        commune: row.commune,
                        label: "Coordonnées Manquantes",
                        predicate: (m) => !m.longitude || !m.latitude
                      });
                    }}
                  >
                    {row.coordinates.null}
                  </td>
                </tr>
                {expandedCommune === row.commune && (
                  <tr>
                    <td colSpan={2 + NUMERIC_FIELDS.length * 3 + BOOLEAN_FIELDS.length * 3 + 3} className="p-6 bg-zinc-50 dark:bg-zinc-800/30">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {mosques.filter(m => m.commune === row.commune).map(m => {
                          const lonRes = validateCoordinate(m.longitude, "lon");
                          const latRes = validateCoordinate(m.latitude, "lat");
                          const isInvalid = lonRes.isSuspicious || latRes.isSuspicious || !lonRes.isValid || !latRes.isValid;

                          return (
                            <div key={m.code}>
                              <Card className="p-4 bg-white dark:bg-zinc-900">
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-bold text-emerald-600">{m.dénomination_en_français || "Sans nom"}</h4>
                                  <Badge>{m.type_de_mosquée}</Badge>
                                </div>
                                <p className="text-xs text-zinc-500 mb-1">Code: {m.code}</p>
                                <p className="text-xs mb-1" dir="rtl">{m.adresse_en_arabe}</p>
                                <div className="flex gap-2 mt-2">
                                  <Badge variant="default">État: {m.etat_batiment}</Badge>
                                  <Badge variant="default">{m.date_construction?.split(' ')[0]}</Badge>
                                </div>
                                <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[10px]">
                                  <span className={isInvalid ? "text-amber-600 font-bold flex items-center gap-1" : "text-zinc-400"}>
                                    {isInvalid && <AlertTriangle size={10} />}
                                    {m.longitude}, {m.latitude}
                                    {isInvalid && " ⚠️ May be Wrong"}
                                  </span>
                                  {onShowOnMap && (
                                    <Button 
                                      variant="ghost" 
                                      className="h-6 px-2 text-[10px] text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                      onClick={() => onShowOnMap(m)}
                                    >
                                      <MapIcon size={12} className="mr-1" /> Voir sur carte
                                    </Button>
                                  )}
                                </div>
                              </Card>
                            </div>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal for filtered data */}
      {activeFilter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <Card className="w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900">
              <div>
                <h3 className="text-xl font-bold text-emerald-600">{activeFilter.commune}</h3>
                <p className="text-sm text-zinc-500">Filtre: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{activeFilter.label}</span> ({filteredMosques.length} résultats)</p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={handleDownloadCSV} className="flex items-center gap-2">
                  <Download size={18} /> Télécharger CSV
                </Button>
                <Button variant="secondary" onClick={() => setActiveFilter(null)} className="p-2">
                  <X size={20} />
                </Button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-zinc-50/50 dark:bg-zinc-950/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMosques.map(m => {
                  const lonRes = validateCoordinate(m.longitude, "lon");
                  const latRes = validateCoordinate(m.latitude, "lat");
                  const isInvalid = lonRes.isSuspicious || latRes.isSuspicious || !lonRes.isValid || !latRes.isValid;

                  return (
                    <div key={m.code}>
                      <Card className="p-4 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-emerald-600 line-clamp-1">{m.dénomination_en_français || "Sans nom"}</h4>
                          <Badge>{m.type_de_mosquée}</Badge>
                        </div>
                        <p className="text-xs text-zinc-500 mb-1">Code: {m.code}</p>
                        <p className="text-xs mb-1 line-clamp-1" dir="rtl">{m.adresse_en_arabe}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="default">État: {m.etat_batiment}</Badge>
                          <Badge variant="default">{m.date_construction?.split(' ')[0]}</Badge>
                        </div>
                        <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[10px]">
                          <span className={isInvalid ? "text-amber-600 font-bold flex items-center gap-1" : "text-zinc-400"}>
                            {isInvalid && <AlertTriangle size={10} />}
                            {m.longitude}, {m.latitude}
                          </span>
                          {onShowOnMap && (
                            <Button 
                              variant="ghost" 
                              className="h-6 px-2 text-[10px] text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              onClick={() => {
                                onShowOnMap(m);
                                setActiveFilter(null);
                              }}
                            >
                              <MapIcon size={12} className="mr-1" /> Voir sur carte
                            </Button>
                          )}
                        </div>
                      </Card>
                    </div>
                  );
                })}
              </div>
              {filteredMosques.length === 0 && (
                <div className="text-center py-20 text-zinc-400">
                  Aucun résultat trouvé pour ce filtre.
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
