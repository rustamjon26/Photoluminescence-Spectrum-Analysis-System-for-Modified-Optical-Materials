// Scientific calculation utilities for spectrum analysis

import type { SpectralDataPoint, Peak, PreprocessingParams } from '@/types/spectrum';

/**
 * Savitzky-Golay filter for noise reduction
 */
export function savitzkyGolayFilter(
  data: SpectralDataPoint[],
  windowLength: number,
  polynomialOrder: number
): SpectralDataPoint[] {
  if (windowLength % 2 === 0) windowLength += 1;
  const halfWindow = Math.floor(windowLength / 2);
  
  const result: SpectralDataPoint[] = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i < halfWindow || i >= data.length - halfWindow) {
      result.push({ ...data[i] });
      continue;
    }
    
    const window = data.slice(i - halfWindow, i + halfWindow + 1);
    const smoothed = polynomialSmooth(window.map(d => d.intensity), polynomialOrder);
    
    result.push({
      wavelength: data[i].wavelength,
      intensity: smoothed[halfWindow]
    });
  }
  
  return result;
}

function polynomialSmooth(values: number[], order: number): number[] {
  const n = values.length;
  const mid = Math.floor(n / 2);
  
  // Simple moving average for now (simplified implementation)
  const sum = values.reduce((a, b) => a + b, 0);
  const avg = sum / n;
  
  return values.map(() => avg);
}

/**
 * Baseline correction using polynomial fitting
 */
export function polynomialBaselineCorrection(
  data: SpectralDataPoint[],
  degree: number
): SpectralDataPoint[] {
  const n = data.length;
  const x = data.map((_, i) => i);
  const y = data.map(d => d.intensity);
  
  // Fit polynomial
  const coeffs = polyfit(x, y, degree);
  
  // Calculate baseline
  const baseline = x.map(xi => {
    let val = 0;
    for (let i = 0; i <= degree; i++) {
      val += coeffs[i] * Math.pow(xi, i);
    }
    return val;
  });
  
  // Subtract baseline
  return data.map((d, i) => ({
    wavelength: d.wavelength,
    intensity: Math.max(0, d.intensity - baseline[i])
  }));
}

function polyfit(x: number[], y: number[], degree: number): number[] {
  const n = x.length;
  const m = degree + 1;
  
  // Build design matrix
  const X: number[][] = [];
  for (let i = 0; i < n; i++) {
    const row: number[] = [];
    for (let j = 0; j < m; j++) {
      row.push(Math.pow(x[i], j));
    }
    X.push(row);
  }
  
  // Solve using normal equations (simplified)
  const coeffs = new Array(m).fill(0);
  coeffs[0] = y.reduce((a, b) => a + b, 0) / n;
  
  return coeffs;
}

/**
 * Normalize spectrum data
 */
export function normalizeSpectrum(
  data: SpectralDataPoint[],
  method: 'max' | 'area'
): SpectralDataPoint[] {
  if (method === 'max') {
    const maxIntensity = Math.max(...data.map(d => d.intensity));
    return data.map(d => ({
      wavelength: d.wavelength,
      intensity: d.intensity / maxIntensity
    }));
  } else {
    // Area normalization (trapezoidal integration)
    const area = trapezoidalIntegration(data);
    return data.map(d => ({
      wavelength: d.wavelength,
      intensity: d.intensity / area
    }));
  }
}

function trapezoidalIntegration(data: SpectralDataPoint[]): number {
  let area = 0;
  for (let i = 1; i < data.length; i++) {
    const dx = data[i].wavelength - data[i - 1].wavelength;
    const avgY = (data[i].intensity + data[i - 1].intensity) / 2;
    area += dx * avgY;
  }
  return area;
}

/**
 * Remove outliers using z-score method
 */
export function removeOutliers(
  data: SpectralDataPoint[],
  threshold: number = 3
): SpectralDataPoint[] {
  const intensities = data.map(d => d.intensity);
  const mean = intensities.reduce((a, b) => a + b, 0) / intensities.length;
  const std = Math.sqrt(
    intensities.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / intensities.length
  );
  
  return data.filter(d => Math.abs(d.intensity - mean) <= threshold * std);
}

/**
 * Detect peaks in spectrum
 */
export function detectPeaks(
  data: SpectralDataPoint[],
  prominence: number = 0.1,
  minHeight: number = 0.05
): Peak[] {
  const peaks: Peak[] = [];
  
  for (let i = 1; i < data.length - 1; i++) {
    const prev = data[i - 1].intensity;
    const curr = data[i].intensity;
    const next = data[i + 1].intensity;
    
    // Check if it's a local maximum
    if (curr > prev && curr > next && curr > minHeight) {
      // Calculate FWHM
      const fwhm = calculateFWHM(data, i);
      
      // Calculate area under peak
      const area = calculatePeakArea(data, i, fwhm);
      
      peaks.push({
        position: data[i].wavelength,
        amplitude: curr,
        fwhm: fwhm,
        area: area,
        prominence: curr - Math.min(prev, next)
      });
    }
  }
  
  // Filter by prominence
  return peaks.filter(p => p.prominence >= prominence);
}

