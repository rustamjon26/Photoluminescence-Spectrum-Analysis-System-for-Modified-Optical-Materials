// Database API functions for spectrum analysis

import { supabase } from '@/db/supabase';
import type {
  Experiment,
  Sample,
  SpectralDataPoint,
  AnalysisResult,
  PreprocessingParams,
  Peak,
  FittingResult
} from '@/types/spectrum';

// Experiments
export async function createExperiment(name: string, description?: string) {
  const { data, error } = await supabase
    .from('experiments')
    .insert({ name, description } as any)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as Experiment | null;
}

export async function getExperiments() {
  const { data, error } = await supabase
    .from('experiments')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return (data || []) as Experiment[];
}

export async function getExperiment(id: string) {
  const { data, error } = await supabase
    .from('experiments')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  
  if (error) throw error;
  return data as Experiment | null;
}

export async function updateExperiment(id: string, updates: Partial<Experiment>) {
  const updateData: any = { ...updates, updated_at: new Date().toISOString() };
  const { data, error } = await (supabase as any)
    .from('experiments')
    .update(updateData)
    .eq('id', id)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as Experiment | null;
}

export async function deleteExperiment(id: string) {
  const { error } = await supabase
    .from('experiments')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// Samples
export async function createSample(sample: Omit<Sample, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('samples')
    .insert(sample as any)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as Sample | null;
}

export async function getSamplesByExperiment(experimentId: string) {
  const { data, error } = await supabase
    .from('samples')
    .select('*')
    .eq('experiment_id', experimentId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return (data || []) as Sample[];
}

export async function getSample(id: string) {
  const { data, error } = await supabase
    .from('samples')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  
  if (error) throw error;
  return data as Sample | null;
}

export async function updateSample(id: string, updates: Partial<Sample>) {
  const updateData: any = updates;
  const { data, error } = await (supabase as any)
    .from('samples')
    .update(updateData)
    .eq('id', id)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as Sample | null;
}

export async function deleteSample(id: string) {
  const { error } = await supabase
    .from('samples')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// Spectral Data
export async function saveSpectralData(sampleId: string, data: SpectralDataPoint[]) {
  const records = data.map((point, index) => ({
    sample_id: sampleId,
    wavelength: point.wavelength,
    intensity: point.intensity,
    data_index: index
  }));
  
  const { error } = await supabase
    .from('spectral_data')
    .insert(records as any);
  
  if (error) throw error;
}

export async function getSpectralData(sampleId: string) {
  const { data, error } = await supabase
    .from('spectral_data')
    .select('wavelength, intensity')
    .eq('sample_id', sampleId)
    .order('data_index', { ascending: true });
  
  if (error) throw error;
  return (data || []) as SpectralDataPoint[];
}

export async function deleteSpectralData(sampleId: string) {
  const { error } = await supabase
    .from('spectral_data')
    .delete()
    .eq('sample_id', sampleId);
  
  if (error) throw error;
}

// Analysis Results
export async function saveAnalysisResult(
  sampleId: string,
  preprocessingParams?: PreprocessingParams,
  detectedPeaks?: Peak[],
  fittingResults?: FittingResult,
  statistics?: Record<string, number>
) {
  const { data, error } = await supabase
    .from('analysis_results')
    .insert({
      sample_id: sampleId,
      preprocessing_params: preprocessingParams,
      detected_peaks: detectedPeaks,
      fitting_results: fittingResults,
      statistics: statistics
    } as any)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data as AnalysisResult | null;
}

export async function getAnalysisResults(sampleId: string) {
  const { data, error } = await supabase
    .from('analysis_results')
    .select('*')
    .eq('sample_id', sampleId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return (data || []) as AnalysisResult[];
}

export async function getLatestAnalysisResult(sampleId: string) {
  const { data, error } = await supabase
    .from('analysis_results')
    .select('*')
    .eq('sample_id', sampleId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  if (error) throw error;
  return data as AnalysisResult | null;
}

export async function deleteAnalysisResult(id: string) {
  const { error } = await supabase
    .from('analysis_results')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}
