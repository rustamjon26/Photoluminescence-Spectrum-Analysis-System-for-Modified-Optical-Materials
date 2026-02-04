import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Peak } from '@/types/spectrum';

interface PeakTableProps {
  peaks: Peak[];
  title?: string;
}

export function PeakTable({ peaks, title = 'Detected Peaks' }: PeakTableProps) {
  if (peaks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No peaks detected</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Peak #</TableHead>
              <TableHead>Position (nm)</TableHead>
              <TableHead>Amplitude</TableHead>
              <TableHead>FWHM (nm)</TableHead>
              <TableHead>Area</TableHead>
              <TableHead>Prominence</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {peaks.map((peak, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{index + 1}</TableCell>
                <TableCell>{peak.position.toFixed(2)}</TableCell>
                <TableCell>{peak.amplitude.toFixed(4)}</TableCell>
                <TableCell>{peak.fwhm.toFixed(2)}</TableCell>
                <TableCell>{peak.area.toFixed(4)}</TableCell>
                <TableCell>{peak.prominence.toFixed(4)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
