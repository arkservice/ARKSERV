// Edge Function : Webhook NetSuite → Supabase (Version consolidée)
// Reçoit les données de projets NetSuite, crée les entités dans Supabase,
// génère un PDF de convocation et le retourne en base64

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'jsr:@supabase/supabase-js@2';

// ============================================================================
// TYPES
// ============================================================================

interface NetSuiteJobData {
  id: string;
  entityid: string;
  entitynumber: string;
  companyname: string;
  parent?: string;
  startdate?: string;
  calculatedenddate?: string;
  datecreated?: string;
  custentity_training_dates?: string;
  custentity_training_hours?: string;
  custentity_training_location?: string;
  custentity_training_nbr_of_clients?: string;
  custentity_software?: string;
  custentity_training_project_version?: string;
  custentity_training_specialization?: string;
  custentity_training_length_days?: string;
  custentity_arka_duration?: string;
  projectmanager?: string;
  currency?: string;
  estimatedrevenuejc?: string;
  custentity_training_funding_agency?: string;
  custentity_vat_reg_no?: string;
  stagiaires?: Array<{
    nom: string;
    prenom: string;
    email: string;
    fonction?: string;
  }>;
}

interface SupabaseEntreprise {
  id?: string;
  nom: string;
  adresse?: string;
  telephone?: string;
  email?: string;
  secteur_activite?: string;
  type_entreprise: 'client' | 'interne';
}

interface SupabaseProject {
  id?: string;
  netsuite_id: string;
  prj?: string;
  name: string;
  description?: string;
  type: 'formation' | 'prestation';
  status: 'active' | 'completed' | 'paused' | 'transmission';
  entreprise_id: string;
  logiciel_id?: string;
  formateur_id?: string;
  commercial_id?: string;
  contact_id?: string;
  pdc_id?: string;
  nombre_stagiaire?: number;
  lieu_projet?: string;
  periode_souhaitee?: string;
  heures_formation?: string;
  stagiaire_ids?: string[];
  pdf_convocation?: string;
  pdf_convention?: string;
  so?: number;
  created_at?: string;
  updated_at?: string;
}

