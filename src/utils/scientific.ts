// Scientific calculation utilities for spectrum analysis

import type {
  SpectralDataPoint,
  Peak,
  PreprocessingParams,
} from "@/types/spectrum";

/**
 * Savitzky-Golay filter for noise reduction
 * Note: This implements a simplified convolution approach (Moving Average) which acts as a low-pass filter.
 * For true SG smoothing with higher polynomial orders, pre-computed coefficients would be required.
 */
export function savitzkyGolayFilter(
  data: SpectralDataPoint[],
  windowLength: number,
  _polynomialOrder: number,
): SpectralDataPoint[] {
  // Ensure window length is odd
  if (windowLength % 2 === 0) windowLength += 1;
  const halfWindow = Math.floor(windowLength / 2);

  const result: SpectralDataPoint[] = [];

  for (let i = 0; i < data.length; i++) {
    let sum = 0;
    let count = 0;

    // Handle edges by simply averaging available neighbors
    for (let j = -halfWindow; j <= halfWindow; j++) {
      if (i + j >= 0 && i + j < data.length) {
        sum += data[i + j].intensity;
        count++;
      }
    }

    result.push({
      wavelength: data[i].wavelength,
      intensity: sum / count,
    });
  }

  return result;
}

/**
 * Polynomial fitting using Least Squares method (Matrix solution)
 * Solves the system: (X^T * X) * a = X^T * Y
 */
function polyfit(x: number[], y: number[], degree: number): number[] {
  const n = x.length;
  const k = degree + 1;

  // 1. Initialize Matrix A (k x k) and Vector B (k)
  const A = Array(k)
    .fill(0)
    .map(() => Array(k).fill(0));
  const B = Array(k).fill(0);

  // 2. Build the Normal Equations
  for (let i = 0; i < n; i++) {
    const valX = x[i];
    const valY = y[i];

    for (let r = 0; r < k; r++) {
      // Build Vector B
      B[r] += valY * Math.pow(valX, r);

      // Build Matrix A (Symmetric)
      for (let c = 0; c < k; c++) {
        A[r][c] += Math.pow(valX, r + c);
      }
    }
  }

  // 3. Solve linear system A * coeffs = B using Gaussian Elimination
  return gaussianElimination(A, B);
}

/**
 * Gaussian Elimination with Partial Pivoting to solve Ax = B
 */
function gaussianElimination(A: number[][], B: number[]): number[] {
  const n = B.length;

  for (let i = 0; i < n; i++) {
    // Pivot selection
    let maxEl = Math.abs(A[i][i]);
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(A[k][i]) > maxEl) {
        maxEl = Math.abs(A[k][i]);
        maxRow = k;
      }
    }

    // Swap rows
    for (let k = i; k < n; k++) {
      const tmp = A[maxRow][k];
      A[maxRow][k] = A[i][k];
      A[i][k] = tmp;
    }
    const tmp = B[maxRow];
    B[maxRow] = B[i];
    B[i] = tmp;

    // Eliminate rows below
    for (let k = i + 1; k < n; k++) {
      const c = -A[k][i] / A[i][i];
      for (let j = i; j < n; j++) {
        if (i === j) {
          A[k][j] = 0;
        } else {
          A[k][j] += c * A[i][j];
        }
      }
      B[k] += c * B[i];
    }
  }

  // Back substitution
  const x = new Array(n).fill(0);
  for (let i = n - 1; i > -1; i--) {
    let sum = 0;
    for (let j = i + 1; j < n; j++) {
      sum += A[i][j] * x[j];
    }
    x[i] = (B[i] - sum) / A[i][i];
  }
  return x;
}

/**
 * Baseline correction using polynomial fitting
 */
