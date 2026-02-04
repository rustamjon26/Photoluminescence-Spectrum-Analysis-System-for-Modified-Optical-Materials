import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Plus, Beaker, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getExperiments } from '@/db/api';
import type { Experiment } from '@/types/spectrum';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExperiments();
  }, []);

  async function loadExperiments() {
    try {
      const data = await getExperiments();
      setExperiments(data);
    } catch (error) {
      console.error('Failed to load experiments:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Manage your photoluminescence spectrum analysis experiments
          </p>
        </div>
        <Link to="/import">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Experiment
          </Button>
        </Link>
      </div>

      {/* Experiments Grid */}
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4 bg-muted" />
                <Skeleton className="h-4 w-1/2 bg-muted mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : experiments.length === 0 ? (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <Beaker className="w-16 h-16 mx-auto text-muted-foreground" />
            <div>
              <h3 className="text-lg font-medium">No experiments yet</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Get started by creating your first experiment
              </p>
            </div>
            <Link to="/import">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Experiment
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {experiments.map((experiment) => (
            <Link key={experiment.id} to={`/experiment/${experiment.id}`}>
              <Card className="h-full hover:border-primary transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg font-medium">{experiment.name}</CardTitle>
                  <CardDescription className="flex items-center gap-2 text-xs">
                    <Calendar className="w-3 h-3" />
                    {new Date(experiment.created_at).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {experiment.description || 'No description provided'}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
