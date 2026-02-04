import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { SpectralDataPoint } from '@/types/spectrum';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SpectrumChartProps {
  data: SpectralDataPoint[];
  fittedData?: SpectralDataPoint[];
  title?: string;
  showLegend?: boolean;
  height?: number;
}

export function SpectrumChart({
  data,
  fittedData,
  title = 'Photoluminescence Spectrum',
  showLegend = true,
  height = 400
}: SpectrumChartProps) {
  // Combine data for chart
  const chartData = data.map((point, index) => ({
    wavelength: point.wavelength,
    intensity: point.intensity,
    fitted: fittedData?.[index]?.intensity
  }));

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
            {showLegend && <Legend />}
            <Line
              type="monotone"
              dataKey="intensity"
              stroke="hsl(var(--chart-1))"
              dot={false}
              strokeWidth={2}
              name="Observed"
            />
            {fittedData && (
              <Line
                type="monotone"
                dataKey="fitted"
                stroke="hsl(var(--chart-2))"
                dot={false}
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Fitted"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
