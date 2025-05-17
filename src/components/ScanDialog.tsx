import React from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  Typography, 
  Box, 
  IconButton, 
  CircularProgress 
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ScanResults from './ScanResults';

interface ScanDialogProps {
  dialogOpen: boolean;
  handleCloseDialog: () => void;
  scanResults: any;
  combinedResults: any;
  isAnyScanLoading: boolean;
  loadingSastUpload: boolean;
  loadingSastProcessing: boolean;
  loadingShiftLeftUpload: boolean;
  loadingShiftLeftProcessing: boolean;
  loadingCodeQLUpload: boolean;
  loadingCodeQLProcessing: boolean;
  runningAllSast: boolean;
  loadingAiScan?: boolean;
}

const ScanDialog: React.FC<ScanDialogProps> = ({
  dialogOpen,
  handleCloseDialog,
  scanResults,
  combinedResults,
  isAnyScanLoading,
  loadingSastUpload,
  loadingSastProcessing,
  loadingShiftLeftUpload,
  loadingShiftLeftProcessing,
  loadingCodeQLUpload,
  loadingCodeQLProcessing,
  runningAllSast,
  loadingAiScan = false
}) => {
  // Determine if this is an AI scan based on metadata
  const isAiScan = scanResults?.scan_metadata?.scan_type === 'AI';
  
  // Determine which results to display
  // Priority: AI Scan > Combined Results > Individual Scan
  const resultsToDisplay = isAiScan ? scanResults : (combinedResults || scanResults);
  
  // Get the scan type for title display
  const scanType = isAiScan ? 'AI' : 
                  combinedResults ? 'Combined' :
                  scanResults?.scan_metadata?.scan_type || 'Security';
  
  return (
    <Dialog 
      open={dialogOpen} 
      onClose={handleCloseDialog}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {scanType === 'AI' ? 'AI Security Analysis Results' : 
             scanType === 'Combined' ? 'Combined Security Analysis Results' : 
             scanType === 'CodeQL' ? 'CodeQL Scan Results' : 
             scanType === 'ShiftLeft' ? 'ShiftLeft Scan Results' : 
             'Security Scan Results'}
            
            {scanType === 'Combined' && (
              <Typography 
                variant="subtitle1" 
                component="span" 
                sx={{ ml: 1, fontWeight: 'normal', color: 'text.secondary' }}
              >
                (Semgrep, ShiftLeft, CodeQL)
              </Typography>
            )}
          </Typography>
          <IconButton onClick={handleCloseDialog} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {isAnyScanLoading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3, gap: 2 }}>
            <CircularProgress />
            <Typography variant="body1" sx={{ textAlign: 'center' }}>
              {loadingAiScan ? 'Running AI security analysis...' :
               loadingSastUpload ? 'Uploading file for Semgrep scan...' : 
               loadingSastProcessing ? 'Running Semgrep security analysis...' : 
               loadingShiftLeftUpload ? 'Uploading file for ShiftLeft scan...' : 
               loadingShiftLeftProcessing ? 'Running ShiftLeft security analysis...' : 
               loadingCodeQLUpload ? 'Uploading file for CodeQL scan...' : 
               loadingCodeQLProcessing ? 'Running CodeQL security analysis...' : 
               'Running security analysis...'}
            </Typography>
            
            {runningAllSast && (
              <Box sx={{ width: '100%', mt: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Overall scan progress:
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {loadingSastProcessing || !loadingSastUpload && !loadingSastProcessing ? <CheckCircleIcon color="success" fontSize="small" /> : <CircularProgress size={16} />}
                    </Box>
                    <Typography variant="body2">Semgrep Analysis</Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {loadingSastProcessing && !loadingShiftLeftUpload && !loadingShiftLeftProcessing ? 
                        <CircularProgress size={16} /> : 
                        loadingShiftLeftUpload || loadingShiftLeftProcessing || loadingCodeQLUpload || loadingCodeQLProcessing ? 
                        <CheckCircleIcon color="success" fontSize="small" /> : null}
                    </Box>
                    <Typography variant="body2">ShiftLeft Analysis</Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {(loadingShiftLeftProcessing && !loadingCodeQLUpload && !loadingCodeQLProcessing) ? 
                        <CircularProgress size={16} /> : 
                        loadingCodeQLUpload || loadingCodeQLProcessing ? 
                        <CheckCircleIcon color="success" fontSize="small" /> : null}
                    </Box>
                    <Typography variant="body2">CodeQL Analysis</Typography>
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
        ) : resultsToDisplay ? (
          <ScanResults results={resultsToDisplay} />
        ) : (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No scan results available. Please run a scan first.
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ScanDialog; 