import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowRight, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SpectrumChart } from '@/components/spectrum/SpectrumChart';
import { PreprocessingControls } from '@/components/spectrum/PreprocessingControls';
import { getSample, getSpectralData } from '@/db/api';
import { preprocessSpectrum } from '@/utils/scientific';
import { exportToCSV } from '@/utils/fileParser';
import { useToast } from '@/hooks/use-toast';
import type { Sample, SpectralDataPoint, PreprocessingParams } from '@/types/spectrum';
import { Skeleton } from '@/components/ui/skeleton';

export default function PreprocessPage() {
  const { sampleId } = useParams<{ sampleId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [sample, setSample] = useState<Sample | null>(null);
  const [rawData, setRawData] = useState<SpectralDataPoint[]>([]);
  const [processedData, setProcessedData] = useState<SpectralDataPoint[]>([]);
  const [params, setParams] = useState<PreprocessingParams>({});

  useEffect(() => {
    if (sampleId) {
      loadData();
    }
  }, [sampleId]);

  useEffect(() => {
    if (rawData.length > 0) {
      applyPreprocessing();
    }
  }, [params, rawData]);

  async function loadData() {
    try {
      setLoading(true);
      const [sampleData, spectralData] = await Promise.all([
        getSample(sampleId!),
        getSpectralData(sampleId!)
      ]);

      if (!sampleData) {
        throw new Error('Sample not found');
      }

      setSample(sampleData);
      setRawData(spectralData);
      setProcessedData(spectralData);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: 'Error loading data',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }

  function applyPreprocessing() {
    try {
      const processed = preprocessSpectrum(rawData, params);
      setProcessedData(processed);
    } catch (error) {
      console.error('Preprocessing error:', error);
      toast({
        title: 'Preprocessing error',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    }
  }

  function handleExport() {
    if (processedData.length > 0) {
      exportToCSV(processedData, `${sample?.name}_preprocessed.csv`);
      toast({
        title: 'Export successful',
        description: 'Preprocessed data has been downloaded'
      });
    }
  }

  function handleContinue() {
    navigate(`/analysis/${sampleId}`, { state: { processedData, params } });
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-8">
        <Skeleton className="h-10 w-64 bg-muted" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Skeleton className="h-96 bg-muted" />
          </div>
          <Skeleton className="h-96 bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light tracking-tight">Preprocess Data</h1>
          <p className="text-muted-foreground mt-2">
            Apply filters and corrections to {sample?.name}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={handleContinue}>
            Continue to Analysis
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chart */}
        <div className="lg:col-span-2 space-y-6">
          <SpectrumChart data={rawData} title="Raw Spectrum" showLegend={false} />
          <SpectrumChart data={processedData} title="Preprocessed Spectrum" showLegend={false} />
        </div>

        {/* Controls */}
        <div>
          <PreprocessingControls params={params} onChange={setParams} />
        </div>
      </div>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Data Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Data Points</p>
              <p className="text-2xl font-light">{processedData.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Wavelength Range</p>
              <p className="text-2xl font-light">
                {Math.min(...processedData.map(d => d.wavelength)).toFixed(0)} -{' '}
                {Math.max(...processedData.map(d => d.wavelength)).toFixed(0)} nm
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Max Intensity</p>
              <p className="text-2xl font-light">
                {Math.max(...processedData.map(d => d.intensity)).toFixed(4)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Min Intensity</p>
              <p className="text-2xl font-light">
                {Math.min(...processedData.map(d => d.intensity)).toFixed(4)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
