import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FittingControlsProps {
  model: 'gaussian' | 'lorentzian' | 'voigt';
  prominence: number;
  minHeight: number;
  onModelChange: (model: 'gaussian' | 'lorentzian' | 'voigt') => void;
  onProminenceChange: (value: number) => void;
  onMinHeightChange: (value: number) => void;
}

export function FittingControls({
  model,
  prominence,
  minHeight,
  onModelChange,
  onProminenceChange,
  onMinHeightChange
}: FittingControlsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Peak Detection & Fitting</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Model Selection */}
        <div className="space-y-2">
          <Label>Fitting Model</Label>
          <Select value={model} onValueChange={onModelChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gaussian">Gaussian</SelectItem>
              <SelectItem value="lorentzian">Lorentzian</SelectItem>
              <SelectItem value="voigt">Voigt</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Prominence Threshold */}
        <div className="space-y-2">
          <Label className="text-sm">
            Peak Prominence Threshold: {prominence.toFixed(2)}
          </Label>
          <Slider
            value={[prominence]}
            onValueChange={([value]) => onProminenceChange(value)}
            min={0.01}
            max={0.5}
            step={0.01}
          />
          <p className="text-xs text-muted-foreground">
            Minimum prominence required to detect a peak
          </p>
        </div>

        {/* Minimum Height */}
        <div className="space-y-2">
          <Label className="text-sm">
            Minimum Peak Height: {minHeight.toFixed(2)}
          </Label>
          <Slider
            value={[minHeight]}
            onValueChange={([value]) => onMinHeightChange(value)}
            min={0.01}
            max={0.5}
            step={0.01}
          />
          <p className="text-xs text-muted-foreground">
            Minimum intensity required for peak detection
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
