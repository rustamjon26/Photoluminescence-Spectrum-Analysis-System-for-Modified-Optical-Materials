-- Create experiments table
CREATE TABLE experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create samples table
CREATE TABLE samples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID REFERENCES experiments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  modification_type TEXT,
  processing_temperature NUMERIC,
  processing_dose NUMERIC,
  processing_time NUMERIC,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create spectral_data table
CREATE TABLE spectral_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sample_id UUID REFERENCES samples(id) ON DELETE CASCADE,
  wavelength NUMERIC NOT NULL,
  intensity NUMERIC NOT NULL,
  data_index INTEGER NOT NULL
);

-- Create analysis_results table
CREATE TABLE analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sample_id UUID REFERENCES samples(id) ON DELETE CASCADE,
  preprocessing_params JSONB,
  detected_peaks JSONB,
  fitting_results JSONB,
  statistics JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_samples_experiment ON samples(experiment_id);
CREATE INDEX idx_spectral_data_sample ON spectral_data(sample_id);
CREATE INDEX idx_spectral_data_wavelength ON spectral_data(sample_id, wavelength);
CREATE INDEX idx_analysis_results_sample ON analysis_results(sample_id);

-- Enable RLS
ALTER TABLE experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE spectral_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no auth required)
CREATE POLICY "Allow public read access to experiments" ON experiments FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to experiments" ON experiments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to experiments" ON experiments FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to experiments" ON experiments FOR DELETE USING (true);

CREATE POLICY "Allow public read access to samples" ON samples FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to samples" ON samples FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to samples" ON samples FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to samples" ON samples FOR DELETE USING (true);

CREATE POLICY "Allow public read access to spectral_data" ON spectral_data FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to spectral_data" ON spectral_data FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to spectral_data" ON spectral_data FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to spectral_data" ON spectral_data FOR DELETE USING (true);

CREATE POLICY "Allow public read access to analysis_results" ON analysis_results FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to analysis_results" ON analysis_results FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to analysis_results" ON analysis_results FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to analysis_results" ON analysis_results FOR DELETE USING (true);