export function polynomialBaselineCorrection(
  data: SpectralDataPoint[],
  degree: number,
): SpectralDataPoint[] {
  if (data.length === 0) return data;

  // IMPORTANT: Use indices as x-values instead of wavelengths to prevent
  // numerical overflow/instability with high powers (e.g. 500nm^5)
  const x = data.map((_, i) => i);
  const y = data.map((d) => d.intensity);

  // Fit polynomial to find the baseline
  const coeffs = polyfit(x, y, degree);

  // Calculate baseline curve
  const baseline = x.map((xi) => {
    let val = 0;
    for (let i = 0; i < coeffs.length; i++) {
      val += coeffs[i] * Math.pow(xi, i);
    }
    return val;
  });

  // Subtract baseline from original intensity
  return data.map((d, i) => ({
    wavelength: d.wavelength,
    intensity: Math.max(0, d.intensity - baseline[i]),
  }));
}

/**
 * Normalize spectrum data
 */
export function normalizeSpectrum(
  data: SpectralDataPoint[],
  method: "max" | "area",
): SpectralDataPoint[] {
  if (data.length === 0) return data;

  if (method === "max") {
    const maxIntensity = Math.max(...data.map((d) => d.intensity));
    if (maxIntensity === 0) return data; // Avoid division by zero

    return data.map((d) => ({
      wavelength: d.wavelength,
      intensity: d.intensity / maxIntensity,
    }));
  } else {
    // Area normalization (trapezoidal integration)
    const area = trapezoidalIntegration(data);
    if (area === 0) return data;

    return data.map((d) => ({
      wavelength: d.wavelength,
      intensity: d.intensity / area,
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
  threshold: number = 3,
): SpectralDataPoint[] {
  if (data.length === 0) return data;

  const intensities = data.map((d) => d.intensity);
  const mean = intensities.reduce((a, b) => a + b, 0) / intensities.length;

  // Standard Deviation
  const variance =
    intensities.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
    intensities.length;
  const std = Math.sqrt(variance);

  if (std === 0) return data;

  return data.filter((d) => Math.abs(d.intensity - mean) <= threshold * std);
}

/**
 * Detect peaks in spectrum using simple local maxima algorithm
 */
export function detectPeaks(
  data: SpectralDataPoint[],
  prominence: number = 0.1,
  minHeight: number = 0.05,
): Peak[] {
  const peaks: Peak[] = [];

  for (let i = 1; i < data.length - 1; i++) {
    const prev = data[i - 1].intensity;
    const curr = data[i].intensity;
    const next = data[i + 1].intensity;

    // Check if it's a local maximum
    if (curr > prev && curr > next && curr >= minHeight) {
      // Calculate FWHM (Full Width at Half Maximum)
      const fwhm = calculateFWHM(data, i);

      // Calculate approximate area under peak
      const area = calculatePeakArea(data, i, fwhm);

      // Simple prominence approximation (height above lowest neighbor)
      const simpleProminence = curr - Math.min(prev, next);

      peaks.push({
        position: data[i].wavelength,
        amplitude: curr,
        fwhm: fwhm,
        area: area,
        prominence: simpleProminence,
      });
    }
  }

  // Filter by prominence threshold
  return peaks.filter((p) => p.prominence >= prominence);
}

function calculateFWHM(data: SpectralDataPoint[], peakIndex: number): number {
  const peakIntensity = data[peakIndex].intensity;
  const halfMax = peakIntensity / 2;

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

function calculatePeakArea(
  data: SpectralDataPoint[],
  peakIndex: number,
  fwhm: number,
): number {
  const currentWavelength = data[peakIndex].wavelength;
  const leftWavelength = currentWavelength - fwhm;
  const rightWavelength = currentWavelength + fwhm;

  const peakData = data.filter(
    (d) => d.wavelength >= leftWavelength && d.wavelength <= rightWavelength,
  );

  return trapezoidalIntegration(peakData);
}

/**
 * Gaussian function definition
 */
export function gaussian(
  x: number,
  amplitude: number,
  center: number,
  width: number,
): number {
  if (width === 0) return 0;
  return (
    amplitude * Math.exp(-Math.pow(x - center, 2) / (2 * Math.pow(width, 2)))
  );
}

/**
 * Lorentzian function definition
 */
export function lorentzian(
  x: number,
  amplitude: number,
  center: number,
  width: number,
): number {
  if (width === 0) return 0;
  return amplitude / (1 + Math.pow((x - center) / width, 2));
}

/**
 * Fit Gaussian curves to data based on detected peaks
 */
export function fitGaussian(
  data: SpectralDataPoint[],
  peaks: Peak[],
): SpectralDataPoint[] {
  const fitted: SpectralDataPoint[] = [];

  for (const point of data) {
    let intensity = 0;
    for (const peak of peaks) {
      // Standard deviation sigma related to FWHM: FWHM = 2.355 * sigma
      const sigma = peak.fwhm / 2.355;
      intensity += gaussian(
        point.wavelength,
        peak.amplitude,
        peak.position,
        sigma,
      );
    }
    fitted.push({
      wavelength: point.wavelength,
      intensity: intensity,
    });
  }

  return fitted;
}

/**
 * Fit Lorentzian curves to data based on detected peaks
 */
export function fitLorentzian(
  data: SpectralDataPoint[],
  peaks: Peak[],
): SpectralDataPoint[] {
  const fitted: SpectralDataPoint[] = [];

  for (const point of data) {
    let intensity = 0;
    for (const peak of peaks) {
      const halfWidth = peak.fwhm / 2;
      intensity += lorentzian(
        point.wavelength,
        peak.amplitude,
        peak.position,
        halfWidth,
      );
    }
    fitted.push({
      wavelength: point.wavelength,
      intensity: intensity,
    });
  }

  return fitted;
}

/**
 * Calculate R-squared (coefficient of determination)
 */
export function calculateRSquared(
  observed: number[],
  predicted: number[],
): number {
  if (observed.length === 0) return 0;
  const mean = observed.reduce((a, b) => a + b, 0) / observed.length;

  const ssTotal = observed.reduce(
    (sum, val) => sum + Math.pow(val - mean, 2),
    0,
  );
  const ssResidual = observed.reduce(
    (sum, val, i) => sum + Math.pow(val - predicted[i], 2),
    0,
  );

  if (ssTotal === 0) return 0;
  return 1 - ssResidual / ssTotal;
}

/**
 * Calculate RMSE (Root Mean Square Error)
 */
export function calculateRMSE(observed: number[], predicted: number[]): number {
  if (observed.length === 0) return 0;
  const mse =
    observed.reduce((sum, val, i) => sum + Math.pow(val - predicted[i], 2), 0) /
    observed.length;

  return Math.sqrt(mse);
}

/**
 * Apply preprocessing pipeline to spectrum data
 */
export function preprocessSpectrum(
  data: SpectralDataPoint[],
  params: PreprocessingParams,
): SpectralDataPoint[] {
  let processed = [...data];

  // 1. Remove outliers
  if (params.outlier_removal?.enabled) {
    processed = removeOutliers(processed, params.outlier_removal.threshold);
  }

  // 2. Noise reduction
  if (params.noise_reduction) {
    processed = savitzkyGolayFilter(
      processed,
      params.noise_reduction.window_length,
      params.noise_reduction.polynomial_order,
    );
  }

  // 3. Baseline correction
  if (params.baseline_correction) {
    if (params.baseline_correction.method === "polynomial") {
      processed = polynomialBaselineCorrection(
        processed,
        params.baseline_correction.polynomial_degree || 2,
      );
    }
  }

  // 4. Normalization
  if (params.normalization) {
    processed = normalizeSpectrum(processed, params.normalization.method);
  }

  return processed;
}

/**
 * Calculate basic statistics for spectrum
 */
export function calculateStatistics(data: SpectralDataPoint[]) {
  if (data.length === 0) {
    return {
      mean_intensity: 0,
      std_intensity: 0,
      max_intensity: 0,
      min_intensity: 0,
      total_area: 0,
    };
  }

  const intensities = data.map((d) => d.intensity);
  const mean = intensities.reduce((a, b) => a + b, 0) / intensities.length;

  const variance =
    intensities.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
    intensities.length;
  const std = Math.sqrt(variance);

  return {
    mean_intensity: mean,
    std_intensity: std,
    max_intensity: Math.max(...intensities),
    min_intensity: Math.min(...intensities),
    total_area: trapezoidalIntegration(data),
  };
}