interface SupabaseEvenement {
  id?: string;
  titre: string;
  description?: string;
  date_debut: string;
  date_fin: string;
  type_evenement: 'formation' | 'reunion' | 'conge' | 'maintenance' | 'deplacement' | 'rendez_vous' | 'autre';
  statut: 'planifie' | 'confirme' | 'en_cours' | 'termine' | 'annule';
  priorite: 'haute' | 'normale' | 'basse';
  lieu?: string;
  projet_id: string;
  entreprise_cliente_id?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface ConvocationData {
  references: string;
  entreprise_nom: string;
  entreprise_adresse?: string;
  destinataire: string;
  objet: string;
  date: string;
  formation: string;
  sessions: string[];
  dates?: string;
  lieu: string;
  heures: string;
  stagiairesListe?: string[];
  stagiaires?: string;
  signataire: string;
  titre_signataire: string;
}

interface WebhookSuccessResponse {
  success: true;
  project_id: string;
  prj: string;
  netsuite_id: string;
  convocation: {
    pdf_base64: string;
    filename: string;
    url: string;
  };
  entities_created: {
    entreprise_id: string;
    project_id: string;
    evenements_count: number;
  };
  message: string;
}

interface WebhookErrorResponse {
  success: false;
  error: string;
  error_code: string;
  details?: Record<string, any>;
}

type WebhookResponse = WebhookSuccessResponse | WebhookErrorResponse;

enum ErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_JSON = 'INVALID_JSON',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  DATABASE_ERROR = 'DATABASE_ERROR',
  PDF_GENERATION_ERROR = 'PDF_GENERATION_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

interface ParsedNetSuiteData {
  netsuiteId: string;
  prj: string;
  entityId: string;
  companyName: string;
  logicielName: string | null;
  logicielVersion: string | null;
  specialisation: string | null;
  dates: Date[];
  horaires: { start: string; end: string };
  lieu: string;
  nombreStagiaires: number;
  dureeJours: number | null;
  stagiaires: Array<{
    nom: string;
    prenom: string;
    email: string;
    fonction?: string;
  }>;
  raw: NetSuiteJobData;
}

// ============================================================================
// UTILS
// ============================================================================

function createErrorResponse(
  error: string,
  errorCode: ErrorCode,
  details?: Record<string, any>
): Response {
  const response: WebhookErrorResponse = {
    success: false,
    error,
    error_code: errorCode,
    ...(details && { details }),
  };

  const statusMap: Record<ErrorCode, number> = {
    [ErrorCode.UNAUTHORIZED]: 401,
    [ErrorCode.INVALID_JSON]: 400,
    [ErrorCode.MISSING_REQUIRED_FIELD]: 400,
    [ErrorCode.DATABASE_ERROR]: 500,
    [ErrorCode.PDF_GENERATION_ERROR]: 500,
    [ErrorCode.STORAGE_ERROR]: 500,
    [ErrorCode.UNKNOWN_ERROR]: 500,
  };

  const status = statusMap[errorCode] || 500;

  return new Response(JSON.stringify(response), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function extractPRJ(entityid: string): string {
  if (!entityid) return '';
  const match = entityid.match(/PRJ\d+/i);
  return match ? match[0] : '';
}

function parseNetSuiteDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  try {
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    if (isNaN(date.getTime())) return null;
    return date;
  } catch {
    return null;
  }
}

function parseHoraires(horaires: string): { start: string; end: string } {
  const defaultHoraires = { start: '09:00', end: '17:00' };
  if (!horaires) return defaultHoraires;
  try {
    const heureMatches = horaires.matchAll(/(\d{1,2})h(\d{2})/g);
    const heures: string[] = [];
    for (const match of heureMatches) {
      const heure = match[1].padStart(2, '0');
      const minute = match[2];
      heures.push(`${heure}:${minute}`);
    }
    if (heures.length >= 2) {
      return {
        start: heures[0],
        end: heures[heures.length - 1],
      };
    }
    return defaultHoraires;
  } catch {
    return defaultHoraires;
  }
}

function parseTrainingDates(datesStr: string): Date[] {
  if (!datesStr) return [];
  try {
    const dateParts = datesStr.split(/\s*-\s*/);
    const dates: Date[] = [];
    for (const datePart of dateParts) {
      const date = parseNetSuiteDate(datePart.trim());
      if (date) {
        dates.push(date);
      }
    }
    return dates;
  } catch {
    return [];
  }
}

function combineDateAndTime(date: Date, time: string): Date {
  const [hours, minutes] = time.split(':').map(s => parseInt(s, 10));
  const combined = new Date(date);
  combined.setHours(hours, minutes, 0, 0);
  return combined;
}

function formatDateFr(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatSessionDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function generatePdfFilename(prj: string, type: 'convocation' | 'convention'): string {
  const safePrj = prj.replace(/[^a-zA-Z0-9]/g, '_');
  const timestamp = Date.now();
  return `${type}_${safePrj}_${timestamp}.pdf`;
}

function isNotEmpty(str: string | undefined | null): boolean {
  return !!str && str.trim().length > 0;
}

function log(level: 'info' | 'warn' | 'error', message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  if (data) {
    console.log(prefix, message, JSON.stringify(data, null, 2));
  } else {
    console.log(prefix, message);
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function blobToBase64(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  return arrayBufferToBase64(arrayBuffer);
}

function normalizeLogicielName(name: string): string {
  return name.toLowerCase().trim();
}

// ============================================================================
// PARSER
// ============================================================================

function validateNetSuiteData(data: NetSuiteJobData): {
  valid: boolean;
  missing?: string[];
} {
  const requiredFields: (keyof NetSuiteJobData)[] = [
    'id',
    'entityid',
    'companyname',
  ];

  const missing: string[] = [];

  for (const field of requiredFields) {
    if (!data[field] || (typeof data[field] === 'string' && !isNotEmpty(data[field] as string))) {
      missing.push(field);
    }
  }

  if (missing.length > 0) {
    log('error', 'Champs obligatoires manquants', { missing });
    return { valid: false, missing };
  }

  return { valid: true };
}

function parseNetSuiteData(data: NetSuiteJobData): ParsedNetSuiteData {
  log('info', '=== Début du parsing des données NetSuite ===');

  // Parser dates
  const datesStr = data.custentity_training_dates;
  let dates: Date[] = [];
  if (datesStr && isNotEmpty(datesStr)) {
    dates = parseTrainingDates(datesStr);
    dates.sort((a, b) => a.getTime() - b.getTime());
  }

  // Parser horaires
  const horairesStr = data.custentity_training_hours;
  const horaires = (horairesStr && isNotEmpty(horairesStr))
    ? parseHoraires(horairesStr)
    : { start: '09:00', end: '17:00' };

  // Parser PRJ
  const prj = extractPRJ(data.entityid);

  // Parser nombre stagiaires
  const nbStr = data.custentity_training_nbr_of_clients;
  const nombreStagiaires = (nbStr && isNotEmpty(nbStr)) ? parseInt(nbStr, 10) : 0;

  // Parser logiciel
  const software = data.custentity_software;
  const logicielName = (software && isNotEmpty(software)) ? software.trim() : null;

  // Parser version
  const version = data.custentity_training_project_version;
  const logicielVersion = (version && isNotEmpty(version)) ? version.trim() : null;

  // Parser spécialisation
  const specialisation = data.custentity_training_specialization;
  const spec = (specialisation && isNotEmpty(specialisation)) ? specialisation.trim() : null;

  // Parser lieu
  const lieu = data.custentity_training_location;
  const lieuParsed = (lieu && isNotEmpty(lieu)) ? lieu.trim() : 'À définir';

  // Parser durée
  const dureeStr = data.custentity_training_length_days || data.custentity_arka_duration;
  const dureeJours = (dureeStr && isNotEmpty(dureeStr)) ? parseInt(dureeStr, 10) : null;

  // Parser stagiaires
  const stagiaires = (data.stagiaires && Array.isArray(data.stagiaires)) ? data.stagiaires : [];

  const parsed: ParsedNetSuiteData = {
    netsuiteId: data.id,
    prj: prj,
    entityId: data.entityid,
    companyName: data.companyname.trim(),
    logicielName,
    logicielVersion,
    specialisation: spec,
    dates,
    horaires,
    lieu: lieuParsed,
    nombreStagiaires,
    dureeJours,
    stagiaires,
    raw: data,
  };

  log('info', '=== Fin du parsing des données NetSuite ===', {
    summary: {
      netsuiteId: parsed.netsuiteId,
      prj: parsed.prj,
      companyName: parsed.companyName,
      logicielName: parsed.logicielName,
      nombreDates: parsed.dates.length,
      nombreStagiaires: parsed.nombreStagiaires,
    },
  });

  return parsed;
}

// ============================================================================
// MAPPER
// ============================================================================

function mapToEntreprise(parsedData: ParsedNetSuiteData): Omit<SupabaseEntreprise, 'id'> {
  log('info', 'Mapping vers Entreprise', {
    companyName: parsedData.companyName,
  });

  return {
    nom: parsedData.companyName,
    type_entreprise: 'client',
    adresse: null,
    telephone: null,
    email: null,
    secteur_activite: null,
  };
}

function mapToProject(
  parsedData: ParsedNetSuiteData,
  entrepriseId: string,
  logicielId: string | null
): Omit<SupabaseProject, 'id' | 'created_at' | 'updated_at'> {
  log('info', 'Mapping vers Project', {
    prj: parsedData.prj,
    entrepriseId,
    logicielId,
  });

  let projectName = parsedData.companyName;
  if (parsedData.logicielName) {
    projectName += ` - ${parsedData.logicielName}`;
  }
  if (parsedData.logicielVersion) {
    projectName += ` ${parsedData.logicielVersion}`;
  }

  let description = 'Projet importé depuis NetSuite';
  if (parsedData.specialisation) {
    description += `\n\nSpécialisation : ${parsedData.specialisation}`;
  }
  if (parsedData.dureeJours) {
    description += `\nDurée : ${parsedData.dureeJours} jour(s)`;
  }

  let periodeFormatted = parsedData.raw.custentity_training_dates || '';
  if (parsedData.dates.length > 0) {
    periodeFormatted = parsedData.dates.map(d => formatDateFr(d)).join(', ');
  }

  return {
    netsuite_id: parsedData.netsuiteId,
    prj: parsedData.prj || null,
    name: projectName,
    description: description,
    type: 'formation',
    status: 'active',
    entreprise_id: entrepriseId,
    logiciel_id: logicielId || null,
    nombre_stagiaire: parsedData.nombreStagiaires,
    lieu_projet: parsedData.lieu,
    periode_souhaitee: periodeFormatted,
    heures_formation: parsedData.raw.custentity_training_hours || '09h00 à 12h00 et de 13h00 à 17h00',
    stagiaire_ids: [],
    formateur_id: null,
    commercial_id: null,
    contact_id: null,
    pdc_id: null,
    pdf_convocation: null,
    pdf_convention: null,
    created_by: '1712950e-5f40-4e39-8abb-5ab85ba81619', // User système NetSuite Integration
  };
}

function mapToEvenements(
  parsedData: ParsedNetSuiteData,
  projectId: string,
  entrepriseId: string,
  logicielName: string
): Omit<SupabaseEvenement, 'id' | 'created_at' | 'updated_at'>[] {
  log('info', 'Mapping vers Evenements', {
    nombreDates: parsedData.dates.length,
    projectId,
  });

  if (parsedData.dates.length === 0) {
    log('warn', 'Aucune date de formation à mapper');
    return [];
  }

  const evenements: Omit<SupabaseEvenement, 'id' | 'created_at' | 'updated_at'>[] = [];

  parsedData.dates.forEach((date, index) => {
    const jourNumber = index + 1;
    const dateDebut = combineDateAndTime(date, parsedData.horaires.start);
    const dateFin = combineDateAndTime(date, parsedData.horaires.end);

    let titre = `Formation ${logicielName}`;
    if (parsedData.dates.length > 1) {
      titre += ` - Jour ${jourNumber}/${parsedData.dates.length}`;
    }

    const description = `${formatSessionDate(date)} de ${parsedData.horaires.start} à ${parsedData.horaires.end}`;

    evenements.push({
      titre,
      description,
      date_debut: dateDebut.toISOString(),
      date_fin: dateFin.toISOString(),
      type_evenement: 'formation',
      statut: 'planifie',
      priorite: 'normale',
      lieu: parsedData.lieu,
      projet_id: projectId,
      entreprise_cliente_id: entrepriseId,
      user_id: null,
    });
  });

  log('info', `${evenements.length} événement(s) mappé(s)`);

  return evenements;
}

function mapToConvocationData(
  parsedData: ParsedNetSuiteData,
  project: SupabaseProject,
  entreprise: SupabaseEntreprise,
  logicielName: string
): ConvocationData {
  log('info', 'Mapping vers ConvocationData');

  let references = '';
  if (project.so) {
    references += `SOASF${project.so}`;
  }
  if (project.prj) {
    references += references ? ` - ${project.prj}` : project.prj;
  }

  const sessions: string[] = [];
  if (parsedData.dates.length > 0) {
    parsedData.dates.forEach((date, index) => {
      const jourNumber = index + 1;
      const sessionText = `${formatSessionDate(date)}`;

      if (parsedData.dates.length > 1) {
        sessions.push(`Jour ${jourNumber} : ${sessionText}`);
      } else {
        sessions.push(sessionText);
      }
    });
  }

  if (sessions.length > 0) {
    sessions.push('');
    sessions.push(`Lieu : ${parsedData.lieu}`);
  }

  return {
    references,
    entreprise_nom: entreprise.nom,
    entreprise_adresse: entreprise.adresse || '',
    destinataire: 'Monsieur/Madame',
    objet: `Convocation formation ${logicielName}`,
    date: formatDateFr(new Date()),
    formation: logicielName,
    sessions,
    dates: parsedData.raw.custentity_training_dates,
    lieu: parsedData.lieu,
    heures: parsedData.raw.custentity_training_hours || '09h00 à 12h00 et de 13h00 à 17h00',
    stagiairesListe: parsedData.stagiaires.map(s => `${s.prenom} ${s.nom}`),
    stagiaires: '',
    signataire: 'Service Formation',
    titre_signataire: 'ARKANCE Systems',
  };
}

// ============================================================================
// DATABASE
// ============================================================================

function createSupabaseClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(supabaseUrl, supabaseKey);
}

async function findOrCreateEntreprise(
  supabase: SupabaseClient,
  entrepriseData: Omit<SupabaseEntreprise, 'id'>
): Promise<string> {
  log('info', 'Recherche de l\'entreprise', { nom: entrepriseData.nom });

  const { data: existing, error: searchError } = await supabase
    .from('entreprise')
    .select('id')
    .eq('nom', entrepriseData.nom)
    .eq('type_entreprise', 'client')
    .maybeSingle();

  if (searchError) {
    log('error', 'Erreur lors de la recherche de l\'entreprise', { error: searchError });
    throw new Error(`Erreur recherche entreprise: ${searchError.message}`);
  }

  if (existing) {
    log('info', 'Entreprise existante trouvée', { id: existing.id });
    return existing.id;
  }

  log('info', 'Création d\'une nouvelle entreprise');

  const { data: created, error: createError } = await supabase
    .from('entreprise')
    .insert(entrepriseData)
    .select('id')
    .single();

  if (createError) {
    log('error', 'Erreur lors de la création de l\'entreprise', { error: createError });
    throw new Error(`Erreur création entreprise: ${createError.message}`);
  }

  log('info', 'Entreprise créée avec succès', { id: created.id });

  return created.id;
}

async function findLogicielByName(
  supabase: SupabaseClient,
  logicielName: string | null
): Promise<string | null> {
  if (!logicielName) {
    log('info', 'Aucun nom de logiciel fourni');
    return null;
  }

  log('info', 'Recherche du logiciel', { nom: logicielName });

  const normalized = normalizeLogicielName(logicielName);

  const { data, error } = await supabase
    .from('logiciel')
    .select('id, nom')
    .ilike('nom', `%${normalized}%`)
    .maybeSingle();

  if (error) {
    log('error', 'Erreur lors de la recherche du logiciel', { error });
    return null;
  }

  if (data) {
    log('info', 'Logiciel trouvé', { id: data.id, nom: data.nom });
    return data.id;
  }

  log('warn', 'Logiciel non trouvé dans la base', { nom: logicielName });
  return null;
}

async function findProjectByNetsuiteId(
  supabase: SupabaseClient,
  netsuiteId: string
): Promise<SupabaseProject | null> {
  log('info', 'Recherche projet par netsuite_id', { netsuiteId });

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('netsuite_id', netsuiteId)
    .maybeSingle();

  if (error) {
    log('error', 'Erreur lors de la recherche du projet', { error });
    throw new Error(`Erreur recherche projet: ${error.message}`);
  }

  if (data) {
    log('info', 'Projet existant trouvé', { id: data.id });
  } else {
    log('info', 'Aucun projet existant trouvé');
  }

  return data;
}

async function createProject(
  supabase: SupabaseClient,
  projectData: Omit<SupabaseProject, 'id' | 'created_at' | 'updated_at'>
): Promise<SupabaseProject> {
  log('info', 'Création d\'un nouveau projet', { prj: projectData.prj });

  const { data, error } = await supabase
    .from('projects')
    .insert(projectData)
    .select()
    .single();

  if (error) {
    log('error', 'Erreur lors de la création du projet', { error });
    throw new Error(`Erreur création projet: ${error.message}`);
  }

  log('info', 'Projet créé avec succès', { id: data.id });

  return data;
}

async function updateProject(
  supabase: SupabaseClient,
  projectId: string,
  projectData: Partial<SupabaseProject>
): Promise<SupabaseProject> {
  log('info', 'Mise à jour du projet existant', { projectId });

  const { data, error } = await supabase
    .from('projects')
    .update(projectData)
    .eq('id', projectId)
    .select()
    .single();

  if (error) {
    log('error', 'Erreur lors de la mise à jour du projet', { error });
    throw new Error(`Erreur mise à jour projet: ${error.message}`);
  }

  log('info', 'Projet mis à jour avec succès', { id: data.id });

  return data;
}

async function upsertProject(
  supabase: SupabaseClient,
  projectData: Omit<SupabaseProject, 'id' | 'created_at' | 'updated_at'>
): Promise<{ project: SupabaseProject; isNew: boolean }> {
  const existing = await findProjectByNetsuiteId(supabase, projectData.netsuite_id);

  if (existing) {
    const updated = await updateProject(supabase, existing.id!, projectData);
    return { project: updated, isNew: false };
  } else {
    const created = await createProject(supabase, projectData);
    return { project: created, isNew: true };
  }
}

async function deleteProjectEvenements(
  supabase: SupabaseClient,
  projectId: string
): Promise<void> {
  log('info', 'Suppression des événements existants du projet', { projectId });

  const { error } = await supabase
    .from('evenement')
    .delete()
    .eq('projet_id', projectId)
    .eq('type_evenement', 'formation');

  if (error) {
    log('error', 'Erreur lors de la suppression des événements', { error });
    throw new Error(`Erreur suppression événements: ${error.message}`);
  }

  log('info', 'Événements supprimés avec succès');
}

async function createEvenements(
  supabase: SupabaseClient,
  evenements: Omit<SupabaseEvenement, 'id' | 'created_at' | 'updated_at'>[]
): Promise<SupabaseEvenement[]> {
  if (evenements.length === 0) {
    log('info', 'Aucun événement à créer');
    return [];
  }

  log('info', `Création de ${evenements.length} événement(s)`);

  const { data, error } = await supabase
    .from('evenement')
    .insert(evenements)
    .select();

  if (error) {
    log('error', 'Erreur lors de la création des événements', { error });
    throw new Error(`Erreur création événements: ${error.message}`);
  }

  log('info', `${data.length} événement(s) créé(s) avec succès`);

  return data;
}

async function updateProjectConvocation(
  supabase: SupabaseClient,
  projectId: string,
  convocationUrl: string
): Promise<void> {
  log('info', 'Mise à jour URL convocation du projet', { projectId });

  const { error } = await supabase
    .from('projects')
    .update({ pdf_convocation: convocationUrl })
    .eq('id', projectId);

  if (error) {
    log('error', 'Erreur lors de la mise à jour de l\'URL convocation', { error });
    throw new Error(`Erreur mise à jour URL convocation: ${error.message}`);
  }

  log('info', 'URL convocation mise à jour avec succès');
}

// ============================================================================
// PDF GENERATOR
// ============================================================================

async function generateMockConvocationPdf(
  supabase: SupabaseClient,
  convocationData: ConvocationData,
  projectId: string,
  prj: string
): Promise<{ blob: Blob; base64: string; filename: string; publicUrl: string }> {
  log('warn', 'Génération d\'un PDF MOCK pour tests', { prj });

  const mockPdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
>>
>>
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
50 750 Td
(CONVOCATION - ${prj}) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000317 00000 n
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
410
%%EOF`;

  const pdfBlob = new Blob([mockPdfContent], { type: 'application/pdf' });
  const base64 = await blobToBase64(pdfBlob);

  const filename = generatePdfFilename(prj, 'convocation');
  const filePath = `convocation/${filename}`;

  const { error: uploadError } = await supabase.storage
    .from('pdfs')
    .upload(filePath, pdfBlob, {
      contentType: 'application/pdf',
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Erreur upload PDF: ${uploadError.message}`);
  }

  const { data: urlData } = supabase.storage.from('pdfs').getPublicUrl(filePath);
  const publicUrl = `${urlData.publicUrl}?v=${Date.now()}`;

  return {
    blob: pdfBlob,
    base64,
    filename,
    publicUrl,
  };
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

function verifyAuthentication(req: Request): boolean {
  const netsuiteSecret = req.headers.get('x-netsuite-secret');
  const expectedSecret = Deno.env.get('NETSUITE_WEBHOOK_SECRET');

  if (!expectedSecret) {
    log('error', 'NETSUITE_WEBHOOK_SECRET non configuré dans les secrets Supabase');
    return false;
  }

  if (!netsuiteSecret) {
    log('warn', 'Header x-netsuite-secret manquant dans la requête');
    return false;
  }

  const isValid = netsuiteSecret === expectedSecret;

  if (!isValid) {
    log('warn', 'Secret NetSuite invalide');
  }

  return isValid;
}

serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-netsuite-secret',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return createErrorResponse(
      'Méthode non autorisée. Utilisez POST.',
      ErrorCode.INVALID_JSON
    );
  }

