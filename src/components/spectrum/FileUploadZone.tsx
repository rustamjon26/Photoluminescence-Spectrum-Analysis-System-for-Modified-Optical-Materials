import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  accept?: Record<string, string[]>;
  maxSize?: number;
  className?: string;
}

export function FileUploadZone({
  onFileSelect,
  accept = {
    'text/csv': ['.csv'],
    'text/plain': ['.txt'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'application/vnd.ms-excel': ['.xls']
  },
  maxSize = 10485760,
  className
}: FileUploadZoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'border-2 border-dashed rounded-sm p-12 text-center cursor-pointer transition-colors',
        isDragActive ? 'border-primary bg-accent' : 'border-border hover:border-primary',
        className
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-4">
        <Upload className="w-12 h-12 text-muted-foreground" />
        <div className="space-y-2">
          <p className="text-sm font-medium">
            {isDragActive ? 'Drop file here' : 'Drag and drop file here, or click to select'}
          </p>
          <p className="text-xs text-muted-foreground">
            Supported formats: CSV, TXT, XLSX (Max 10MB)
          </p>
        </div>
        {acceptedFiles.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-primary">
            <FileText className="w-4 h-4" />
            <span>{acceptedFiles[0].name}</span>
          </div>
        )}
      </div>
    </div>
  );
}
