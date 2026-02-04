// File parsing utilities

import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { FileImportData, SpectralDataPoint } from "@/types/spectrum";

/**
 * Parse CSV or TXT file
 */
export async function parseCSVFile(file: File): Promise<FileImportData> {
  return new Promise((resolve, reject) => {
    Papa.parse<string[]>(file, {
      complete: (results) => {
        try {
          const data = parseSpectralData(results.data as string[][]);
          resolve({
            filename: file.name,
            data: data,
          });
        } catch (error) {
          reject(error);
        }
      },
      error: (error: Error) => {
        reject(error);
      },
    });
  });
}

/**
 * Parse Excel file
 */
export async function parseExcelFile(file: File): Promise<FileImportData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to array of arrays
        const rawData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
        }) as unknown[][];

        const spectralData = parseSpectralData(rawData as string[][]);

        resolve({
          filename: file.name,
          data: spectralData,
        });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parse spectral data from array of arrays
 */
function parseSpectralData(rawData: string[][]): SpectralDataPoint[] {
  const data: SpectralDataPoint[] = [];

  // Skip header row if present
  let startRow = 0;
  if (rawData.length > 0 && isNaN(Number(rawData[0][0]))) {
    startRow = 1;
  }

  for (let i = startRow; i < rawData.length; i++) {
    const row = rawData[i];
    if (row.length < 2) continue;

    const wavelength = Number(row[0]);
    const intensity = Number(row[1]);

    if (!isNaN(wavelength) && !isNaN(intensity)) {
      data.push({ wavelength, intensity });
    }
  }

  if (data.length === 0) {
    throw new Error("No valid spectral data found in file");
  }

  // Sort by wavelength
  data.sort((a, b) => a.wavelength - b.wavelength);

  return data;
}

/**
 * Export spectral data to CSV
 */
export function exportToCSV(data: SpectralDataPoint[], filename: string): void {
  const csv = Papa.unparse({
    fields: ["Wavelength (nm)", "Intensity (a.u.)"],
    data: data.map((d) => [d.wavelength, d.intensity]),
  });

  downloadFile(csv, filename, "text/csv");
}

/**
 * Export data to Excel
 */
export function exportToExcel(
  data: SpectralDataPoint[],
  filename: string,
): void {
  const worksheet = XLSX.utils.json_to_sheet(
    data.map((d) => ({
      "Wavelength (nm)": d.wavelength,
      "Intensity (a.u.)": d.intensity,
    })),
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Spectral Data");

  XLSX.writeFile(workbook, filename);
}

/**
 * Helper function to download file
 */
function downloadFile(
  content: string,
  filename: string,
  mimeType: string,
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