  log('info', '========================================');
  log('info', 'Nouvelle requête webhook NetSuite reçue');
  log('info', '========================================');

  try {
    log('info', 'Étape 1 : Vérification de l\'authentification');

    if (!verifyAuthentication(req)) {
      return createErrorResponse(
        'Non autorisé. Secret NetSuite invalide ou manquant.',
        ErrorCode.UNAUTHORIZED
      );
    }

    log('info', '✓ Authentification validée');

    log('info', 'Étape 2 : Parsing du JSON NetSuite');

    let netsuiteData: NetSuiteJobData;

    try {
      netsuiteData = await req.json();
    } catch (error) {
      log('error', 'Erreur de parsing JSON', { error });
      return createErrorResponse(
        'JSON invalide dans la requête',
        ErrorCode.INVALID_JSON,
        { parseError: error.message }
      );
    }

    log('info', '✓ JSON parsé avec succès', {
      id: netsuiteData.id,
      companyname: netsuiteData.companyname,
    });

    log('info', 'Étape 3 : Validation des données NetSuite');

    const validation = validateNetSuiteData(netsuiteData);

    if (!validation.valid) {
      log('error', 'Données NetSuite invalides', { missing: validation.missing });
      return createErrorResponse(
        'Champs obligatoires manquants',
        ErrorCode.MISSING_REQUIRED_FIELD,
        { missing: validation.missing }
      );
    }

    log('info', '✓ Données NetSuite validées');

    log('info', 'Étape 4 : Parsing complet des données NetSuite');

    const parsedData = parseNetSuiteData(netsuiteData);

    log('info', '✓ Données parsées avec succès');

    log('info', 'Étape 5 : Création du client Supabase');

    const supabase = createSupabaseClient();

    log('info', '✓ Client Supabase créé');

    log('info', 'Étape 6 : Gestion de l\'entreprise cliente');

    const entrepriseData = mapToEntreprise(parsedData);
    const entrepriseId = await findOrCreateEntreprise(supabase, entrepriseData);

    log('info', '✓ Entreprise gérée avec succès', { entrepriseId });

    log('info', 'Étape 7 : Recherche du logiciel');

    const logicielId = await findLogicielByName(supabase, parsedData.logicielName);

    if (logicielId) {
      log('info', '✓ Logiciel trouvé', { logicielId });
    } else {
      log('warn', '⚠ Logiciel non trouvé dans la base, le projet sera créé sans logiciel associé');
    }

    log('info', 'Étape 8 : Gestion du projet');

    const projectData = mapToProject(parsedData, entrepriseId, logicielId);
    const { project, isNew } = await upsertProject(supabase, projectData);

    log('info', isNew ? '✓ Nouveau projet créé' : '✓ Projet existant mis à jour', {
      projectId: project.id,
      prj: project.prj,
    });

    log('info', 'Étape 9 : Gestion des événements de formation');

    if (!isNew) {
      await deleteProjectEvenements(supabase, project.id!);
    }

    const evenementsData = mapToEvenements(
      parsedData,
      project.id!,
      entrepriseId,
      parsedData.logicielName || 'Formation'
    );

    const evenements = await createEvenements(supabase, evenementsData);

    log('info', `✓ ${evenements.length} événement(s) créé(s)`);

    log('info', 'Étape 10 : Génération du PDF de convocation');

    const { data: entrepriseComplete } = await supabase
      .from('entreprise')
      .select('*')
      .eq('id', entrepriseId)
      .single();

    const convocationData = mapToConvocationData(
      parsedData,
      project,
      entrepriseComplete!,
      parsedData.logicielName || 'Formation'
    );

    const pdfResult = await generateMockConvocationPdf(supabase, convocationData, project.id!, project.prj || 'PROJET');

    log('info', '✓ PDF de convocation généré', {
      filename: pdfResult.filename,
      url: pdfResult.publicUrl,
    });

    log('info', 'Étape 11 : Mise à jour du projet avec l\'URL du PDF');

    await updateProjectConvocation(supabase, project.id!, pdfResult.publicUrl);

    log('info', '✓ Projet mis à jour avec l\'URL de la convocation');

    log('info', 'Étape 12 : Préparation de la réponse');

    const response: WebhookSuccessResponse = {
      success: true,
      project_id: project.id!,
      prj: project.prj || '',
      netsuite_id: project.netsuite_id,
      convocation: {
        pdf_base64: pdfResult.base64,
        filename: pdfResult.filename,
        url: pdfResult.publicUrl,
      },
      entities_created: {
        entreprise_id: entrepriseId,
        project_id: project.id!,
        evenements_count: evenements.length,
      },
      message: isNew
        ? 'Projet créé avec succès et convocation générée'
        : 'Projet mis à jour avec succès et convocation régénérée',
    };

    log('info', '========================================');
    log('info', '✅ Webhook traité avec succès');
    log('info', '========================================');

    return new Response(JSON.stringify(response, null, 2), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    log('error', '❌ Erreur lors du traitement du webhook', {
      error: error.message,
      stack: error.stack,
    });

    return createErrorResponse(
      `Erreur interne: ${error.message}`,
      ErrorCode.UNKNOWN_ERROR,
      {
        error: error.message,
        stack: error.stack,
      }
    );
  }
});
