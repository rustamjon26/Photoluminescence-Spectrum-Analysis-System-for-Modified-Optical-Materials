import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowRight, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileUploadZone } from '@/components/spectrum/FileUploadZone';
import { parseCSVFile, parseExcelFile } from '@/utils/fileParser';
import { createExperiment, createSample, saveSpectralData } from '@/db/api';
import { useToast } from '@/hooks/use-toast';
import type { FileImportData } from '@/types/spectrum';

export default function ImportPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fileData, setFileData] = useState<FileImportData | null>(null);
  const [experimentName, setExperimentName] = useState('');
  const [experimentDescription, setExperimentDescription] = useState('');
  const [sampleName, setSampleName] = useState('');
  const [modificationType, setModificationType] = useState('');
  const [processingTemp, setProcessingTemp] = useState('');

  async function handleFileSelect(file: File) {
    try {
      setLoading(true);
      let data: FileImportData;

      if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
        data = await parseCSVFile(file);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        data = await parseExcelFile(file);
      } else {
        throw new Error('Unsupported file format');
      }

      setFileData(data);
      setSampleName(data.filename.replace(/\.[^/.]+$/, ''));

      toast({
        title: 'File loaded successfully',
        description: `Loaded ${data.data.length} data points`
      });
    } catch (error) {
      console.error('File parsing error:', error);
      toast({
        title: 'Error loading file',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleImport() {
    if (!fileData || !experimentName || !sampleName) {
      toast({
        title: 'Missing information',
        description: 'Please provide experiment name and sample name',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);

      // Create experiment
      const experiment = await createExperiment(experimentName, experimentDescription);
      
      if (!experiment) {
        throw new Error('Failed to create experiment');
      }

      // Create sample
      const sample = await createSample({
        experiment_id: experiment.id,
        name: sampleName,
        modification_type: modificationType || undefined,
        processing_temperature: processingTemp ? Number(processingTemp) : undefined
      });
      
      if (!sample) {
        throw new Error('Failed to create sample');
      }

      // Save spectral data
      await saveSpectralData(sample.id, fileData.data);

      toast({
        title: 'Import successful',
        description: 'Experiment and sample data have been saved'
      });

      navigate(`/preprocess/${sample.id}`);
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'Import failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-light tracking-tight">Import Data</h1>
        <p className="text-muted-foreground mt-2">
          Upload spectral data files and create a new experiment
        </p>
      </div>

      <div className="space-y-6">
        {/* File Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Upload Spectral Data</CardTitle>
            <CardDescription>
              Select a CSV, TXT, or Excel file containing wavelength and intensity data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUploadZone onFileSelect={handleFileSelect} />
            {fileData && (
              <div className="mt-4 p-4 bg-accent rounded-sm">
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="font-medium">{fileData.filename}</span>
                  <span className="text-muted-foreground">
                    ({fileData.data.length} data points)
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Experiment Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Experiment Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="experiment-name">Experiment Name *</Label>
              <Input
                id="experiment-name"
                placeholder="e.g., ZnO Nanoparticle Doping Study"
                value={experimentName}
                onChange={(e) => setExperimentName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="experiment-description">Description</Label>
              <Textarea
                id="experiment-description"
                placeholder="Brief description of the experiment"
                value={experimentDescription}
                onChange={(e) => setExperimentDescription(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Sample Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Sample Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sample-name">Sample Name *</Label>
              <Input
                id="sample-name"
                placeholder="e.g., ZnO-5%Mn"
                value={sampleName}
                onChange={(e) => setSampleName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="modification-type">Modification Type</Label>
              <Input
                id="modification-type"
                placeholder="e.g., Mn doping, thermal treatment"
                value={modificationType}
                onChange={(e) => setModificationType(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="processing-temp">Processing Temperature (°C)</Label>
              <Input
                id="processing-temp"
                type="number"
                placeholder="e.g., 500"
                value={processingTemp}
                onChange={(e) => setProcessingTemp(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => navigate('/')}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={loading || !fileData}>
            {loading ? 'Importing...' : 'Import & Continue'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
