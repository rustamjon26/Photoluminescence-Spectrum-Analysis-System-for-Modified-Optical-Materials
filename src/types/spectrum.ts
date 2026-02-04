// Core data types for spectrum analysis

export interface SpectralDataPoint {
  wavelength: number;
  intensity: number;
}

export interface Sample {
  id: string;
  experiment_id: string;
  name: string;
  modification_type?: string;
  processing_temperature?: number;
  processing_dose?: number;
  processing_time?: number;
  metadata?: Record<string, unknown>;
  created_at: string;
  spectral_data?: SpectralDataPoint[];
}

export interface Experiment {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  samples?: Sample[];
}

export interface Peak {
  position: number;
  amplitude: number;
  fwhm: number;
  area: number;
  prominence: number;
}

export interface FittingResult {
  model: 'gaussian' | 'lorentzian' | 'voigt';
  peaks: Peak[];
  r_squared: number;
  rmse: number;
  fitted_data: SpectralDataPoint[];
}

export interface PreprocessingParams {
  noise_reduction?: {
    method: 'savitzky-golay';
    window_length: number;
    polynomial_order: number;
  };
  baseline_correction?: {
    method: 'polynomial' | 'als';
    polynomial_degree?: number;
    lambda?: number;
    p?: number;
  };
  normalization?: {
    method: 'max' | 'area';
  };
  outlier_removal?: {
    enabled: boolean;
    threshold: number;
  };
}

export interface AnalysisResult {
  id: string;
  sample_id: string;
  preprocessing_params?: PreprocessingParams;
  detected_peaks?: Peak[];
  fitting_results?: FittingResult;
  statistics?: {
    mean_intensity: number;
    std_intensity: number;
    max_intensity: number;
    min_intensity: number;
    total_area: number;
  };
  created_at: string;
}

export interface ComparisonResult {
  sample1: Sample;
  sample2: Sample;
  spectral_shift: number;
  intensity_ratio: number;
  peak_broadening: number;
  quenching_factor?: number;
}

export interface FileImportData {
  filename: string;
  data: SpectralDataPoint[];
  metadata?: {
    sample_name?: string;
    modification_type?: string;
    processing_temperature?: number;
    processing_dose?: number;
    processing_time?: number;
  };
}
