import React from 'react';
import { 
  Box, 
  Button, 
  CircularProgress,
  Typography
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import VisibilityIcon from '@mui/icons-material/Visibility';

interface ScanActionsProps {
  uploadedFile: File | null;
  isAnyScanLoading: boolean;
  runAllScanners: () => void;
  startAiScan: () => void;
  loadingSastUpload: boolean;
  loadingSastProcessing: boolean;
  loadingShiftLeftUpload: boolean;
  loadingShiftLeftProcessing: boolean;
  loadingCodeQLUpload: boolean;
  loadingCodeQLProcessing: boolean;
  loadingAiScan: boolean;
  runningAllSast: boolean;
  processingButtonStyle: any;
  uploadingButtonStyle: any;
  combinedResults: any;
  resultsButtonClicked: boolean;
  setDialogOpen: (open: boolean) => void;
  setResultsButtonClicked: (clicked: boolean) => void;
}

const ScanActions: React.FC<ScanActionsProps> = ({
  uploadedFile,
  isAnyScanLoading,
  runAllScanners,
  startAiScan,
  loadingSastUpload,
  loadingSastProcessing,
  loadingShiftLeftUpload,
  loadingShiftLeftProcessing,
  loadingCodeQLUpload,
  loadingCodeQLProcessing,
  loadingAiScan,
  runningAllSast,
  processingButtonStyle,
  uploadingButtonStyle,
  combinedResults,
  resultsButtonClicked,
  setDialogOpen,
  setResultsButtonClicked
}) => {
  if (!uploadedFile) return null;
  
  return (
    <>
    {/* Button group in a column layout */}
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      {/* Row of Run All SAST and AI Scan */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Button
          variant="contained"
          size="large"
          onClick={runAllScanners}
          disabled={isAnyScanLoading}
          sx={{
            background: 'linear-gradient(45deg, #2196F3 30%, #9c27b0 70%, #4CAF50 100%)',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            padding: '12px 24px',
            ...(runningAllSast ? processingButtonStyle : {})
          }}
        >
          {loadingSastUpload ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={20} color="inherit" />
              Scanning File for Semgrep...
            </Box>
          ) : loadingSastProcessing ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={20} color="inherit" />
              Running Semgrep Analysis...
            </Box>
          ) : loadingShiftLeftUpload ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={20} color="inherit" />
              Scanning File for ShiftLeft...
            </Box>
          ) : loadingShiftLeftProcessing ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={20} color="inherit" />
              Running ShiftLeft Analysis...
            </Box>
          ) : loadingCodeQLUpload ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={20} color="inherit" />
              Scanning File for CodeQL...
            </Box>
          ) : loadingCodeQLProcessing ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={20} color="inherit" />
              Running CodeQL Analysis...
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SecurityIcon />
              Run All SAST Scans
            </Box>
          )}
        </Button>
  
        <Button
          variant="contained"
          size="large"
          onClick={startAiScan}
          disabled={isAnyScanLoading}
          sx={{
            background: 'linear-gradient(45deg, #FF5722 30%, #FFC107 90%)',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            padding: '12px 24px',
            ...(loadingAiScan ? processingButtonStyle : {})
          }}
        >
          {loadingAiScan ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={20} color="inherit" />
              Running AI Scan...
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SpeedIcon />
              Scan with AI
            </Box>
          )}
        </Button>
      </Box>
  
      {/* View Results Button */}
      {!isAnyScanLoading && combinedResults && !resultsButtonClicked && (
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            setDialogOpen(true);
            setResultsButtonClicked(true);
          }}
          startIcon={<VisibilityIcon />}
          size="large"
          sx={{
            py: 1,
            px: 2,
            fontSize: '1rem',
            background: 'linear-gradient(45deg, #2196F3 30%, #4CAF50 90%)'
          }}
        >
          View Security Analysis Results
        </Button>
      )}
    </Box>
  </>
  
  );
};

export default ScanActions; 