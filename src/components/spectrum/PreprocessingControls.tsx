import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { PreprocessingParams } from '@/types/spectrum';

interface PreprocessingControlsProps {
  params: PreprocessingParams;
  onChange: (params: PreprocessingParams) => void;
}

export function PreprocessingControls({ params, onChange }: PreprocessingControlsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Preprocessing Parameters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Outlier Removal */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="outlier-removal">Remove Outliers</Label>
            <Switch
              id="outlier-removal"
              checked={params.outlier_removal?.enabled || false}
              onCheckedChange={(checked) =>
                onChange({
                  ...params,
                  outlier_removal: {
                    enabled: checked,
                    threshold: params.outlier_removal?.threshold || 3
                  }
                })
              }
            />
          </div>
          {params.outlier_removal?.enabled && (
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                Z-Score Threshold: {params.outlier_removal.threshold}
              </Label>
              <Slider
                value={[params.outlier_removal.threshold]}
                onValueChange={([value]) =>
                  onChange({
                    ...params,
                    outlier_removal: { enabled: true, threshold: value }
                  })
                }
                min={1}
                max={5}
                step={0.5}
              />
            </div>
          )}
        </div>

        {/* Noise Reduction */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="noise-reduction">Noise Reduction (Savitzky-Golay)</Label>
            <Switch
              id="noise-reduction"
              checked={!!params.noise_reduction}
              onCheckedChange={(checked) =>
                onChange({
                  ...params,
                  noise_reduction: checked
                    ? { method: 'savitzky-golay', window_length: 5, polynomial_order: 2 }
                    : undefined
                })
              }
            />
          </div>
          {params.noise_reduction && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  Window Length: {params.noise_reduction.window_length}
                </Label>
                <Slider
                  value={[params.noise_reduction.window_length]}
                  onValueChange={([value]) =>
                    onChange({
                      ...params,
                      noise_reduction: {
                        ...params.noise_reduction!,
                        window_length: value % 2 === 0 ? value + 1 : value
                      }
                    })
                  }
                  min={3}
                  max={15}
                  step={2}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  Polynomial Order: {params.noise_reduction.polynomial_order}
                </Label>
                <Slider
                  value={[params.noise_reduction.polynomial_order]}
                  onValueChange={([value]) =>
                    onChange({
                      ...params,
                      noise_reduction: { ...params.noise_reduction!, polynomial_order: value }
                    })
                  }
                  min={1}
                  max={5}
                  step={1}
                />
              </div>
            </div>
          )}
        </div>

        {/* Baseline Correction */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="baseline-correction">Baseline Correction</Label>
            <Switch
              id="baseline-correction"
              checked={!!params.baseline_correction}
              onCheckedChange={(checked) =>
                onChange({
                  ...params,
                  baseline_correction: checked
                    ? { method: 'polynomial', polynomial_degree: 2 }
                    : undefined
                })
              }
            />
          </div>
          {params.baseline_correction && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Method</Label>
                <Select
                  value={params.baseline_correction.method}
                  onValueChange={(value: 'polynomial' | 'als') =>
                    onChange({
                      ...params,
                      baseline_correction: { ...params.baseline_correction!, method: value }
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="polynomial">Polynomial</SelectItem>
                    <SelectItem value="als">Asymmetric Least Squares</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {params.baseline_correction.method === 'polynomial' && (
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">
                    Polynomial Degree: {params.baseline_correction.polynomial_degree || 2}
                  </Label>
                  <Slider
                    value={[params.baseline_correction.polynomial_degree || 2]}
                    onValueChange={([value]) =>
                      onChange({
                        ...params,
                        baseline_correction: {
                          ...params.baseline_correction!,
                          polynomial_degree: value
                        }
                      })
                    }
                    min={1}
                    max={5}
                    step={1}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Normalization */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="normalization">Normalization</Label>
            <Switch
              id="normalization"
              checked={!!params.normalization}
              onCheckedChange={(checked) =>
                onChange({
                  ...params,
                  normalization: checked ? { method: 'max' } : undefined
                })
              }
            />
          </div>
          {params.normalization && (
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Method</Label>
              <Select
                value={params.normalization.method}
                onValueChange={(value: 'max' | 'area') =>
                  onChange({
                    ...params,
                    normalization: { method: value }
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="max">Max Intensity</SelectItem>
                  <SelectItem value="area">Total Area</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