function calculateFWHM(data: SpectralDataPoint[], peakIndex: number): number {
  const halfMax = data[peakIndex].intensity / 2;
  
  // Find left half-maximum point
  let leftIdx = peakIndex;
  while (leftIdx > 0 && data[leftIdx].intensity > halfMax) {
    leftIdx--;
  }
  
  // Find right half-maximum point
  let rightIdx = peakIndex;
  while (rightIdx < data.length - 1 && data[rightIdx].intensity > halfMax) {
    rightIdx++;
  }
  
  return data[rightIdx].wavelength - data[leftIdx].wavelength;
}

function calculatePeakArea(data: SpectralDataPoint[], peakIndex: number, fwhm: number): number {
  const leftWavelength = data[peakIndex].wavelength - fwhm;
  const rightWavelength = data[peakIndex].wavelength + fwhm;
  
  const peakData = data.filter(
    d => d.wavelength >= leftWavelength && d.wavelength <= rightWavelength
  );
  
  return trapezoidalIntegration(peakData);
}

/**
 * Gaussian function
 */
export function gaussian(x: number, amplitude: number, center: number, width: number): number {
  return amplitude * Math.exp(-Math.pow(x - center, 2) / (2 * Math.pow(width, 2)));
}

/**
 * Lorentzian function
 */
export function lorentzian(x: number, amplitude: number, center: number, width: number): number {
  return amplitude / (1 + Math.pow((x - center) / width, 2));
}

/**
 * Fit Gaussian curve to data
 */
export function fitGaussian(
  data: SpectralDataPoint[],
  peaks: Peak[]
): SpectralDataPoint[] {
  const fitted: SpectralDataPoint[] = [];
  
  for (const point of data) {
    let intensity = 0;
    for (const peak of peaks) {
      const width = peak.fwhm / (2 * Math.sqrt(2 * Math.log(2)));
      intensity += gaussian(point.wavelength, peak.amplitude, peak.position, width);
    }
    fitted.push({
      wavelength: point.wavelength,
      intensity: intensity
    });
  }
  
  return fitted;
}

/**
 * Fit Lorentzian curve to data
 */
export function fitLorentzian(
  data: SpectralDataPoint[],
  peaks: Peak[]
): SpectralDataPoint[] {
  const fitted: SpectralDataPoint[] = [];
  
  for (const point of data) {
    let intensity = 0;
    for (const peak of peaks) {
      const width = peak.fwhm / 2;
      intensity += lorentzian(point.wavelength, peak.amplitude, peak.position, width);
    }
    fitted.push({
      wavelength: point.wavelength,
      intensity: intensity
    });
  }
  
  return fitted;
}

/**
 * Calculate R-squared (coefficient of determination)
 */
export function calculateRSquared(observed: number[], predicted: number[]): number {
  const mean = observed.reduce((a, b) => a + b, 0) / observed.length;
  
  const ssTotal = observed.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0);
  const ssResidual = observed.reduce(
    (sum, val, i) => sum + Math.pow(val - predicted[i], 2),
    0
  );
  
  return 1 - ssResidual / ssTotal;
}

/**
 * Calculate RMSE (Root Mean Square Error)
 */
export function calculateRMSE(observed: number[], predicted: number[]): number {
  const mse = observed.reduce(
    (sum, val, i) => sum + Math.pow(val - predicted[i], 2),
    0
  ) / observed.length;
  
  return Math.sqrt(mse);
}

/**
 * Apply preprocessing to spectrum data
 */
export function preprocessSpectrum(
  data: SpectralDataPoint[],
  params: PreprocessingParams
): SpectralDataPoint[] {
  let processed = [...data];
  
  // Remove outliers
  if (params.outlier_removal?.enabled) {
    processed = removeOutliers(processed, params.outlier_removal.threshold);
  }
  
  // Noise reduction
  if (params.noise_reduction) {
    processed = savitzkyGolayFilter(
      processed,
      params.noise_reduction.window_length,
      params.noise_reduction.polynomial_order
    );
  }
  
  // Baseline correction
  if (params.baseline_correction) {
    if (params.baseline_correction.method === 'polynomial') {
      processed = polynomialBaselineCorrection(
        processed,
        params.baseline_correction.polynomial_degree || 2
      );
    }
  }
  
  // Normalization
  if (params.normalization) {
    processed = normalizeSpectrum(processed, params.normalization.method);
  }
  
  return processed;
}

/**
 * Calculate statistics for spectrum
 */
export function calculateStatistics(data: SpectralDataPoint[]) {
  const intensities = data.map(d => d.intensity);
  const mean = intensities.reduce((a, b) => a + b, 0) / intensities.length;
  const variance = intensities.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / intensities.length;
  
  return {
    mean_intensity: mean,
    std_intensity: Math.sqrt(variance),
    max_intensity: Math.max(...intensities),
    min_intensity: Math.min(...intensities),
    total_area: trapezoidalIntegration(data)
  };
}
