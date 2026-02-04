// PDF report generation utilities

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Sample, Peak, FittingResult, AnalysisResult } from '@/types/spectrum';

export interface ReportData {
  experiment_name: string;
  sample: Sample;
  analysis: AnalysisResult;
  chartImage?: string;
}

export function generatePDFReport(reportData: ReportData): void {
  const doc = new jsPDF();
  let yPosition = 20;
  
  // Title
  doc.setFontSize(18);
  doc.text('Photoluminescence Spectrum Analysis Report', 105, yPosition, { align: 'center' });
  yPosition += 15;
  
  // Date
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, yPosition, { align: 'center' });
  yPosition += 15;
  
  // Experiment Information
  doc.setFontSize(14);
  doc.text('Experiment Information', 20, yPosition);
  yPosition += 8;
  
  doc.setFontSize(10);
  doc.text(`Experiment: ${reportData.experiment_name}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Sample: ${reportData.sample.name}`, 20, yPosition);
  yPosition += 6;
  
  if (reportData.sample.modification_type) {
    doc.text(`Modification Type: ${reportData.sample.modification_type}`, 20, yPosition);
    yPosition += 6;
  }
  
  if (reportData.sample.processing_temperature) {
    doc.text(`Processing Temperature: ${reportData.sample.processing_temperature}°C`, 20, yPosition);
    yPosition += 6;
  }
  
  yPosition += 5;
  
  // Preprocessing Parameters
  if (reportData.analysis.preprocessing_params) {
    doc.setFontSize(14);
    doc.text('Preprocessing Methods', 20, yPosition);
    yPosition += 8;
    
    doc.setFontSize(10);
    const params = reportData.analysis.preprocessing_params;
    
    if (params.noise_reduction) {
      doc.text(`Noise Reduction: Savitzky-Golay (window=${params.noise_reduction.window_length}, order=${params.noise_reduction.polynomial_order})`, 20, yPosition);
      yPosition += 6;
    }
    
    if (params.baseline_correction) {
      doc.text(`Baseline Correction: ${params.baseline_correction.method}`, 20, yPosition);
      yPosition += 6;
    }
    
    if (params.normalization) {
      doc.text(`Normalization: ${params.normalization.method}`, 20, yPosition);
      yPosition += 6;
    }
    
    yPosition += 5;
  }
  
  // Statistics
  if (reportData.analysis.statistics) {
    doc.setFontSize(14);
    doc.text('Statistical Analysis', 20, yPosition);
    yPosition += 8;
    
    const stats = reportData.analysis.statistics;
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Parameter', 'Value']],
      body: [
        ['Mean Intensity', stats.mean_intensity.toFixed(4)],
        ['Std Deviation', stats.std_intensity.toFixed(4)],
        ['Max Intensity', stats.max_intensity.toFixed(4)],
        ['Min Intensity', stats.min_intensity.toFixed(4)],
        ['Total Area', stats.total_area.toFixed(4)]
      ],
      theme: 'plain',
      styles: { fontSize: 10 }
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }
  
  // Detected Peaks
  if (reportData.analysis.detected_peaks && reportData.analysis.detected_peaks.length > 0) {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.setFontSize(14);
    doc.text('Detected Peaks', 20, yPosition);
    yPosition += 8;
    
    const peakData = reportData.analysis.detected_peaks.map((peak, idx) => [
      `Peak ${idx + 1}`,
      peak.position.toFixed(2),
      peak.amplitude.toFixed(4),
      peak.fwhm.toFixed(2),
      peak.area.toFixed(4)
    ]);
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Peak', 'Position (nm)', 'Amplitude', 'FWHM (nm)', 'Area']],
      body: peakData,
      theme: 'striped',
      styles: { fontSize: 9 }
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }
  
  // Fitting Results
  if (reportData.analysis.fitting_results) {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.setFontSize(14);
    doc.text('Curve Fitting Results', 20, yPosition);
    yPosition += 8;
    
    doc.setFontSize(10);
    const fitting = reportData.analysis.fitting_results;
    doc.text(`Model: ${fitting.model}`, 20, yPosition);
    yPosition += 6;
    doc.text(`R² (Goodness of Fit): ${fitting.r_squared.toFixed(4)}`, 20, yPosition);
    yPosition += 6;
    doc.text(`RMSE: ${fitting.rmse.toFixed(4)}`, 20, yPosition);
    yPosition += 10;
  }
  
  // Chart Image
  if (reportData.chartImage) {
    if (yPosition > 200) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.setFontSize(14);
    doc.text('Spectrum Visualization', 20, yPosition);
    yPosition += 8;
    
    try {
      doc.addImage(reportData.chartImage, 'PNG', 20, yPosition, 170, 100);
    } catch (error) {
      console.error('Failed to add chart image:', error);
    }
  }
  
  // Conclusions
  doc.addPage();
  yPosition = 20;
  doc.setFontSize(14);
  doc.text('Conclusions', 20, yPosition);
  yPosition += 8;
  
  doc.setFontSize(10);
  doc.text('This report presents the photoluminescence spectrum analysis results.', 20, yPosition);
  yPosition += 6;
  doc.text('The data has been processed and analyzed using standard scientific methods.', 20, yPosition);
  
  // Save PDF
  const filename = `PL_Analysis_${reportData.sample.name}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}
