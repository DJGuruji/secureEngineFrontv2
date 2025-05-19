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
  List,
  ListItem,
  ListItemText,
  Link,
  Alert,
  AlertTitle,
  Grid,
} from '@mui/material';
import { format } from 'date-fns';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import CompareIcon from '@mui/icons-material/Compare';
import SecurityIcon from '@mui/icons-material/Security';
import axios from 'axios';

// Use API endpoint constants from App.tsx
const API_BASE_URL = 'http://localhost:8000/api/v1/scan';

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
    scan_type: 'CodeQL' | 'ShiftLeft' | 'Semgrep' | 'Combined SAST' | 'AI';
    scan_mode?: 'custom' | 'auto' | 'gemini';
    language?: string;
    individual_durations?: {
      semgrep?: number;
      codeql?: number;
      shiftleft?: number;
    };
  };
}

interface ComparisonResult {
  scan_id: string;
  file_name: string;
  vulnerability_count: number;
  matched_patterns: string[];
  file_in_exploitdb: boolean;
  exploitdb_results: ExploitDbResult[];
  exploitdb_id?: string;
  comparison_timestamp: string;
  vulnerabilities?: Array<{
    check_id: string;
    path: string;
    message: string;
    severity: string;
    extra?: {
      severity?: string;
    };
    matching_exploitdb_vulnerabilities?: Array<{
      type: string;
      description: string;
      exploit_id: string;
      confidence: string;
    }>;
  }>;
}

interface ExploitDbResult {
  title: string;
  exploit_id: string;
  description: string;
  date: string;
  author: string;
  type: string;
  platform: string;
  link: string;
  vulnerabilities?: Array<{
    type: string;
    description: string;
  }>;
  cve?: string;
  notes?: string;
  verified?: boolean;
}

