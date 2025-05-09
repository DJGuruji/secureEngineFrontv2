import React, { useState } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  Paper, 
  CircularProgress,
  Alert,
  Grid,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  RadioGroup,
  Radio,
  FormControlLabel,
  TextField,
  FormControl,
  FormLabel,
  keyframes
} from '@mui/material';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import FileUpload from './components/FileUpload';
import ScanHistory from './components/ScanHistory';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ScanResults from './components/ScanResults';
import { format } from 'date-fns';

interface Vulnerability {
  check_id: string;
  path: string;
  start: any;
  end: any;
  extra: any;
  severity: string;
  message: string;
}

const API_UPLOAD_URL = 'http://localhost:8000/api/v1/scan/upload';
const API_SCAN_URL = 'http://localhost:8000/api/v1/scan/scan';
const API_CODEQL_URL = 'http://localhost:8000/api/v1/scan/codeql';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function App() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [scanResults, setScanResults] = useState<any>(null);
  
  // Loading states for different scan stages:
  // - loadingSastUpload: When uploading a file for SAST scanning
  // - loadingSastProcessing: When processing a SAST scan on the server
  // - loadingCodeQLUpload: When uploading a file for CodeQL scanning
  // - loadingCodeQLProcessing: When running CodeQL analysis on the server
  // This allows for more specific loading indicators in the UI
  const [loadingSastUpload, setLoadingSastUpload] = useState(false);
  const [loadingCodeQLUpload, setLoadingCodeQLUpload] = useState(false);
  const [loadingSastProcessing, setLoadingSastProcessing] = useState(false);
  const [loadingCodeQLProcessing, setLoadingCodeQLProcessing] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [scanStarted, setScanStarted] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [ruleType, setRuleType] = useState<'auto' | 'custom'>('auto');
  const [customRule, setCustomRule] = useState('');
  const [customRuleError, setCustomRuleError] = useState<string | null>(null);

  // Computed properties for loading states
  const isSastLoading = loadingSastUpload || loadingSastProcessing;
  const isCodeQLLoading = loadingCodeQLUpload || loadingCodeQLProcessing;
  const isAnyScanLoading = isSastLoading || isCodeQLLoading;

  // Define the pulse animation keyframes
  const pulseAnimation = keyframes`
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
    100% {
      opacity: 1;
    }
  `;

  // Create the animation style objects for different states
  const processingButtonStyle = {
    animation: `${pulseAnimation} 1.5s infinite ease-in-out`,
    position: 'relative',
    '&::after': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: theme.palette.primary.main,
      opacity: 0.2,
      borderRadius: 'inherit',
    }
  };

  const uploadingButtonStyle = {
    animation: `${pulseAnimation} 1s infinite ease-in-out`,
    background: theme.palette.mode === 'dark' 
      ? 'linear-gradient(45deg, rgba(63,81,181,1) 0%, rgba(100,125,200,1) 50%, rgba(63,81,181,1) 100%)' 
      : 'linear-gradient(45deg, rgba(25,118,210,1) 0%, rgba(66,165,245,1) 50%, rgba(25,118,210,1) 100%)',
    backgroundSize: '200% 200%',
    transition: 'all 0.3s ease'
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    setUploadedFile(acceptedFiles[0]);
    setScanResults(null);
    setScanStarted(false);
    setError(null);
  };

  const validateCustomRule = (rule: string): boolean => {
    try {
      if (!rule.trim()) {
        setCustomRuleError('Custom rule cannot be empty');
        return false;
      }
      
      const parsed = JSON.parse(rule);
      if (!parsed.rules || !Array.isArray(parsed.rules)) {
        setCustomRuleError('Custom rule must contain a "rules" array');
        return false;
      }
      
      setCustomRuleError(null);
      return true;
    } catch (e) {
      setCustomRuleError('Invalid JSON format');
      return false;
    }
  };

  const handleCustomRuleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newRule = e.target.value;
    setCustomRule(newRule);
    if (newRule) {
      validateCustomRule(newRule);
    } else {
      setCustomRuleError(null);
    }
  };

  const startScan = async () => {
    if (!uploadedFile) return;
    
    if (ruleType === 'custom' && !validateCustomRule(customRule)) {
      return;
    }
    
    try {
      // Reset states at the start
      setError(null);
      setScanStarted(true);
      
      // First set upload state
      setLoadingSastUpload(true);
      setLoadingSastProcessing(false);
      
      const formData = new FormData();
      formData.append('file', uploadedFile);
      
      if (ruleType === 'custom' && customRule) {
        formData.append('custom_rule', customRule);
      }
      
      // Upload file
      const response = await fetch(API_UPLOAD_URL, {
        method: 'POST',
        body: formData,
      });
      
      // Switch from upload to processing state
      setLoadingSastUpload(false);
      setLoadingSastProcessing(true);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to scan file');
      }
      
      const data = await response.json();
      
      // Ensure processing state is visible for at least 1 second
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update the results
      setScanResults(data);
      
      // Then clear the processing state after results are set
      setLoadingSastProcessing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      // Clear all loading states in case of error
      setLoadingSastUpload(false);
      setLoadingSastProcessing(false);
    }
  };

  const startCodeQLScan = async () => {
    if (!uploadedFile) return;
    
    try {
      // Reset states at the start
      setError(null);
      setScanStarted(true);
      
      // First set upload state
      setLoadingCodeQLUpload(true);
      setLoadingCodeQLProcessing(false);
      
      const formData = new FormData();
      formData.append('file', uploadedFile);
  
      // Upload file
      const response = await fetch(API_CODEQL_URL, {
        method: 'POST',
        body: formData,
      });
      
      // Switch from upload to processing state
      setLoadingCodeQLUpload(false);
      setLoadingCodeQLProcessing(true);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to scan file with CodeQL');
      }
      
      const data = await response.json();
      
      // Ensure processing state is visible for at least 1 second
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update the results
      setScanResults(data);
      setDialogOpen(true);
      
      // Then clear the processing state after dialog is opened
      setLoadingCodeQLProcessing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      // Clear all loading states in case of error
      setLoadingCodeQLUpload(false);
      setLoadingCodeQLProcessing(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/zip': ['.zip'],
      'text/x-python': ['.py'],
      'application/javascript': ['.js'],
      'application/typescript': ['.ts'],
      'text/x-java': ['.java'],
      'text/x-c++src': ['.cpp'],
      'text/x-csrc': ['.c'],
      'text/x-csharp': ['.cs'],
      'application/x-httpd-php': ['.php'],
      'application/x-ruby': ['.rb'],
      'text/x-go': ['.go'],
      'text/x-rust': ['.rs'],
      'text/plain': ['.txt'],
      'application/x-msdownload': ['.exe'],
      'application/x-sh': ['.sh'],
    },
    multiple: false,
  });

  // Helper to classify vulnerabilities
