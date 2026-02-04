import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router';
import { ArrowRight, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SpectrumChart } from '@/components/spectrum/SpectrumChart';
import { FittingControls } from '@/components/spectrum/FittingControls';
import { PeakTable } from '@/components/spectrum/PeakTable';
import { getSample, getSpectralData, saveAnalysisResult } from '@/db/api';
import {
  detectPeaks,
  fitGaussian,
  fitLorentzian,
  calculateRSquared,
  calculateRMSE,
  calculateStatistics
} from '@/utils/scientific';
import { useToast } from '@/hooks/use-toast';
import type {
  Sample,
  SpectralDataPoint,
  PreprocessingParams,
  Peak,
  FittingResult
} from '@/types/spectrum';
import { Skeleton } from '@/components/ui/skeleton';

export default function AnalysisPage() {
  const { sampleId } = useParams<{ sampleId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [sample, setSample] = useState<Sample | null>(null);
  const [data, setData] = useState<SpectralDataPoint[]>([]);
  const [preprocessingParams, setPreprocessingParams] = useState<PreprocessingParams>({});

  const [model, setModel] = useState<'gaussian' | 'lorentzian' | 'voigt'>('gaussian');
  const [prominence, setProminence] = useState(0.1);
  const [minHeight, setMinHeight] = useState(0.05);

  const [peaks, setPeaks] = useState<Peak[]>([]);
  const [fittingResult, setFittingResult] = useState<FittingResult | null>(null);

  useEffect(() => {
    if (sampleId) {
      loadData();
    }
  }, [sampleId]);

  async function loadData() {
    try {
      setLoading(true);
      const sampleData = await getSample(sampleId!);

      if (!sampleData) {
        throw new Error('Sample not found');
      }

      setSample(sampleData);

      // Use preprocessed data from location state if available
      if (location.state?.processedData) {
        setData(location.state.processedData);
        setPreprocessingParams(location.state.params || {});
      } else {
        const spectralData = await getSpectralData(sampleId!);
        setData(spectralData);
      }
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

  async function handleAnalyze() {
    if (data.length === 0) return;

    try {
      setAnalyzing(true);

      // Detect peaks
      const detectedPeaks = detectPeaks(data, prominence, minHeight);
      setPeaks(detectedPeaks);

      if (detectedPeaks.length === 0) {
        toast({
          title: 'No peaks detected',
          description: 'Try adjusting the detection parameters',
          variant: 'destructive'
        });
        return;
      }

      // Fit curve
      let fittedData: SpectralDataPoint[];
      if (model === 'gaussian') {
        fittedData = fitGaussian(data, detectedPeaks);
      } else if (model === 'lorentzian') {
        fittedData = fitLorentzian(data, detectedPeaks);
      } else {
        // Voigt is approximated as Gaussian for now
        fittedData = fitGaussian(data, detectedPeaks);
      }

      // Calculate goodness of fit
      const observed = data.map(d => d.intensity);
      const predicted = fittedData.map(d => d.intensity);
      const rSquared = calculateRSquared(observed, predicted);
      const rmse = calculateRMSE(observed, predicted);

      const result: FittingResult = {
        model,
        peaks: detectedPeaks,
        r_squared: rSquared,
        rmse,
        fitted_data: fittedData
      };

      setFittingResult(result);

      // Calculate statistics
      const statistics = calculateStatistics(data);

      // Save analysis result
      await saveAnalysisResult(
        sampleId!,
        preprocessingParams,
        detectedPeaks,
        result,
        statistics
      );

      toast({
        title: 'Analysis complete',
        description: `Detected ${detectedPeaks.length} peaks with R² = ${rSquared.toFixed(4)}`
      });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: 'Analysis failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    } finally {
      setAnalyzing(false);
    }
  }

  function handleContinue() {
    navigate(`/compare/${sampleId}`);
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
          <h1 className="text-3xl font-light tracking-tight">Peak Analysis</h1>
          <p className="text-muted-foreground mt-2">
            Detect peaks and fit curves for {sample?.name}
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleAnalyze} disabled={analyzing}>
            <Play className="w-4 h-4 mr-2" />
            {analyzing ? 'Analyzing...' : 'Run Analysis'}
          </Button>
          <Button onClick={handleContinue} disabled={!fittingResult}>
            Continue
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chart and Results */}
        <div className="lg:col-span-2 space-y-6">
          <SpectrumChart
            data={data}
            fittedData={fittingResult?.fitted_data}
            title="Spectrum with Fitted Curve"
          />

          {fittingResult && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">Fitting Quality</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Model</p>
                    <p className="text-xl font-light capitalize">{fittingResult.model}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">R² (Goodness of Fit)</p>
                    <p className="text-xl font-light">{fittingResult.r_squared.toFixed(4)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">RMSE</p>
                    <p className="text-xl font-light">{fittingResult.rmse.toFixed(4)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <PeakTable peaks={peaks} />
        </div>

        {/* Controls */}
        <div>
          <FittingControls
            model={model}
            prominence={prominence}
            minHeight={minHeight}
            onModelChange={setModel}
            onProminenceChange={setProminence}
            onMinHeightChange={setMinHeight}
          />
        </div>
      </div>
    </div>
  );
}
