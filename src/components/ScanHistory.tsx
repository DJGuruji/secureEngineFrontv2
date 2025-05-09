import React, { useState, useEffect } from 'react';
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
}

const ScanHistory: React.FC<ScanHistoryProps> = ({ onViewScan }) => {
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, [page, rowsPerPage]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:8000/api/v1/scan/history`, {
        params: {
          limit: rowsPerPage,
          offset: page * rowsPerPage
        }
      });
      setHistory(response.data);
      setTotalCount(response.data.length);
    } catch (error) {
      console.error('Error fetching scan history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDeleteClick = (scanId: string) => {
    setSelectedScanId(scanId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedScanId) return;

    try {
      await axios.delete(`http://localhost:8000/api/v1/scan/scan/${selectedScanId}`);
      // Refresh the history after deletion
      fetchHistory();
    } catch (error: any) {
      console.error('Error deleting scan:', error);
      // Show error message to user
      alert(error.response?.data?.detail || 'Failed to delete scan. Please try again.');
    } finally {
      setDeleteDialogOpen(false);
      setSelectedScanId(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSelectedScanId(null);
  };

  const getSeverityIcon = (count: number, severity: string) => {
    if (count === 0) return null;
    
    const iconMap = {
      ERROR: <ErrorIcon color="error" />,
      WARNING: <WarningIcon color="warning" />,
      INFO: <InfoIcon color="info" />
    };

    return (
      <Tooltip title={`${count} ${severity}`}>
        <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
          {iconMap[severity as keyof typeof iconMap]}
          <Typography variant="caption" sx={{ ml: 0.5 }}>
            {count}
          </Typography>
        </Box>
      </Tooltip>
    );
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Scan History
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>File Name</TableCell>
              <TableCell>Scan Time</TableCell>
              <TableCell>Security Score</TableCell>
              <TableCell>Vulnerabilities</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {history.map((scan) => (
              <TableRow key={scan.id}>
                <TableCell>{scan.file_name}</TableCell>
                <TableCell>
                  {format(new Date(scan.scan_timestamp), 'PPpp')}
                </TableCell>
                <TableCell>
                  <Chip
                    label={`${scan.security_score}/10`}
                    color={scan.security_score >= 7 ? 'success' : scan.security_score >= 4 ? 'warning' : 'error'}
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {getSeverityIcon(scan.severity_count.ERROR, 'ERROR')}
                    {getSeverityIcon(scan.severity_count.WARNING, 'WARNING')}
                    {getSeverityIcon(scan.severity_count.INFO, 'INFO')}
                  </Box>
                </TableCell>
                <TableCell>
                  {scan.scan_duration.toFixed(2)}s
                </TableCell>
                <TableCell>
                  <Chip
                    label={scan.scan_status}
                    color={scan.scan_status === 'completed' ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => onViewScan(scan.id)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Scan">
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteClick(scan.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={totalCount}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this scan? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ScanHistory; 