import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { ArrowLeft, Calendar, Beaker } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getExperiment, getSamplesByExperiment } from '@/db/api';
import type { Experiment, Sample } from '@/types/spectrum';
import { Skeleton } from '@/components/ui/skeleton';

export default function ExperimentPage() {
  const { experimentId } = useParams<{ experimentId: string }>();
  const [loading, setLoading] = useState(true);
  const [experiment, setExperiment] = useState<Experiment | null>(null);
  const [samples, setSamples] = useState<Sample[]>([]);

  useEffect(() => {
    if (experimentId) {
      loadData();
    }
  }, [experimentId]);

  async function loadData() {
    try {
      setLoading(true);
      const [expData, samplesData] = await Promise.all([
        getExperiment(experimentId!),
        getSamplesByExperiment(experimentId!)
      ]);

      setExperiment(expData);
      setSamples(samplesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-64 bg-muted" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (!experiment) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Experiment not found</p>
        <Link to="/">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link to="/">
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-light tracking-tight">{experiment.name}</h1>
          <p className="text-muted-foreground mt-2 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {new Date(experiment.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {experiment.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{experiment.description}</p>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="text-xl font-medium mb-4">Samples ({samples.length})</h2>
        {samples.length === 0 ? (
          <Card className="p-12">
            <div className="text-center space-y-4">
              <Beaker className="w-16 h-16 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-lg font-medium">No samples yet</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Import data to add samples to this experiment
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {samples.map((sample) => (
              <Link key={sample.id} to={`/preprocess/${sample.id}`}>
                <Card className="h-full hover:border-primary transition-colors cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-lg font-medium">{sample.name}</CardTitle>
                    {sample.modification_type && (
                      <CardDescription>{sample.modification_type}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    {sample.processing_temperature && (
                      <p className="text-sm text-muted-foreground">
                        Temperature: {sample.processing_temperature}°C
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
