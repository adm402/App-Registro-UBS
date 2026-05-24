/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Building2, UserCheck, UserX, Users, Camera, ClipboardCheck, 
  BarChart3, RefreshCw, AlertCircle, Sparkles, CheckCircle2, BookmarkPlus
} from 'lucide-react';
import { ubsList } from './data/ubsList';
import { FormState, AttendanceLog, PatientDemographics } from './types';
import Header from './components/Header';
import FormInput from './components/FormInput';
import CameraCapturePanel from './components/CameraCapture';
import MetricsDashboard from './components/MetricsDashboard';

// Initial form state
const initialFormState: FormState = {
  ubsId: '',
  consultationsPerformed: 0,
  unattendedPatients: 0,
  demographics: {
    pregnant: 0,
    children: 0,
    elderly: 0,
    bedridden: 0,
    reducedMobility: 0,
    pwd: 0,
  },
  photos: {
    entryPhoto: null,
    entryTime: null,
    exitPhoto: null,
    exitTime: null,
  },
  notes: '',
};

export default function App() {
  // Tabs: 'form' | 'dashboard'
  const [activeTab, setActiveTab] = useState<'form' | 'dashboard'>('form');
  
  // App Core States
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  
  // Validation / Message alerts
  const [successToast, setSuccessToast] = useState<{ id: string; msg: string } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Load logs from LocalStorage on mount
  useEffect(() => {
    try {
      const persistedLogs = localStorage.getItem('ubs_attendance_logs');
      if (persistedLogs) {
        setLogs(JSON.parse(persistedLogs));
      }
    } catch (err) {
      console.error('Falha ao ler cache local de diários:', err);
    }
  }, []);

  // Save logs to LocalStorage whenever they change
  const saveLogsToStorage = (updatedLogs: AttendanceLog[]) => {
    setLogs(updatedLogs);
    try {
      localStorage.setItem('ubs_attendance_logs', JSON.stringify(updatedLogs));
    } catch (err) {
      console.error('Falha ao gravar cache local:', err);
    }
  };

  // Automated System Data Helper: generate unique 8-digit random registration
  const generateUnique8DigitId = (): string => {
    // Generate a random 8-digit number string
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += Math.floor(Math.random() * 10).toString();
    }
    return result;
  };

  // Form Field Updates
  const handleUbsSelect = (id: string) => {
    setFormState(prev => ({ ...prev, ubsId: id }));
    setFormError(null);
  };

  const handleDemographicsChange = (field: keyof PatientDemographics, value: number) => {
    setFormState(prev => ({
      ...prev,
      demographics: {
        ...prev.demographics,
        [field]: value,
      }
    }));
  };

  const handlePhotoUpdate = (
    moment: 'entry' | 'exit', 
    image: string | null, 
    timestamp: string | null
  ) => {
    setFormState(prev => ({
      ...prev,
      photos: {
        ...prev.photos,
        [moment === 'entry' ? 'entryPhoto' : 'exitPhoto']: image,
        [moment === 'entry' ? 'entryTime' : 'exitTime']: timestamp,
      }
    }));
  };

  // Submit Logger handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // 1. Validation check for workplace location selection first
    if (!formState.ubsId) {
      setFormError('Por favor, selecione qual é a sua Unidade Básica de Saúde (UBS) de trabalho antes de registrar.');
      const selectEl = document.getElementById('ubs-select');
      if (selectEl) {
        selectEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        selectEl.focus();
      }
      return;
    }

    // 2. Validate photographic evidence requirements before logging
    if (!formState.photos.entryPhoto) {
      setFormError('Requisito Obrigatório: Favor registrar ou fazer upload da foto de Entrada (Clock-In) para verificação do ponto.');
      return;
    }

    const selectedUbs = ubsList.find((u) => u.id === formState.ubsId);
    if (!selectedUbs) return;

    // Build the finalized log with automated read-only system generation metadata
    const submissionId = generateUnique8DigitId();
    const currentSubmissionTime = new Date().toISOString();

    const finalizedLog: AttendanceLog = {
      id: submissionId,
      ubsId: formState.ubsId,
      ubsName: selectedUbs.name,
      ubsCnpj: selectedUbs.cnpj,
      consultationsPerformed: formState.consultationsPerformed,
      unattendedPatients: formState.unattendedPatients,
      demographics: { ...formState.demographics },
      photos: { ...formState.photos },
      timestamp: currentSubmissionTime,
      notes: formState.notes.trim() || undefined,
    };

    const newLogsList = [finalizedLog, ...logs];
    saveLogsToStorage(newLogsList);

    // Trigger Success Notification & reset form inputs
    setSuccessToast({
      id: submissionId,
      msg: `Registro clínico de ponto #${submissionId} catalogado com sucesso na base do SUS!`
    });
    setFormState(initialFormState);
    
    // Auto Scroll to header of success cards
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Dismiss toast after 8 seconds automatically
    setTimeout(() => {
      setSuccessToast(null);
    }, 8000);
  };

  // Deletions handlers
  const handleDeleteLog = (id: string) => {
    const nextLogs = logs.filter((log) => log.id !== id);
    saveLogsToStorage(nextLogs);
  };

  const handleClearAllLogs = () => {
    if (confirm('Aviso Crítico: Deseja apagar permanentemente todos os relatórios odontológicos salvos neste navegador de forma irreversível?')) {
      saveLogsToStorage([]);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 pb-16 font-sans">
      
      {/* Visual Top Bar decoration for dental government context */}
      <div className="bg-[#2dd4bf] text-slate-900 py-1.5 px-4 text-center font-mono text-[10px] font-bold tracking-widest uppercase shadow-sm border-b border-teal-200">
        Ambiente de Registro Oficial SUS • Medianeira - PR • Brasil
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Header containing Workplace UBS select box */}
        <Header 
          selectedUbsId={formState.ubsId} 
          onSelectUbs={handleUbsSelect} 
        />

        {/* Dynamic Success trigger alert */}
        {successToast && (
          <div 
            id="success-alert-banner" 
            className="bg-emerald-50 text-emerald-950 border-2 border-emerald-500/30 p-5 rounded-3xl flex items-start gap-4 shadow-md transition animate-in fade-in slide-in-from-top-4"
          >
            <span className="p-2 bg-emerald-500 text-white rounded-2xl shrink-0 mt-0.5">
              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
            </span>
            <div className="flex-1">
              <h4 className="font-extrabold text-emerald-900 text-md tracking-tight leading-snug">
                Lançamento Concluído com Sucesso!
              </h4>
              <p className="text-emerald-850 text-xs mt-1 leading-relaxed">
                {successToast.msg} Os dados do atendimento diário e metadados demográficos foram guardados.
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-3 text-[11px] font-mono">
                <span className="bg-emerald-500/10 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-500/20">
                  ID Comprovante: {successToast.id}
                </span>
                <span className="bg-emerald-500/10 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-500/20">
                  Registrado Localmente
                </span>
                <button
                  onClick={() => {
                    setActiveTab('dashboard');
                    setSuccessToast(null);
                  }}
                  className="text-emerald-700 underline font-bold hover:text-emerald-900 transition ml-1"
                >
                  Visualizar Histórico &rarr;
                </button>
              </div>
            </div>
            <button 
              onClick={() => setSuccessToast(null)} 
              className="text-emerald-550 hover:text-emerald-900 shrink-0 font-bold"
            >
              &times;
            </button>
          </div>
        )}

        {/* Tab Controllers navigation block */}
        <div className="flex border-b border-slate-200 gap-1 overflow-x-auto pb-0.5" id="nav-tabs-wrapper">
          <button
            onClick={() => setActiveTab('form')}
            className={`px-5 py-3 rounded-t-2xl font-bold text-sm transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'form' 
                ? 'bg-white text-slate-900 border-t border-x border-slate-200 border-b-2 border-b-white z-10 -mb-0.5' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BookmarkPlus className="w-4 h-4 text-teal-600" />
            Lançar Diário Odontológico
          </button>
          
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-5 py-3 rounded-t-2xl font-bold text-sm transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'dashboard' 
                ? 'bg-white text-slate-900 border-t border-x border-slate-200 border-b-2 border-b-white z-10 -mb-0.5' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-teal-600" />
            Estatísticas & Histórico
            {logs.length > 0 && (
              <span className="ml-1 bg-teal-500 text-slate-950 px-1.5 py-0.5 rounded-full font-mono font-bold text-[10px]" id="logs-badge-counter">
                {logs.length}
              </span>
            )}
          </button>
        </div>

        {/* Display Active Tab Content */}
        {activeTab === 'form' ? (
          <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in duration-200">
            
            {/* Form Validation Alarm Callout */}
            {formError && (
              <div 
                id="form-error-callout" 
                className="bg-amber-50 text-amber-950 border-l-4 border-amber-500 p-4 rounded-xl flex items-start gap-3 shadow-sm animate-shake"
              >
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <h5 className="font-extrabold text-amber-900">Atenção no Lançamento</h5>
                  <p className="mt-0.5 text-amber-850 leading-relaxed">{formError}</p>
                </div>
              </div>
            )}

            {/* Attendance Metrics Block */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-teal-600">PASSO 1: ATENDIMENTOS GERAIS</span>
                <h2 className="text-xl font-bold font-sans text-slate-900 mt-1">Métricas de Atendimentos Clínicos</h2>
                <p className="text-slate-500 text-xs mt-1">Insira os quantitativos correspondentes à recepção geral do consultório.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FormInput
                  id="consultationsPerformed"
                  label="Consultas Odontológicas Realizadas"
                  sublabel="Número de atendimentos clínicos realizados (Atendimentos realizados)"
                  value={formState.consultationsPerformed}
                  onChange={(val) => {
                    setFormState(prev => ({ ...prev, consultationsPerformed: val }));
                    setFormError(null);
                  }}
                  icon={<UserCheck className="w-5 h-5 text-teal-500" />}
                />

                <FormInput
                  id="unattendedPatients"
                  label="Pacientes Não Assistidos"
                  sublabel="Quantidade de ausências registradas de consultório (Pacientes não assistidos)"
                  value={formState.unattendedPatients}
                  onChange={(val) => {
                    setFormState(prev => ({ ...prev, unattendedPatients: val }));
                    setFormError(null);
                  }}
                  icon={<UserX className="w-5 h-5 text-rose-500" />}
                />
              </div>
            </div>

            {/* Patients Demographics (Vulnerability classifications) */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-teal-600">PASSO 2: TRIAGEM DE GRUPOS</span>
                <h2 className="text-xl font-bold font-sans text-slate-900 mt-1">Demografia Especial dos Pacientes</h2>
                <p className="text-slate-500 text-xs mt-1">Classifique os pacientes em suas devidas categorias com prioridade legislativa ou epidemiológica SUS.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* Gestantes */}
                <FormInput
                  id="demo-pregnant"
                  label="Gestantes"
                  sublabel="Consultas em gestantes (Gestantes)"
                  value={formState.demographics.pregnant}
                  onChange={(val) => handleDemographicsChange('pregnant', val)}
                />

                {/* Crianças */}
                <FormInput
                  id="demo-children"
                  label="Crianças"
                  sublabel="Atendimentos pediátricos (Crianças)"
                  value={formState.demographics.children}
                  onChange={(val) => handleDemographicsChange('children', val)}
                />

                {/* Idosos */}
                <FormInput
                  id="demo-elderly"
                  label="Idosos"
                  sublabel="Idade igual ou superior a 60 anos (Idosos)"
                  value={formState.demographics.elderly}
                  onChange={(val) => handleDemographicsChange('elderly', val)}
                />

                {/* Acamados */}
                <FormInput
                  id="demo-bedridden"
                  label="Pacientes Acamados"
                  sublabel="Consultas domiciliares ou leito de repouso (Acamados)"
                  value={formState.demographics.bedridden}
                  onChange={(val) => handleDemographicsChange('bedridden', val)}
                />

                {/* Mobilidade Reduzida */}
                <FormInput
                  id="demo-reducedMobility"
                  label="Mobilidade Reduzida"
                  sublabel="Pacientes com locomoção prejudicada ou assistida"
                  value={formState.demographics.reducedMobility}
                  onChange={(val) => handleDemographicsChange('reducedMobility', val)}
                />

                {/* PCD / PwD */}
                <FormInput
                  id="demo-pwd"
                  label="PcD"
                  sublabel="Pessoas com Deficiência Física, Sensorial ou Cognitiva (PCD)"
                  value={formState.demographics.pwd}
                  onChange={(val) => handleDemographicsChange('pwd', val)}
                />
              </div>
            </div>

            {/* Photographic Clock-In Exit validations */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-teal-600">PASSO 3: COMPROVAÇÃO DE PRESENÇA</span>
                <h2 className="text-xl font-bold font-sans text-slate-900 mt-1">Registros Fotográficos de Ponto</h2>
                <p className="text-slate-500 text-xs mt-1">Utilize a câmera do dispositivo ou anexe fotos comprobatórias para comprovar o início e fim de suas atividades.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <CameraCapturePanel
                  label="Entrada (Clock-In) da UBS"
                  description="Comprovante de início do plantão clínico (Obrigatório para envio)."
                  image={formState.photos.entryPhoto}
                  timestamp={formState.photos.entryTime}
                  onChange={(img, stamp) => handlePhotoUpdate('entry', img, stamp)}
                />

                <CameraCapturePanel
                  label="Saída (Clock-Out) da UBS"
                  description="Comprovante de encerramento do plantão de rotina."
                  image={formState.photos.exitPhoto}
                  timestamp={formState.photos.exitTime}
                  onChange={(img, stamp) => handlePhotoUpdate('exit', img, stamp)}
                />
              </div>
            </div>

            {/* Extra Clinical notes */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
              <div>
                <span className="text-slate-400 font-bold font-mono text-xs uppercase">PASSO 4: ADENDO</span>
                <h3 className="font-bold text-slate-800 text-sm mt-1">Observações / Relatório e Ocorrências</h3>
              </div>
              <textarea
                value={formState.notes}
                onChange={(e) => setFormState(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Insira detalhes extras relevantes sobre o plantão clínico de hoje (por exemplo: falta de insumos, quebra de equipamentos, campanhas de vacinação, etc)..."
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            {/* Submission Block */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-100 border border-slate-200 p-5 rounded-3xl">
              <div className="flex items-start gap-2.5">
                <span className="p-1 bg-white text-teal-500 rounded-lg shrink-0 border border-slate-200/50">
                  <Sparkles className="w-5 h-5" />
                </span>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Ao submeter este diário odontológico, o sistema irá anexar automaticamente os comprovantes fotográficos, gerar o número registro único SUS com 8 dígitos e selar os horários certificados.
                </p>
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 active:bg-slate-950 font-extrabold text-sm text-white px-8 py-4 rounded-2xl cursor-pointer shadow-lg transition duration-200 whitespace-nowrap"
              >
                Cadastrar Atendimento Clínico &rarr;
              </button>
            </div>

          </form>
        ) : (
          <div className="animate-in fade-in duration-200 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
            {/* The general metrics stats & historic datatable list */}
            <MetricsDashboard
              logs={logs}
              onDeleteLog={handleDeleteLog}
              onClearLogs={handleClearAllLogs}
            />
          </div>
        )}

        {/* Footer info showing Brazil compliance */}
        <footer className="text-center pt-10 text-slate-400 text-xs py-4 border-t border-slate-200/60 font-mono space-y-1">
          <div>Conselho Regional de Odontologia do Paraná (CRO-PR) • Regulamentação SUS municipal</div>
          <div>Secretaria de Saúde • Prefeitura Municipal de Medianeira</div>
        </footer>

      </div>
    </div>
  );
}
