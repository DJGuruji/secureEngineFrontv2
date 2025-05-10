// src/components/ScanHistory.tsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  TablePagination,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
} from '@mui/material';
import { format } from 'date-fns';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import axios from 'axios';

interface ScanHistoryProps {
  onViewScan: (scanId: string) => void;
}

interface ScanHistoryItem {
  id: string;
  file_name: string;
  scan_timestamp: string;
  security_score: number;
  total_vulnerabilities: number;
  severity_count: {
    ERROR: number;
    WARNING: number;
    INFO: number;
  };
  scan_duration: number;
  scan_status: string;
  scan_metadata?: {
    scan_type: 'CodeQL' | 'ShiftLeft' | 'Semgrep';
    scan_mode?: 'custom' | 'auto';
    language?: string;
  };
}

const ScanHistory: React.FC<ScanHistoryProps> = ({ onViewScan }) => {
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null);

  /* ------------------------------------------------------------------ */
  /* API helpers                                                         */
  /* ------------------------------------------------------------------ */
  const fetchHistory = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get<{
        items: ScanHistoryItem[];
        total: number;
      }>('http://localhost:8000/api/v1/scan/history', {
        params: { limit: rowsPerPage, offset: page * rowsPerPage },
      });

      // Support both paginated (items+total) and bare array responses
      if (Array.isArray(data)) {
        setHistory(data);
        setTotalCount(data.length);
      } else {
        setHistory(data.items);
        setTotalCount(data.total);
      }
    } catch (err) {
      console.error('Error fetching scan history:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteScan = async (scanId: string) => {
    try {
      await axios.delete(
        `http://localhost:8000/api/v1/scan/scan/${scanId}`
      );
      await fetchHistory(); // refresh
    } catch (err: any) {
      console.error('Error deleting scan:', err);
      alert(
        err?.response?.data?.detail ??
          'Failed to delete scan. Please try again.'
      );
    }
  };

  /* ------------------------------------------------------------------ */
  /* Effects                                                             */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage]);

  /* ------------------------------------------------------------------ */
  /* Handlers                                                            */
  /* ------------------------------------------------------------------ */
  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDeleteClick = (scanId: string) => {
    setSelectedScanId(scanId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedScanId) return;
    await deleteScan(selectedScanId);
    setDeleteDialogOpen(false);
    setSelectedScanId(null);
  };

  /* ------------------------------------------------------------------ */
  /* Helpers                                                             */
  /* ------------------------------------------------------------------ */
  const iconMap = {
    ERROR: <ErrorIcon color="error" fontSize="small" />,
    WARNING: <WarningIcon color="warning" fontSize="small" />,
    INFO: <InfoIcon color="info" fontSize="small" />,
  } as const;

  const getSeverityIcon = (
    count: number,
    severity: keyof typeof iconMap
  ) =>
    count ? (
      <Tooltip title={`${count} ${severity}`}>
        <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
          {iconMap[severity]}
          <Typography variant="caption" component="span" sx={{ ml: 0.5 }}>
            {count}
          </Typography>
        </Box>
      </Tooltip>
    ) : null;

  /* ------------------------------------------------------------------ */
  /* Render                                                              */
  /* ------------------------------------------------------------------ */
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Scan History
      </Typography>

      <TableContainer component={Paper} sx={{ position: 'relative' }}>
        {loading && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1,
              bgcolor: 'rgba(255,255,255,0.5)',
            }}
          >
            <CircularProgress size={40} />
          </Box>
        )}

        <Table aria-label="scan history table">
          <TableHead>
            <TableRow>
              <TableCell>File Name</TableCell>
              <TableCell>Scan&nbsp;Type</TableCell>
              <TableCell>Scan&nbsp;Time</TableCell>
              <TableCell>Security&nbsp;Score</TableCell>
              <TableCell>Vulnerabilities</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Status</TableCell>
              <TableCell width={120}>Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {history.map((scan) => (
              <TableRow key={scan.id} hover>
                {/* ---------------- File name ---------------- */}
                <TableCell>{scan.file_name}</TableCell>

                {/* ---------------- Scan type ---------------- */}
                <TableCell>
                  <Tooltip
                    arrow
                    title={
                      <>
                        <Typography
                          variant="caption"
                          component="span"
                          display="block"
                        >
                          {scan.scan_metadata?.scan_type === 'CodeQL'
                            ? 'CodeQL Analysis'
                            : scan.scan_metadata?.scan_type === 'ShiftLeft'
                            ? 'ShiftLeft Analysis'
                            : `Semgrep ${
                                scan.scan_metadata?.scan_mode === 'custom'
                                  ? 'Custom Rules'
                                  : 'Auto Scan'
                              }`}
                        </Typography>

                        {scan.scan_metadata?.language && (
                          <Typography
                            variant="caption"
                            component="span"
                            display="block"
                          >
                            Language: {scan.scan_metadata.language}
                          </Typography>
                        )}

                        {scan.scan_metadata?.scan_mode && (
                          <Typography
                            variant="caption"
                            component="span"
                            display="block"
                          >
                            Mode: {scan.scan_metadata.scan_mode}
                          </Typography>
                        )}
                      </>
                    }
                  >
                    <Chip
                      size="small"
                      label={
                        scan.scan_metadata?.scan_type === 'CodeQL'
                          ? 'CodeQL'
                          : scan.scan_metadata?.scan_type === 'ShiftLeft'
                          ? 'ShiftLeft'
                          : 'Semgrep'
                      }
                      color={
                        scan.scan_metadata?.scan_type === 'CodeQL'
                          ? 'secondary'
                          : scan.scan_metadata?.scan_type === 'ShiftLeft'
                          ? 'success'
                          : 'primary'
                      }
                      sx={{ fontWeight: 'medium' }}
                    />
                  </Tooltip>
                </TableCell>

                {/* ---------------- Timestamp ---------------- */}
                <TableCell>
                  {format(new Date(scan.scan_timestamp), 'PP p')}
                </TableCell>

                {/* ---------------- Score ---------------- */}
                <TableCell>
                  <Chip
                    size="small"
                    label={`${scan.security_score}/10`}
                    color={
                      scan.security_score >= 7
                        ? 'success'
                        : scan.security_score >= 4
                        ? 'warning'
                        : 'error'
                    }
                  />
                </TableCell>

                {/* ---------------- Severities ---------------- */}
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {getSeverityIcon(scan.severity_count.ERROR, 'ERROR')}
                    {getSeverityIcon(scan.severity_count.WARNING, 'WARNING')}
                    {getSeverityIcon(scan.severity_count.INFO, 'INFO')}
                  </Box>
                </TableCell>

                {/* ---------------- Duration ---------------- */}
                <TableCell>{scan.scan_duration.toFixed(2)} s</TableCell>

                {/* ---------------- Status ---------------- */}
                <TableCell>
                  <Chip
                    size="small"
                    label={scan.scan_status}
                    color={scan.scan_status === 'completed' ? 'success' : 'default'}
                  />
                </TableCell>

                {/* ---------------- Actions ---------------- */}
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="View details">
                      <IconButton
                        size="small"
                        onClick={() => onViewScan(scan.id)}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Delete scan">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteClick(scan.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}

            {/* Empty-state row (optional) */}
            {!loading && history.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No scans found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ---------------- Pagination ---------------- */}
      <TablePagination
        component="div"
        page={page}
        count={totalCount}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

      {/* ---------------- Delete dialog ---------------- */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete scan</DialogTitle>
        <DialogContent>
          <Typography component="span">
            Are you sure you want to delete this scan? This action cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteConfirm}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ScanHistory;
