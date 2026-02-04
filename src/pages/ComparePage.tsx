import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { Plus, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ComparisonChart } from '@/components/spectrum/ComparisonChart';
import { getSample, getSamplesByExperiment, getSpectralData } from '@/db/api';
import { useToast } from '@/hooks/use-toast';
import type { Sample, SpectralDataPoint } from '@/types/spectrum';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export default function ComparePage() {
  const { sampleId } = useParams<{ sampleId: string }>();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [currentSample, setCurrentSample] = useState<Sample | null>(null);
  const [availableSamples, setAvailableSamples] = useState<Sample[]>([]);
  const [selectedSamples, setSelectedSamples] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState<
    Array<{ sample: Sample; data: SpectralDataPoint[] }>
  >([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (sampleId) {
      loadData();
    }
  }, [sampleId]);

  async function loadData() {
    try {
      setLoading(true);
      const sample = await getSample(sampleId!);

      if (!sample) {
        throw new Error('Sample not found');
      }

      setCurrentSample(sample);

      // Load other samples from the same experiment
      const samples = await getSamplesByExperiment(sample.experiment_id);
      const otherSamples = samples.filter(s => s.id !== sampleId);
      setAvailableSamples(otherSamples);

      // Load current sample data
      const currentData = await getSpectralData(sampleId!);
      setComparisonData([{ sample, data: currentData }]);
      setSelectedSamples([sampleId!]);
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

  async function handleAddSamples(sampleIds: string[]) {
    try {
      const newSamples = await Promise.all(
        sampleIds.map(async (id) => {
          const sample = await getSample(id);
          const data = await getSpectralData(id);
          return { sample: sample!, data };
        })
      );

      setComparisonData(prev => [...prev, ...newSamples]);
      setSelectedSamples(prev => [...prev, ...sampleIds]);
      setDialogOpen(false);

      toast({
        title: 'Samples added',
        description: `Added ${sampleIds.length} sample(s) for comparison`
      });
    } catch (error) {
      console.error('Failed to add samples:', error);
      toast({
        title: 'Error adding samples',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    }
  }

  function calculateComparison() {
    if (comparisonData.length < 2) return null;

    const sample1 = comparisonData[0];
    const sample2 = comparisonData[1];

    // Find peak positions
    const peak1 = Math.max(...sample1.data.map(d => d.intensity));
    const peak2 = Math.max(...sample2.data.map(d => d.intensity));

    const peak1Wavelength = sample1.data.find(d => d.intensity === peak1)?.wavelength || 0;
    const peak2Wavelength = sample2.data.find(d => d.intensity === peak2)?.wavelength || 0;

    const spectralShift = peak2Wavelength - peak1Wavelength;
    const intensityRatio = peak2 / peak1;

    return {
      spectralShift,
      intensityRatio,
      peak1Wavelength,
      peak2Wavelength
    };
  }

  const comparison = calculateComparison();

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-8">
        <Skeleton className="h-10 w-64 bg-muted" />
        <Skeleton className="h-96 bg-muted" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light tracking-tight">Sample Comparison</h1>
          <p className="text-muted-foreground mt-2">
            Compare spectral characteristics across samples
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={availableSamples.length === 0}>
              <Plus className="w-4 h-4 mr-2" />
              Add Samples
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Select Samples to Compare</DialogTitle>
              <DialogDescription>
                Choose samples from the same experiment to add to the comparison
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {availableSamples
                .filter(s => !selectedSamples.includes(s.id))
                .map(sample => (
                  <div key={sample.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={sample.id}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          handleAddSamples([sample.id]);
                        }
                      }}
                    />
                    <Label htmlFor={sample.id} className="cursor-pointer">
                      {sample.name}
                      {sample.modification_type && (
                        <span className="text-muted-foreground ml-2">
                          ({sample.modification_type})
                        </span>
                      )}
                    </Label>
                  </div>
                ))}
              {availableSamples.filter(s => !selectedSamples.includes(s.id)).length === 0 && (
                <p className="text-sm text-muted-foreground">No more samples available</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <ComparisonChart samples={comparisonData} height={500} />

      {comparison && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Spectral Shift
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Peak Shift (Δλ)</p>
                  <p className="text-3xl font-light">
                    {comparison.spectralShift > 0 ? '+' : ''}
                    {comparison.spectralShift.toFixed(2)} nm
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {comparisonData[0].sample.name}
                    </p>
                    <p className="text-lg font-light">{comparison.peak1Wavelength.toFixed(2)} nm</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {comparisonData[1].sample.name}
                    </p>
                    <p className="text-lg font-light">{comparison.peak2Wavelength.toFixed(2)} nm</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Intensity Change</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Intensity Ratio</p>
                  <p className="text-3xl font-light">{comparison.intensityRatio.toFixed(3)}</p>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    {comparison.intensityRatio > 1
                      ? 'Luminescence Enhancement'
                      : comparison.intensityRatio < 1
                        ? 'Luminescence Quenching'
                        : 'No Change'}
                  </p>
                  <p className="text-lg font-light">
                    {Math.abs((comparison.intensityRatio - 1) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {comparisonData.length === 1 && (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <TrendingUp className="w-16 h-16 mx-auto text-muted-foreground" />
            <div>
              <h3 className="text-lg font-medium">Add samples to compare</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Select additional samples to analyze spectral differences
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
