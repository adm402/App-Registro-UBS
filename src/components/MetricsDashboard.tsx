/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { 
  BarChart3, ListFilter, Search, Download, Trash2, Calendar, 
  MapPin, Printer, Users, Eye, Building2, UserCheck, UserX, Clock, ClipboardList
} from 'lucide-react';
import { AttendanceLog } from '../types';
import { ubsList } from '../data/ubsList';

interface MetricsDashboardProps {
  logs: AttendanceLog[];
  onDeleteLog: (id: string) => void;
  onClearLogs: () => void;
}

export default function MetricsDashboard({ logs, onDeleteLog, onClearLogs }: MetricsDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUbsId, setFilterUbsId] = useState('all');
  const [selectedLogForModal, setSelectedLogForModal] = useState<AttendanceLog | null>(null);

  // Filter logs based on search and UBS filter
  const filteredLogs = logs.filter((log) => {
    const matchesUbs = filterUbsId === 'all' || log.ubsId === filterUbsId;
    const matchesSearch = 
      log.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.ubsName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.ubsCnpj.includes(searchQuery) ||
      (log.timestamp && new Date(log.timestamp).toLocaleDateString('pt-BR').includes(searchQuery));
    return matchesUbs && matchesSearch;
  });

  // Global calculations
  const totalConsultations = logs.reduce((acc, curr) => acc + curr.consultationsPerformed, 0);
  const totalUnattended = logs.reduce((acc, curr) => acc + curr.unattendedPatients, 0);
  const totalAttempted = totalConsultations + totalUnattended;
  const attendanceRate = totalAttempted > 0 ? Math.round((totalConsultations / totalAttempted) * 100) : 100;

  // Demographics aggregates
  const demographicsAggregate = logs.reduce(
    (acc, curr) => {
      acc.pregnant += curr.demographics.pregnant;
      acc.children += curr.demographics.children;
      acc.elderly += curr.demographics.elderly;
      acc.bedridden += curr.demographics.bedridden;
      acc.reducedMobility += curr.demographics.reducedMobility;
      acc.pwd += curr.demographics.pwd;
      return acc;
    },
    { pregnant: 0, children: 0, elderly: 0, bedridden: 0, reducedMobility: 0, pwd: 0 }
  );

  const totalDemographicsCount = Object.values(demographicsAggregate).reduce((a, b) => a + b, 0);

  // Data Export utils
  const exportToJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `UBS_Dentist_Metrics_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    // Header
    csvContent += "ID,Data/Hora,Unidade,CNPJ,Atendimentos,Nao Assistidos,Gestantes,Criancas,Idosos,Acamados,Mobilidade Reduzida,PCD,Entrada Hora,Saida Hora\n";
    
    logs.forEach((log) => {
      const row = [
        `="${log.id}"`, // format string for spreadsheet safely
        `"${new Date(log.timestamp).toLocaleString('pt-BR')}"`,
        `"${log.ubsName}"`,
        `"${log.ubsCnpj}"`,
        log.consultationsPerformed,
        log.unattendedPatients,
        log.demographics.pregnant,
        log.demographics.children,
        log.demographics.elderly,
        log.demographics.bedridden,
        log.demographics.reducedMobility,
        log.demographics.pwd,
        `"${log.photos.entryTime || ''}"`,
        `"${log.photos.exitTime || ''}"`
      ].join(",");
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", encodedUri);
    downloadAnchor.setAttribute("download", `UBS_Dentist_Metrics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Generate printing trigger
  const printDashboard = () => {
    window.print();
  };

  // Demographics Category Visual configs
  const categoryConfig = [
    { key: 'pregnant', label: 'Gestantes', value: demographicsAggregate.pregnant, color: 'bg-pink-500', fill: '#ec4899' },
    { key: 'children', label: 'Crianças', value: demographicsAggregate.children, color: 'bg-cyan-500', fill: '#06b6d4' },
    { key: 'elderly', label: 'Idosos', value: demographicsAggregate.elderly, color: 'bg-amber-500', fill: '#f59e0b' },
    { key: 'bedridden', label: 'Acamados', value: demographicsAggregate.bedridden, color: 'bg-indigo-500', fill: '#6366f1' },
    { key: 'reducedMobility', label: 'Mob. Reduzida', value: demographicsAggregate.reducedMobility, color: 'bg-orange-500', fill: '#f97316' },
    { key: 'pwd', label: 'PCD / PwD', value: demographicsAggregate.pwd, color: 'bg-emerald-500', fill: '#10b981' },
  ];

  // Dynamic maximum value for SVG bar scaling
  const maxDemographicValue = Math.max(...categoryConfig.map(c => c.value), 1);

  return (
    <div className="space-y-8" id="dashboard-tab-content">
      {/* KPI Global stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Atendimentos Realizados */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-teal-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between mb-4">
            <span className="p-2.5 bg-teal-500/10 text-teal-400 rounded-2xl border border-teal-500/15">
              <UserCheck className="w-5 h-5" />
            </span>
            <span className="text-emerald-500 text-xs font-mono font-bold bg-emerald-500/10 px-2.5 py-1 rounded">
              Sucesso
            </span>
          </div>
          <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500 block">
            Atendimentos Realizados
          </span>
          <span className="text-3xl font-black font-mono tracking-tight text-white block mt-1">
            {totalConsultations}
          </span>
          <p className="text-slate-400 text-xs mt-2">Consultas odontológicas fechadas</p>
        </div>

        {/* Não Assistidos */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between mb-4">
            <span className="p-2.5 bg-rose-500/10 text-rose-400 rounded-2xl border border-rose-500/15">
              <UserX className="w-5 h-5" />
            </span>
            <span className="text-rose-400 text-xs font-mono font-bold bg-rose-500/10 px-2.5 py-1 rounded">
              Ausências
            </span>
          </div>
          <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500 block">
            Pacientes Não Assistidos
          </span>
          <span className="text-3xl font-black font-mono tracking-tight text-white block mt-1">
            {totalUnattended}
          </span>
          <p className="text-slate-400 text-xs mt-2">Faltas, dispensas ou retornos</p>
        </div>

        {/* Taxa de Atendimento */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-sky-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between mb-4">
            <span className="p-2.5 bg-sky-500/10 text-sky-400 rounded-2xl border border-sky-500/15">
              <BarChart3 className="w-5 h-5" />
            </span>
            <span className="text-sky-300 text-xs font-mono font-bold bg-sky-500/10 px-2.5 py-1 rounded">
              Eficiência
            </span>
          </div>
          <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500 block">
            Taxa de Aproveitamento
          </span>
          <span className="text-3xl font-black font-mono tracking-tight text-sky-300 block mt-1">
            {attendanceRate}%
          </span>
          <p className="text-slate-400 text-xs mt-2">Percentual de resolutividade SUS</p>
        </div>

        {/* Total Grupos Especiais */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between mb-4">
            <span className="p-2.5 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/15">
              <Users className="w-5 h-5" />
            </span>
            <span className="text-amber-300 text-xs font-mono font-bold bg-amber-500/10 px-2.5 py-1 rounded">
              Triagem
            </span>
          </div>
          <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500 block">
            Grupos Vulneráveis / Especiais
          </span>
          <span className="text-3xl font-black font-mono tracking-tight text-white block mt-1">
            {totalDemographicsCount}
          </span>
          <p className="text-slate-400 text-xs mt-2">Pacientes em categorias de prioridade</p>
        </div>
      </div>

      {/* SVG Demographic Distribution Visualizer */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <span className="text-xs uppercase font-mono font-bold text-teal-400 tracking-wider">Demografia Consolidada</span>
            <h3 className="text-lg font-bold text-white mt-1">Distribuição de Pacientes por Categoria</h3>
          </div>
          <span className="px-3 py-1.5 bg-slate-950 text-slate-400 border border-slate-800 text-xs font-mono rounded-xl">
            Medianeira • Paraná • Brasil
          </span>
        </div>

        {logs.length === 0 ? (
          <div className="text-center py-12 text-slate-500 border border-dashed border-slate-800 rounded-2xl">
            <BarChart3 className="w-10 h-10 mx-auto mb-2 text-slate-600" />
            <p className="text-sm">Nenhum registro submetido para exibir estatísticas demográficas.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Custom SVG Responsive Row chart */}
            <div className="lg:col-span-7 space-y-4">
              {categoryConfig.map((cat) => {
                const percentage = totalDemographicsCount > 0 ? Math.round((cat.value / totalDemographicsCount) * 100) : 0;
                const progressWidth = `${(cat.value / maxDemographicValue) * 100}%`;
                return (
                  <div key={cat.key} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-slate-200 block font-semibold">{cat.label}</span>
                      <div className="flex items-center gap-1.5 font-mono">
                        <span className="text-white font-bold">{cat.value}</span>
                        <span className="text-slate-500 text-[10px]">({percentage}%)</span>
                      </div>
                    </div>
                    <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800/80">
                      <div 
                        className={`h-full ${cat.color} rounded-full transition-all duration-500`} 
                        style={{ width: progressWidth }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Circular representation in SVG drawing box */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 bg-slate-950/40 rounded-2xl border border-slate-800/80">
              <svg viewBox="0 0 200 200" className="w-40 h-40">
                <circle cx="100" cy="100" r="85" fill="none" stroke="#1e293b" strokeWidth="15" />
                {/* Visualizing dynamic ring segments */}
                <circle 
                  cx="100" 
                  cy="100" 
                  r="85" 
                  fill="none" 
                  stroke="#2dd4bf" 
                  strokeWidth="15" 
                  strokeDasharray={`${(totalConsultations / (totalAttempted || 1)) * 534} 534`} 
                  strokeDashoffset="133"
                  strokeLinecap="round"
                  className="transition-all duration-700" 
                />
                <text x="100" y="98" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="bold" fontFamily="sans-serif">ATENDIMENTO</text>
                <text x="100" y="122" textAnchor="middle" fill="#ffffff" fontSize="22" fontWeight="black" fontFamily="monospace">{attendanceRate}%</text>
              </svg>
              <div className="flex justify-center gap-4 mt-4 w-full text-[11px] font-mono">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded bg-teal-400 block" />
                  <span>Realizados</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded bg-slate-700 block" />
                  <span>Não Assistidos</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter and listings header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-6 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ClipboardList className="text-teal-400 w-5 h-5" />
              Histórico de Lançamentos Diários
            </h3>
            <p className="text-xs text-slate-400 mt-1">Filtre, pesquise e faça download dos comprovantes ou base de exportação.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={exportToCSV}
              disabled={logs.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 disabled:cursor-not-allowed text-stone-200 border border-slate-700/60 rounded-xl text-xs font-semibold cursor-pointer transition duration-200"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar CSV (.csv)
            </button>
            <button
              onClick={exportToJSON}
              disabled={logs.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 disabled:cursor-not-allowed text-stone-200 border border-slate-700/60 rounded-xl text-xs font-semibold cursor-pointer transition duration-200"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar JSON (.json)
            </button>
            <button
              onClick={printDashboard}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-stone-200 border border-slate-700/60 rounded-xl text-xs font-semibold cursor-pointer transition duration-200"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir Geral
            </button>
            <button
              onClick={onClearLogs}
              disabled={logs.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-500/15 rounded-xl text-xs font-semibold cursor-pointer transition duration-200"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Limpar Banco
            </button>
          </div>
        </div>

        {/* Searching and Filter selectors */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 my-5">
          <div className="md:col-span-7 relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Pesquisar por ID, UBS, CNPJ ou data (ex: 24/05/2026)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-350 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="md:col-span-5 flex items-center gap-3">
            <span className="text-slate-400 text-xs shrink-0 flex items-center gap-1 font-semibold">
              <ListFilter className="w-3.5 h-3.5 text-teal-400" />
              Filtrar UBS:
            </span>
            <select
              value={filterUbsId}
              onChange={(e) => setFilterUbsId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-855 text-xs text-slate-300 rounded-xl px-3 py-2.5 focus:outline-none cursor-pointer"
            >
              <option value="all">Filtro: Todas as UBS de Medianeira</option>
              {ubsList.map((ubs) => (
                <option key={ubs.id} value={ubs.id}>{ubs.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* List of Entries */}
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12 text-slate-500 border border-dashed border-slate-800 rounded-2xl bg-slate-950/20">
            <ClipboardList className="w-12 h-12 mx-auto mb-2 text-slate-700" />
            <p className="text-sm font-semibold text-slate-400">Nenhum diário clínico localizado.</p>
            <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
              {logs.length === 0 
                ? 'Preencha o formulário acima, tire as fotos de entrada/saída e submeta para iniciar seu banco de lançamentos local!' 
                : 'Experimente alterar os filtros de busca para encontrar outros lançamentos odontológicos.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-850">
            <table className="w-full text-left text-xs border-collapse divide-y divide-slate-850 text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-mono text-[10px]">
                <tr>
                  <th className="px-4 py-3">Código ID</th>
                  <th className="px-4 py-3">Data Base</th>
                  <th className="px-4 py-3">Unidade de Saúde (UBS)</th>
                  <th className="px-4 py-3 text-center">Consultas / Ausências</th>
                  <th className="px-4 py-3 text-center">Gestantes / Crianças / Idosos</th>
                  <th className="px-4 py-3">Ponto Comprovado</th>
                  <th className="px-4 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 bg-slate-900/40">
                {filteredLogs.map((log) => {
                  const logDate = new Date(log.timestamp).toLocaleDateString('pt-BR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  });
                  return (
                    <tr key={log.id} className="hover:bg-slate-900 transition duration-150">
                      {/* Unique ID */}
                      <td className="px-4 py-3.5 font-mono font-bold text-teal-400 whitespace-nowrap">
                        #{log.id}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5 whitespace-nowrap font-medium text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>{logDate}</span>
                        </div>
                      </td>

                      {/* UBS Selection with CNPJ */}
                      <td className="px-4 py-3.5 max-w-xs">
                        <div className="font-semibold text-white tracking-tight leading-snug truncate">
                          {log.ubsName}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5 whitespace-nowrap">
                          {log.ubsCnpj}
                        </div>
                      </td>

                      {/* Success / Fails Metrics */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap font-mono">
                        <div className="flex items-center justify-center gap-3">
                          <span className="text-teal-400 font-bold bg-teal-500/10 px-2 py-0.5 rounded text-[11px]" title="Atendimentos realizados">
                            {log.consultationsPerformed} realizados
                          </span>
                          <span className="text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded text-[11px]" title="Pacientes não assistidos">
                            {log.unattendedPatients} ausentes
                          </span>
                        </div>
                      </td>

                      {/* Demographics count inline */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5 text-[11px]">
                          <span className="bg-pink-500/10 text-pink-400 font-bold px-1.5 py-0.5 rounded" title="Gestantes">
                            G:{log.demographics.pregnant}
                          </span>
                          <span className="bg-cyan-500/10 text-cyan-400 font-bold px-1.5 py-0.5 rounded" title="Crianças">
                            C:{log.demographics.children}
                          </span>
                          <span className="bg-amber-500/10 text-amber-400 font-bold px-1.5 py-0.5 rounded" title="Idosos">
                            I:{log.demographics.elderly}
                          </span>
                          <span className="bg-indigo-500/10 text-indigo-400 font-bold px-1.5 py-0.5 rounded" title="Acamados/PCD">
                            A:{log.demographics.bedridden} / P:{log.demographics.pwd}
                          </span>
                        </div>
                      </td>

                      {/* Clock in / out photos validation highlights */}
                      <td className="px-4 py-3.5 text-slate-400 text-xs font-mono whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1 text-[10px]">
                            <span className={`w-1.5 h-1.5 rounded-full ${log.photos.entryPhoto ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            <span className="text-slate-500">In:</span> 
                            <span className="text-slate-300 font-bold">{log.photos.entryTime ? log.photos.entryTime.split(' ')[1] : 'sem registro'}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px]">
                            <span className={`w-1.5 h-1.5 rounded-full ${log.photos.exitPhoto ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            <span className="text-slate-500">Out:</span> 
                            <span className="text-slate-300 font-bold">{log.photos.exitTime ? log.photos.exitTime.split(' ')[1] : 'sem registro'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedLogForModal(log)}
                            className="p-1.5 bg-slate-950 text-sky-400 border border-slate-800 hover:border-sky-500/30 rounded-lg cursor-pointer transition duration-150"
                            title="Visualizar Comprovante do Ponto"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Excluir comprovante clínico #${log.id} permanentemente?`)) {
                                onDeleteLog(log.id);
                              }
                            }}
                            className="p-1.5 bg-slate-950 text-rose-550 border border-slate-800 hover:border-rose-500/30 rounded-lg cursor-pointer transition duration-150"
                            title="Excluir Lançamento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal detail view for digital certificate */}
      {selectedLogForModal && (
        <div id="log-detail-modal" className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 relative shadow-2xl my-8">
            <button
              onClick={() => setSelectedLogForModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-950 border border-slate-850 rounded-full w-9 h-9 flex items-center justify-center cursor-pointer transition"
              title="Fechar"
            >
              &times;
            </button>

            {/* Print Area of the Digital certificate */}
            <div id="print-certificate-area" className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                  <div className="flex items-center gap-1.5 text-teal-400 text-xs font-mono font-bold uppercase tracking-wider">
                    <Building2 className="w-4 h-4" />
                    Ministério da Saúde • Dental SUS
                  </div>
                  <h3 className="text-xl font-black text-white tracking-tight mt-1">Comprovante de Atendimento UBS</h3>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">ID Identificador Registro</span>
                  <span className="text-md font-mono font-black text-teal-300">#{selectedLogForModal.id}</span>
                </div>
              </div>

              {/* UBS workplace specifications */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                <span className="text-[9px] uppercase font-bold text-slate-500 tracking-widest block mb-1">UNIDADE BÁSICA DE SAÚDE</span>
                <p className="font-bold text-white text-md">{selectedLogForModal.ubsName}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 font-mono text-xs text-slate-400">
                  <div>CNPJ: <span className="text-slate-300 font-semibold">{selectedLogForModal.ubsCnpj}</span></div>
                  <div>Paraná - Região Medianeira</div>
                </div>
              </div>

              {/* Attendance metrics and priority demographics inside layout columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="p-4.5 bg-slate-950 rounded-2xl border border-slate-800">
                  <span className="text-[9px] uppercase font-bold text-slate-500 tracking-widest block mb-2">RESULTADOS DO ATENDIMENTO</span>
                  <div className="space-y-2 text-xs font-semibold">
                    <div className="flex justify-between text-teal-400">
                      <span>Atendimentos Realizados (Sucesso):</span>
                      <span className="font-mono text-sm font-black">{selectedLogForModal.consultationsPerformed}</span>
                    </div>
                    <div className="flex justify-between text-rose-400">
                      <span>Pacientes Não Assistidos:</span>
                      <span className="font-mono text-sm font-black">{selectedLogForModal.unattendedPatients}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4.5 bg-slate-950 rounded-2xl border border-slate-800">
                  <span className="text-[9px] uppercase font-bold text-slate-500 tracking-widest block mb-2">PACIENTES IMPACTADOS (DEMOGRAFIA)</span>
                  <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Gestantes:</span>
                      <span className="font-bold text-slate-200">{selectedLogForModal.demographics.pregnant}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Crianças:</span>
                      <span className="font-bold text-slate-200">{selectedLogForModal.demographics.children}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Idosos:</span>
                      <span className="font-bold text-slate-200">{selectedLogForModal.demographics.elderly}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Acamados:</span>
                      <span className="font-bold text-slate-200">{selectedLogForModal.demographics.bedridden}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Mob. Reduzida:</span>
                      <span className="font-bold text-slate-200">{selectedLogForModal.demographics.reducedMobility}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">PCD / PwD:</span>
                      <span className="font-bold text-slate-200">{selectedLogForModal.demographics.pwd}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Display captured photos verification layout */}
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-500 tracking-widest block mb-3">CONTRAPREV / REGISTROS DE PONTO FOTOGRÁFICO</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold mb-1 flex justify-between uppercase">
                      <span>Momento Entrada (In)</span>
                      <span className="text-slate-400 font-mono font-bold lowercase">{selectedLogForModal.photos.entryTime || 'não capturado'}</span>
                    </div>
                    {selectedLogForModal.photos.entryPhoto ? (
                      <div className="aspect-video rounded-xl overflow-hidden border border-slate-800 bg-black">
                        <img
                          src={selectedLogForModal.photos.entryPhoto}
                          alt="Entry proof"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video rounded-xl border border-dashed border-slate-800 bg-slate-950 flex items-center justify-center p-4 text-center">
                        <span className="text-slate-600 text-[11px] font-mono">Sem registro de Entrada</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-[10px] text-slate-500 font-bold mb-1 flex justify-between uppercase">
                      <span>Momento Saída (Out)</span>
                      <span className="text-slate-400 font-mono font-bold lowercase">{selectedLogForModal.photos.exitTime || 'não capturado'}</span>
                    </div>
                    {selectedLogForModal.photos.exitPhoto ? (
                      <div className="aspect-video rounded-xl overflow-hidden border border-slate-800 bg-black">
                        <img
                          src={selectedLogForModal.photos.exitPhoto}
                          alt="Exit proof"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video rounded-xl border border-dashed border-slate-800 bg-slate-950 flex items-center justify-center p-4 text-center">
                        <span className="text-slate-600 text-[11px] font-mono">Sem registro de Saída</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {selectedLogForModal.notes && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-850">
                  <span className="text-[9px] uppercase font-bold text-slate-500 tracking-widest block mb-1">OBSERVAÇÕES CLÍNICAS</span>
                  <p className="text-slate-300 text-xs leading-relaxed italic">"{selectedLogForModal.notes}"</p>
                </div>
              )}

              {/* Automatic Timestamp */}
              <div className="border-t border-slate-800 pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[10px] font-mono text-slate-500">
                <div>Emitido Eletronicamente em: {new Date(selectedLogForModal.timestamp).toLocaleString('pt-BR')}</div>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Assinatura Digital SUS - Validade de Compliance</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 mt-8 border-t border-slate-800/60 pt-5">
              <button
                type="button"
                onClick={() => {
                  const printContents = document.getElementById('print-certificate-area')?.innerHTML;
                  const originalContents = document.body.innerHTML;
                  
                  // Simple temporary clean layout print override
                  if (printContents) {
                    const popupWin = window.open('', '_blank');
                    if (popupWin) {
                      popupWin.document.open();
                      popupWin.document.write(`
                        <html>
                          <head>
                            <title>Comprovante SUS #${selectedLogForModal.id}</title>
                            <link href="https://cdn.jsdelivr.net/npm/tailwindcss@3.3.0/dist/tailwind.min.css" rel="stylesheet">
                            <style>
                              body { background: #fff !important; color: #000 !important; font-family: system-ui, sans-serif; padding: 30px; }
                              .text-white { color: #000 !important; }
                              .text-slate-200 { color: #1e293b !important; }
                              .text-slate-300 { color: #334155 !important; }
                              .text-slate-400 { color: #475569 !important; }
                              .text-slate-500 { color: #64748b !important; }
                              .bg-slate-900, .bg-slate-950, .bg-slate-900\\/40, .p-4.bg-slate-950, .bg-slate-950\\/45 { background: #f8fafc !important; border: 1px solid #e2e8f0 !important; }
                              img { max-height: 180px; object-fit: contain; }
                            </style>
                          </head>
                          <body onload="window.print();window.close();">
                            ${printContents}
                          </body>
                        </html>
                      `);
                      popupWin.document.close();
                    } else {
                      window.print();
                    }
                  }
                }}
                className="bg-sky-600 hover:bg-sky-500 px-4 py-2 text-xs font-bold text-white rounded-xl shadow cursor-pointer transition flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimir Recibo
              </button>
              <button
                type="button"
                onClick={() => setSelectedLogForModal(null)}
                className="bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 rounded-xl cursor-pointer transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