const ScanHistory: React.FC<ScanHistoryProps> = ({ onViewScan }) => {
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null);
  const [compareDialogOpen, setCompareDialogOpen] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [loadingComparison, setLoadingComparison] = useState(false);

  /* ------------------------------------------------------------------ */
  /* API helpers                                                         */
  /* ------------------------------------------------------------------ */
  const fetchHistory = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get<{
        items: ScanHistoryItem[];
        total: number;
      }>(`${API_BASE_URL}/history`, {
        params: { limit: rowsPerPage, offset: page * rowsPerPage },
      });

      // Support showing both combined SAST and AI scan results
      let filteredData;
      
      // Support both paginated (items+total) and bare array responses
      if (Array.isArray(data)) {
        filteredData = data.filter(scan => 
          scan.scan_metadata?.scan_type === 'Combined SAST' ||
          scan.scan_metadata?.scan_type === 'AI'
        );
        setHistory(filteredData);
        setTotalCount(filteredData.length);
      } else {
        filteredData = data.items.filter(scan => 
          scan.scan_metadata?.scan_type === 'Combined SAST' ||
          scan.scan_metadata?.scan_type === 'AI'
        );
        setHistory(filteredData);
        setTotalCount(filteredData.length); // We set the count to the filtered length, not the total from API
      }
    } catch (err) {
      console.error('Error fetching scan history:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteScan = async (scanId: string) => {
    try {
      await axios.delete(`${API_BASE_URL}/scan/${scanId}`);
      await fetchHistory(); // refresh
    } catch (err: any) {
      console.error('Error deleting scan:', err);
      alert(
        err?.response?.data?.detail ??
          'Failed to delete scan. Please try again.'
      );
    }
  };

  const compareWithExploitDb = async (scanId: string) => {
    setLoadingComparison(true);
    try {
      const { data } = await axios.get<ComparisonResult>(
        `${API_BASE_URL}/compare/${scanId}`
      );
      setComparisonResult(data);
      setCompareDialogOpen(true);
    } catch (err: any) {
      console.error('Error comparing with Exploit DB:', err);
      alert(
        err?.response?.data?.detail ??
          'Failed to compare with Exploit DB. Please try again.'
      );
    } finally {
      setLoadingComparison(false);
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
  const handleCompareClick = (scanId: string) => {
    setSelectedScanId(scanId);
    compareWithExploitDb(scanId);
  };
  const handleCloseCompareDialog = () => {
    setCompareDialogOpen(false);
    setComparisonResult(null);
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
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : history.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          <AlertTitle>No Scan Results</AlertTitle>
          No security scans have been performed yet. Run a scan to see results here.
        </Alert>
      ) : (
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
                <TableCell>Status</TableCell>
                <TableCell width={180}>Actions</TableCell>
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
                              : scan.scan_metadata?.scan_type === 'AI'
                              ? 'AI Security Analysis'
                              : scan.scan_metadata?.scan_type === 'Combined SAST'
                              ? 'Combined SAST Analysis'
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
                            : scan.scan_metadata?.scan_type === 'AI'
                            ? 'AI Scan'
                            : scan.scan_metadata?.scan_type === 'Combined SAST'
                            ? 'Combined SAST'
                            : 'Semgrep'
                        }
                        color={
                          scan.scan_metadata?.scan_type === 'CodeQL'
                            ? 'secondary'
                            : scan.scan_metadata?.scan_type === 'ShiftLeft'
                            ? 'success'
                            : scan.scan_metadata?.scan_type === 'AI'
                            ? 'warning'
                            : scan.scan_metadata?.scan_type === 'Combined SAST'
                            ? 'info'
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
                      label={`${Math.floor(scan.security_score)}/10`}
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
                    <Box sx={{ display: 'flex' }}>
                      <Tooltip title="View Scan Results">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => onViewScan(scan.id)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Compare with Exploit DB">
                        <IconButton
                          size="small"
                          color="secondary"
                          onClick={() => handleCompareClick(scan.id)}
                          disabled={loadingComparison && selectedScanId === scan.id}
                        >
                          {loadingComparison && selectedScanId === scan.id ? (
                            <CircularProgress size={18} />
                          ) : (
                            <CompareIcon fontSize="small" />
                          )}
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Delete Scan">
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
                    <Typography variant="body2" color="textSecondary" py={2}>
                      No scan history found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </TableContainer>
      )}

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

      {/* Exploit DB Comparison Dialog */}
      <Dialog 
        open={compareDialogOpen} 
        onClose={handleCloseCompareDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <SecurityIcon sx={{ mr: 1 }} color="secondary" />
            Exploit DB Comparison Results
          </Box>
        </DialogTitle>
        <DialogContent>
          {loadingComparison ? (
            <Box display="flex" justifyContent="center" my={4}>
              <CircularProgress />
            </Box>
          ) : comparisonResult ? (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                File: {comparisonResult.file_name}
              </Typography>
              
              {comparisonResult.exploitdb_id && (
                <Alert severity="warning" sx={{ mt: 1, mb: 2 }}>
                  <AlertTitle>Exploit Database File Detected</AlertTitle>
                  This file appears to be directly from Exploit-DB with ID {comparisonResult.exploitdb_id}.
                  <Link 
                    href={`https://www.exploit-db.com/exploits/${comparisonResult.exploitdb_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ display: 'block', mt: 1 }}
                  >
                    View original exploit on Exploit-DB
                  </Link>
                </Alert>
              )}
              
              <Typography variant="body2" gutterBottom>
                Found {comparisonResult.vulnerability_count} vulnerabilities in scan
              </Typography>
              
              {comparisonResult.matched_patterns.length > 0 && (
                <Box mt={2}>
                  <Typography variant="subtitle2">
                    Vulnerability patterns detected:
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
                    {comparisonResult.matched_patterns.map(pattern => (
                      <Chip 
                        key={pattern} 
                        label={pattern} 
                        size="small" 
                        color="error" 
                        variant="outlined" 
                      />
                    ))}
                  </Box>
                </Box>
              )}
              
              {comparisonResult.vulnerabilities && comparisonResult.vulnerabilities.length > 0 && (
                <Box mt={3}>
                  <Typography variant="subtitle2" gutterBottom>
                    Vulnerabilities Found in This File:
                  </Typography>
                  <List>
                    {comparisonResult.vulnerabilities.map((vuln, index) => (
                      <ListItem key={index} divider>
                        {/* -------- main ListItemText with fixes -------- */}
                        <ListItemText
                          disableTypography
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="body2" fontWeight="bold" component="span">
                                {vuln.check_id}
                              </Typography>
                              <Chip 
                                size="small" 
                                label={
                                  vuln.extra?.severity || 
                                  vuln.severity.toUpperCase() || 
                                  "INFO"
                                } 
                                color={
                                  (vuln.extra?.severity === "ERROR" || vuln.severity === "error") ? "error" :
                                  (vuln.extra?.severity === "WARNING" || vuln.severity === "warning") ? "warning" :
                                  "info"
                                } 
                              />
                              {vuln.matching_exploitdb_vulnerabilities?.length > 0 && (
                                <Chip 
                                  size="small" 
                                  icon={<SecurityIcon fontSize="small" />}
                                  label="Found in Exploit DB" 
                                  color="secondary"
                                  variant="outlined"
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            <>
                              <Typography variant="body2" component="span" display="block" sx={{ mt: 1 }}>
                                {vuln.message}
                              </Typography>
                              
                              {vuln.matching_exploitdb_vulnerabilities?.length > 0 && (
                                <Box mt={1} px={2} py={1} bgcolor="#f8f0ff" borderLeft="4px solid" borderColor="secondary.main" borderRadius={1}>
                                  <Typography variant="caption" color="secondary" fontWeight="bold" component="span">
                                    Exploit DB Correlation:
                                  </Typography>
                                  {vuln.matching_exploitdb_vulnerabilities.map((match, idx) => (
                                    <Box key={idx} mt={0.5}>
                                      <Typography variant="body2" color="text.secondary" component="span">
                                        {match.description}{' '}
                                        <Typography component="span" variant="caption" color="secondary.dark">
                                          (Confidence: {match.confidence})
                                        </Typography>
                                      </Typography>
                                    </Box>
                                  ))}
                                </Box>
                              )}
                            </>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
              
              <Box mt={3}>
                <Typography variant="subtitle2" gutterBottom>
                  Exploit DB Results:
                </Typography>
                
                {comparisonResult.file_in_exploitdb ? (
                  <List>
                    {comparisonResult.exploitdb_results.map((exploit) => (
                      <ListItem key={exploit.exploit_id} sx={{ display: 'block', p: 0, mb: 2 }}>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                          <Typography variant="h6" gutterBottom>
                            <Link href={exploit.link} target="_blank" rel="noopener noreferrer">
                              {exploit.title} ({exploit.exploit_id})
                            </Link>
                          </Typography>
                          
                          {/* Display CVE information if available */}
                          {exploit.cve && (
                            <Box mb={1}>
                              <Chip 
                                label={exploit.cve} 
                                color="error" 
                                size="small" 
                                icon={<ErrorIcon />} 
                                sx={{ fontWeight: 'bold' }} 
                              />
                              <Link 
                                href={`https://cve.mitre.org/cgi-bin/cvename.cgi?name=${exploit.cve}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{ ml: 1, fontSize: '0.875rem' }}
                              >
                                View CVE details
                              </Link>
                            </Box>
                          )}
                          
                          {/* Basic exploit information */}
                          <Typography variant="body2" sx={{ mb: 2 }}>
                            {exploit.description}
                          </Typography>
                          
                          <Grid container spacing={2} sx={{ mb: 2 }}>
                            <Grid item xs={12} sm={6}>
                              <Box display="flex" flexWrap="wrap" gap={1}>
                                <Chip label={`Type: ${exploit.type}`} size="small" />
                                <Chip label={`Platform: ${exploit.platform}`} size="small" />
                                <Chip label={`Author: ${exploit.author}`} size="small" />
                                <Chip label={`Date: ${exploit.date}`} size="small" />
                                {exploit.verified && (
                                  <Chip 
                                    label="Verified" 
                                    size="small" 
                                    color="success" 
                                    variant="outlined" 
                                  />
                                )}
                              </Box>
                            </Grid>
                          </Grid>
                          
                          {/* Display notes from Exploit DB report */}
                          {exploit.notes && (
                            <Box mt={2} bgcolor="#f5f5f5" p={2} borderRadius={1}>
                              <Typography variant="subtitle2" gutterBottom>
                                Exploit DB Notes:
                              </Typography>
                              <Typography variant="body2" component="div" sx={{ whiteSpace: 'pre-line' }}>
                                {exploit.notes}
                              </Typography>
                            </Box>
                          )}
                          
                          {/* Display vulnerabilities mentioned in Exploit DB */}
                          {exploit.vulnerabilities?.length > 0 && (
                            <Box mt={2}>
                              <Typography variant="subtitle2" gutterBottom color="error">
                                Vulnerabilities Documented in Exploit DB Report:
                              </Typography>
                              <List dense>
                                {exploit.vulnerabilities.map((v, idx) => (
                                  <ListItem key={idx} sx={{ 
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: 1,
                                    mb: 1,
                                    bgcolor: 'rgba(255, 0, 0, 0.03)'
                                  }}>
                                    <ListItemText 
                                      disableTypography
                                      primary={
                                        <Typography variant="body2" fontWeight="bold" component="span">
                                          {v.type.toUpperCase()}
                                        </Typography>
                                      }
                                      secondary={
                                        <Typography variant="body2" component="span" sx={{ mt: 0.5 }}>
                                          {v.description}
                                        </Typography>
                                      }
                                    />
                                  </ListItem>
                                ))}
                              </List>
                            </Box>
                          )}
                        </Paper>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    No matching entries found in Exploit DB for this file or its vulnerabilities.
                  </Typography>
                )}
              </Box>
              
              <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 2 }}>
                Comparison performed at: {comparisonResult.comparison_timestamp}
              </Typography>
            </Box>
          ) : (
            <Typography>No comparison data available</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCompareDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ScanHistory;