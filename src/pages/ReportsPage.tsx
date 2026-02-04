import { useEffect, useState } from 'react';
import { FileDown, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getExperiments, getSamplesByExperiment, getSpectralData, getLatestAnalysisResult } from '@/db/api';
import { generatePDFReport } from '@/utils/pdfGenerator';
import { exportToCSV, exportToExcel } from '@/utils/fileParser';
import { useToast } from '@/hooks/use-toast';
import type { Experiment, Sample } from '@/types/spectrum';
import { Skeleton } from '@/components/ui/skeleton';

export default function ReportsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [selectedExperiment, setSelectedExperiment] = useState<string>('');
  const [samples, setSamples] = useState<Sample[]>([]);
  const [selectedSample, setSelectedSample] = useState<string>('');

  useEffect(() => {
    loadExperiments();
  }, []);

  useEffect(() => {
    if (selectedExperiment) {
      loadSamples();
    }
  }, [selectedExperiment]);

  async function loadExperiments() {
    try {
      setLoading(true);
      const data = await getExperiments();
      setExperiments(data);
    } catch (error) {
      console.error('Failed to load experiments:', error);
      toast({
        title: 'Error loading experiments',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadSamples() {
    try {
      const data = await getSamplesByExperiment(selectedExperiment);
      setSamples(data);
      setSelectedSample('');
    } catch (error) {
      console.error('Failed to load samples:', error);
      toast({
        title: 'Error loading samples',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    }
  }

  async function handleGeneratePDF() {
    if (!selectedSample) return;

    try {
      const sample = samples.find(s => s.id === selectedSample);
      const experiment = experiments.find(e => e.id === selectedExperiment);
      const analysis = await getLatestAnalysisResult(selectedSample);

      if (!sample || !experiment || !analysis) {
        throw new Error('Missing data for report generation');
      }

      generatePDFReport({
        experiment_name: experiment.name,
        sample,
        analysis
      });

      toast({
        title: 'Report generated',
        description: 'PDF report has been downloaded'
      });
    } catch (error) {
      console.error('Failed to generate report:', error);
      toast({
        title: 'Error generating report',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    }
  }

  async function handleExportCSV() {
    if (!selectedSample) return;

    try {
      const data = await getSpectralData(selectedSample);
      const sample = samples.find(s => s.id === selectedSample);
      exportToCSV(data, `${sample?.name}_data.csv`);

      toast({
        title: 'Export successful',
        description: 'Data exported to CSV'
      });
    } catch (error) {
      console.error('Failed to export:', error);
      toast({
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    }
  }

  async function handleExportExcel() {
    if (!selectedSample) return;

    try {
      const data = await getSpectralData(selectedSample);
      const sample = samples.find(s => s.id === selectedSample);
      exportToExcel(data, `${sample?.name}_data.xlsx`);

      toast({
        title: 'Export successful',
        description: 'Data exported to Excel'
      });
    } catch (error) {
      console.error('Failed to export:', error);
      toast({
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <Skeleton className="h-10 w-64 bg-muted" />
        <Skeleton className="h-96 bg-muted" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-light tracking-tight">Reports & Export</h1>
        <p className="text-muted-foreground mt-2">
          Generate PDF reports and export data for your analysis
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Select Data</CardTitle>
          <CardDescription>Choose an experiment and sample to generate reports</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Experiment</label>
            <Select value={selectedExperiment} onValueChange={setSelectedExperiment}>
              <SelectTrigger>
                <SelectValue placeholder="Select an experiment" />
              </SelectTrigger>
              <SelectContent>
                {experiments.map(exp => (
                  <SelectItem key={exp.id} value={exp.id}>
                    {exp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedExperiment && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Sample</label>
              <Select value={selectedSample} onValueChange={setSelectedSample}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a sample" />
                </SelectTrigger>
                <SelectContent>
                  {samples.map(sample => (
                    <SelectItem key={sample.id} value={sample.id}>
                      {sample.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <FileText className="w-5 h-5" />
              PDF Report
            </CardTitle>
            <CardDescription>
              Generate a comprehensive analysis report in PDF format
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleGeneratePDF} disabled={!selectedSample} className="w-full">
              <FileDown className="w-4 h-4 mr-2" />
              Generate PDF Report
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <FileDown className="w-5 h-5" />
              Data Export
            </CardTitle>
            <CardDescription>Export spectral data in various formats</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              onClick={handleExportCSV}
              disabled={!selectedSample}
              className="w-full"
            >
              Export as CSV
            </Button>
            <Button
              variant="outline"
              onClick={handleExportExcel}
              disabled={!selectedSample}
              className="w-full"
            >
              Export as Excel
            </Button>
          </CardContent>
        </Card>
      </div>

      {experiments.length === 0 && (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <FileText className="w-16 h-16 mx-auto text-muted-foreground" />
            <div>
              <h3 className="text-lg font-medium">No experiments available</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Create an experiment and analyze samples to generate reports
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
