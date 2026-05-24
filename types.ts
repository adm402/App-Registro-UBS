/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UBS {
  id: string;
  name: string;
  cnpj: string;
  address: string;
  neighborhood: string;
  phone?: string;
}

export interface PatientDemographics {
  pregnant: number;      // Gestantes
  children: number;      // Crianças
  elderly: number;       // Idosos
  bedridden: number;     // Acamados
  reducedMobility: number; // Mobilidade Reduzida
  pwd: number;           // PCD (Pessoas com Deficiência)
}

export interface PhotographicRecords {
  entryPhoto: string | null;  // Base64 or Blob URL of Clock-in photo
  entryTime: string | null;   // Timestamp of Clock-in
  exitPhoto: string | null;   // Base64 or Blob URL of Clock-out photo
  exitTime: string | null;    // Timestamp of Clock-out
}

export interface AttendanceLog {
  id: string; // 8-digit unique ID
  ubsId: string;
  ubsName: string;
  ubsCnpj: string;
  consultationsPerformed: number; // Atendimentos realizados
  unattendedPatients: number;     // Pacientes não assistidos
  demographics: PatientDemographics;
  photos: PhotographicRecords;
  timestamp: string; // Submission ISO string
  notes?: string;
}

export interface FormState {
  ubsId: string;
  consultationsPerformed: number;
  unattendedPatients: number;
  demographics: PatientDemographics;
  photos: PhotographicRecords;
  notes: string;
}
