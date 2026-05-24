/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Building2, MapPin, Clock, Calendar, Check } from 'lucide-react';
import { ubsList } from '../data/ubsList';
import { UBS } from '../types';

interface HeaderProps {
  selectedUbsId: string;
  onSelectUbs: (id: string) => void;
}

export default function Header({ selectedUbsId, onSelectUbs }: HeaderProps) {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const selectedUbs = ubsList.find((u) => u.id === selectedUbsId);

  // Format date in Portuguese (as it matches Medianeira, Brazil context)
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  return (
    <header className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden mb-8">
      {/* Visual background accents */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-10 w-60 h-60 bg-sky-500/5 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="inline-flex items-center justify-center p-2.5 bg-teal-500/20 text-teal-400 rounded-xl border border-teal-500/30">
              <Building2 className="w-6 h-6" />
            </span>
            <div>
              <span className="text-xs uppercase tracking-widest text-teal-400 font-mono font-bold">
                Sistema de Gestão Odontológica • SUS
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-0.5" id="main-header-title">
                Diário de Atendimento UBS
              </h1>
            </div>
          </div>
          <p className="text-slate-400 text-sm max-w-xl">
            Registro diário de consultas odontológicas, distribuição demográfica do paciente e evidência fotográfica para regulação e controle em Medianeira, PR.
          </p>
        </div>

        {/* Realtime clock/date in Portuguese */}
        <div className="flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end gap-3 bg-slate-950/40 p-4 rounded-2xl border border-slate-800/80 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-slate-300 font-medium text-sm">
            <Calendar className="w-4 h-4 text-teal-400" />
            <span>{formatDate(currentTime)}</span>
          </div>
          <div className="flex items-center gap-2 text-white font-mono font-bold text-lg text-teal-300">
            <Clock className="w-4 h-4 text-teal-400 animate-pulse" />
            <span>{formatTime(currentTime)}</span>
          </div>
        </div>
      </div>

      {/* UBS Dropdown Selection */}
      <div className="mt-8 pt-6 border-t border-slate-800/80">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-end">
          <div className="lg:col-span-5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Selecione a Unidade de Trabalho (Workplace)
            </label>
            <div className="relative">
              <select
                id="ubs-select"
                value={selectedUbsId}
                onChange={(e) => onSelectUbs(e.target.value)}
                className="w-full bg-slate-950 text-white border border-slate-700 hover:border-slate-500 rounded-xl px-4 py-3.5 pr-10 focus:outline-none focus:ring-2 focus:ring-teal-500/40 appearance-none font-medium transition duration-250 cursor-pointer text-sm"
              >
                <option value="" disabled>-- Selecione a UBS --</option>
                {ubsList.map((ubs) => (
                  <option key={ubs.id} value={ubs.id}>
                    {ubs.name} — CNPJ: {ubs.cnpj}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            {selectedUbs ? (
              <div 
                id="ubs-details-card" 
                className="bg-teal-950/10 border border-teal-500/20 rounded-xl p-4 flex flex-col sm:flex-row hover:border-teal-500/30 transition duration-300 gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">Unidade Selecionada</span>
                  </div>
                  <h3 className="font-bold text-white text-md tracking-tight">{selectedUbs.name}</h3>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-y-1 gap-x-4 mt-1.5 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      {selectedUbs.address}, {selectedUbs.neighborhood}
                    </span>
                    {selectedUbs.phone && (
                      <span className="font-mono">
                        Tel: {selectedUbs.phone}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-stretch sm:items-end justify-center pt-2 sm:pt-0 border-t sm:border-t-0 sm:border-l border-slate-800/80 sm:pl-5">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest block mb-0.5">CNPJ da Filial</span>
                  <span className="bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 text-teal-300 font-mono text-xs font-bold whitespace-nowrap">
                    {selectedUbs.cnpj}
                  </span>
                </div>
              </div>
            ) : (
              <div 
                id="ubs-placeholder-callout" 
                className="border border-dashed border-slate-700/60 rounded-xl p-4 text-center sm:text-left flex items-center justify-center sm:justify-start gap-3 bg-slate-950/15"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                <p className="text-amber-300 text-xs font-medium">
                  Atenção: Selecione a sua Unidade Básica de Saúde (UBS) acima para habilitar o formulário.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