const classifyVulns = (vulns: Vulnerability[]) => {
  const result = { VULNERABLE: [], MODERATE: [], INFO: [] } as Record<string, Vulnerability[]>;
  vulns.forEach(vuln => {
    const rawSeverity = vuln.severity;
    const sev = (rawSeverity || 'info').toLowerCase();
    console.log('Classifying vulnerability - raw severity:', rawSeverity, '| processed:', sev);
    if (sev === 'error') {
      result.VULNERABLE.push(vuln);
    } else if (sev === 'warning') {
      result.MODERATE.push(vuln);
    } else {
      result.INFO.push(vuln); // fallback
    }
  });
  return result;
};


  // Handler for viewing scan details from history
  const handleViewScan = async (scanId: string) => {
    try {
      setLoadingSastProcessing(true);
      setError(null);
      const response = await fetch(`${API_SCAN_URL}/${scanId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch scan details');
      }
      const data = await response.json();
      setScanResults(data);
      setDialogOpen(true);
    } catch (err) {
      setError('Failed to load scan details. Please try again.');
    } finally {
      setLoadingSastProcessing(false);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setScanResults(null);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Secure Engine
        </Typography>
        <Paper sx={{ p: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
            <Tab label="New Scan" />
            <Tab label="Scan History" />
          </Tabs>
          
          <TabPanel value={tabValue} index={0}>
            <FileUpload
              getRootProps={getRootProps}
              getInputProps={getInputProps}
              isDragActive={isDragActive}
              loading={isAnyScanLoading}
            />
            {uploadedFile && (
              <Box sx={{ mt: 3 }}>
                <FormControl component="fieldset" sx={{ mb: 3 }}>
                  <FormLabel component="legend">Scan Rule Type</FormLabel>
                  <RadioGroup
                    value={ruleType}
                    onChange={(e) => setRuleType(e.target.value as 'auto' | 'custom')}
                  >
                    <FormControlLabel value="auto" control={<Radio />} label="Default (Auto)" />
                    <FormControlLabel value="custom" control={<Radio />} label="Custom Rule" />
                  </RadioGroup>
                </FormControl>
                
                {ruleType === 'custom' && (
                  <Box sx={{ mb: 3 }}>
                    <TextField
                      fullWidth
                      multiline
                      rows={6}
                      label="Custom Semgrep Rule (JSON format)"
                      value={customRule}
                      onChange={handleCustomRuleChange}
                      error={!!customRuleError}
                      helperText={
                        customRuleError || 
                        'Enter your custom Semgrep rule in JSON format. Example:\n' +
                        '{\n' +
                        '  "rules": [\n' +
                        '    {\n' +
                        '      "id": "custom-rule-1",\n' +
                        '      "pattern": "eval(...)",\n' +
                        '      "message": "Avoid using eval()",\n' +
                        '      "severity": "ERROR",\n' +
                        '      "languages": ["python"]\n' +
                        '    }\n' +
                        '  ]\n' +
                        '}'
                      }
                      sx={{ mb: 1 }}
                    />
                  </Box>
                )}
                
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    size="large" 
                    onClick={startScan} 
                    disabled={isAnyScanLoading || (ruleType === 'custom' && (!customRule || !!customRuleError))}
                    sx={loadingSastProcessing ? processingButtonStyle : loadingSastUpload ? uploadingButtonStyle : {}}
                  >
                    {loadingSastUpload ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={16} color="inherit" />
                        Uploading File...
                      </Box>
                    ) : loadingSastProcessing ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={20} color="inherit" />
                        Running Semgrep...
                      </Box>
                    ) : 'Run Semgrep'}
                  </Button>
                  <Button
                    variant="contained"
                    color="secondary"
                    size="large"
                    onClick={startCodeQLScan}
                    disabled={isAnyScanLoading}
                    sx={loadingCodeQLProcessing ? processingButtonStyle : loadingCodeQLUpload ? uploadingButtonStyle : {}}
                  >
                    {loadingCodeQLUpload ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={16} color="inherit" />
                        Uploading File...
                      </Box>
                    ) : loadingCodeQLProcessing ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={20} color="inherit" />
                        Running CodeQL...
                      </Box>
                    ) : 'Run CodeQL'}
                  </Button>
                </Box>
              </Box>
            )}
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
            {scanResults && !isAnyScanLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => setDialogOpen(true)}
                  startIcon={<VisibilityIcon />}
                >
                  View Results
                </Button>
              </Box>
            )}
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            <ScanHistory onViewScan={handleViewScan} />
          </TabPanel>
        </Paper>
      </Box>
      
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">{scanResults?.scan_metadata?.scan_type === 'CodeQL' ? 'CodeQL Scan Results' : 'Scan Results'}</Typography>
            <IconButton onClick={handleCloseDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {isAnyScanLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3, gap: 2 }}>
              <CircularProgress />
              <Typography variant="body1">
                {loadingSastUpload ? 'Uploading file for Semgrep scan...' : 
                 loadingSastProcessing ? 'Running Semgrep security analysis...' : 
                 loadingCodeQLUpload ? 'Uploading file for CodeQL scan...' : 
                 'Running CodeQL security analysis...'}
              </Typography>
            </Box>
          ) : scanResults && (
            <ScanResults results={scanResults} />
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
}

export default App; 