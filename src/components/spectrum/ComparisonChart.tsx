import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Sample, SpectralDataPoint } from '@/types/spectrum';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ComparisonChartProps {
  samples: Array<{
    sample: Sample;
    data: SpectralDataPoint[];
  }>;
  title?: string;
  height?: number;
}

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))'
];

export function ComparisonChart({
  samples,
  title = 'Sample Comparison',
  height = 400
}: ComparisonChartProps) {
  if (samples.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No samples to compare</p>
        </CardContent>
      </Card>
    );
  }

  // Find common wavelength range
  const allWavelengths = samples.flatMap(s => s.data.map(d => d.wavelength));
  const minWavelength = Math.min(...allWavelengths);
  const maxWavelength = Math.max(...allWavelengths);

  // Create unified dataset
  const chartData: any[] = [];
  const step = (maxWavelength - minWavelength) / 500;

  for (let wl = minWavelength; wl <= maxWavelength; wl += step) {
    const dataPoint: any = { wavelength: wl };

    samples.forEach((sample, idx) => {
      // Find closest data point
      const closest = sample.data.reduce((prev, curr) =>
        Math.abs(curr.wavelength - wl) < Math.abs(prev.wavelength - wl) ? curr : prev
      );
      dataPoint[`sample_${idx}`] = closest.intensity;
    });

    chartData.push(dataPoint);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="wavelength"
              label={{ value: 'Wavelength (nm)', position: 'insideBottom', offset: -5 }}
              stroke="hsl(var(--foreground))"
            />
            <YAxis
              label={{ value: 'Intensity (a.u.)', angle: -90, position: 'insideLeft' }}
              stroke="hsl(var(--foreground))"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '4px'
              }}
            />
            <Legend />
            {samples.map((sample, idx) => (
              <Line
                key={idx}
                type="monotone"
                dataKey={`sample_${idx}`}
                stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                dot={false}
                strokeWidth={2}
                name={sample.sample.name}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
