import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  Paper, 
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery,
  RadioGroup,
  Radio,
  FormControlLabel,
  FormControl,
  FormLabel
} from '@mui/material';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import FileUpload from './components/FileUpload';
import ScanHistory from './components/ScanHistory';
import SemgrepRuleSelector from './components/SemgrepRuleSelector';
import RuleDetails from './components/RuleDetails';
import TabPanel from './components/TabPanel';
import ScanDialog from './components/ScanDialog';
import ScanActions from './components/ScanActions';
import { Vulnerability } from './types/vulnerability';
import { startAiScan } from './components/ScanFunctions';
import { combineAndStoreResults } from './components/CombineResults';
import { createProcessingButtonStyle, createUploadingButtonStyle } from './styles/animations';
import CreditsInfo from './components/CreditsInfo';
import ConfirmationModal from './components/ConfirmationModal';

const API_UPLOAD_URL = 'http://localhost:8000/api/v1/scan/upload';
const API_SCAN_URL = 'http://localhost:8000/api/v1/scan/scan';
const API_CODEQL_URL = 'http://localhost:8000/api/v1/scan/codeql';
const API_SHIFTLEFT_URL = 'http://localhost:8000/api/v1/scan/shiftleft';

interface SemgrepRulesResponse {
  rules: any[];
  total: number;
  has_more: boolean;
}

function App() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [scanResults, setScanResults] = useState<any>(null);
  const [loadingSastUpload, setLoadingSastUpload] = useState(false);
  const [loadingCodeQLUpload, setLoadingCodeQLUpload] = useState(false);
  const [loadingShiftLeftUpload, setLoadingShiftLeftUpload] = useState(false);
  const [loadingSastProcessing, setLoadingSastProcessing] = useState(false);
  const [loadingCodeQLProcessing, setLoadingCodeQLProcessing] = useState(false);
  const [loadingShiftLeftProcessing, setLoadingShiftLeftProcessing] = useState(false);
  const [loadingAiScan, setLoadingAiScan] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [scanStarted, setScanStarted] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [ruleType, setRuleType] = useState<'auto' | 'custom'>('auto');
  const [customRule, setCustomRule] = useState('');
  const [customRuleError, setCustomRuleError] = useState<string | null>(null);
  const [sastData, setSastData] = useState<any>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Computed properties for loading states
  const isSastLoading = loadingSastUpload || loadingSastProcessing;
  const isCodeQLLoading = loadingCodeQLUpload || loadingCodeQLProcessing;
  const isShiftLeftLoading = loadingShiftLeftUpload || loadingShiftLeftProcessing;
  const isAnyScanLoading = isSastLoading || isCodeQLLoading || isShiftLeftLoading || loadingAiScan;
  
  // State to track if "Run All SAST" is specifically running
  const [runningAllSast, setRunningAllSast] = useState(false);

  // Create the animation style objects
  const processingButtonStyle = createProcessingButtonStyle(theme);
  const uploadingButtonStyle = createUploadingButtonStyle(theme);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    setUploadedFile(acceptedFiles[0]);
    setScanResults(null);
    setScanStarted(false);
    setError(null);
    setResultsButtonClicked(false); // Reset for new file upload
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
    try {
      setError('');
      setLoadingSastUpload(true);
      
      const formData = new FormData();
      formData.append('file', uploadedFile as File);
      
      if (ruleType === 'custom' && selectedRule) {
        formData.append('custom_rule', selectedRule.registry_id || selectedRule.id || '');
      }
    
      const response = await axios.post(`http://localhost:8000/api/v1/scan/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        // @ts-ignore - Suppress the TypeScript error for axios progress event
        onUploadProgress: (progressEvent: any) => {
          const total = progressEvent.total as number;
          if (total) {
            const progress = Math.round((progressEvent.loaded as number * 100) / total);
            setUploadProgress(progress);
          }
        }
      });
      
      setLoadingSastUpload(false);
      setLoadingSastProcessing(true);
      
      setSastData(response.data);
      setScanResults(response.data);
      setDialogOpen(true);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during scanning');
    } finally {
      setLoadingSastUpload(false);
      setLoadingSastProcessing(false);
    }
  };

  // Helper to classify vulnerabilities
  const classifyVulns = (vulns: Vulnerability[]) => {
    const result = { VULNERABLE: [], MODERATE: [], INFO: [] } as Record<string, Vulnerability[]>;
    vulns.forEach(vuln => {
      const rawSeverity = vuln.severity;
      const sev = (rawSeverity || 'info').toLowerCase();
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
      
      // Clear previous results to avoid showing the wrong type
      setCombinedResults(null);
      setSemgrepResults(null);
      setShiftLeftResults(null);
      setCodeQLResults(null);
      setAiScanResults(null);
      
      // Use the combined-scan endpoint instead of scan endpoint
      const response = await fetch(`http://localhost:8000/api/v1/scan/combined-scan/${scanId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch scan details');
      }
      
      const data = await response.json();
      
      // Determine scan type based on metadata - handle the new formats from combined_scans table
      if (data?.scan_metadata?.scan_type === 'AI') {
        setAiScanResults(data);
        setCombinedResults(null); // Make sure combined results are not shown
      } else if (data?.scan_metadata?.scan_type === 'combined sast' || 
                data?.scan_metadata?.scan_type === 'Combined SAST') {
        setCombinedResults(data);
      } else if (data?.scan_metadata?.scan_type === 'SAST & AI') {
        // This is a combined SAST + AI scan
        setCombinedResults(data);
        setAiScanResults(data); // Also set AI results since it contains both
      } else {
        // Individual scan types (Semgrep, ShiftLeft, CodeQL)
        switch (data?.scan_metadata?.scan_type) {
          case 'Semgrep':
            setSemgrepResults(data);
            break;
          case 'ShiftLeft':
            setShiftLeftResults(data);
            break;
          case 'CodeQL':
            setCodeQLResults(data);
            break;
          default:
            // If we can't determine type, show as combined results
            setCombinedResults(data);
        }
      }
      
      setScanResults(data);
      setDialogOpen(true);
    } catch (err) {
      console.error('Error loading scan details:', err);
      setError('Failed to load scan details. Please try again.');
    } finally {
      setLoadingSastProcessing(false);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setScanResults(null);
    // Don't reset resultsButtonClicked so the button stays hidden
  };

  // State variables for storing all scan results
  const [semgrepResults, setSemgrepResults] = useState<any>(null);
  const [shiftLeftResults, setShiftLeftResults] = useState<any>(null);
  const [codeQLResults, setCodeQLResults] = useState<any>(null);
  const [combinedResults, setCombinedResults] = useState<any>(null);
  const [aiScanResults, setAiScanResults] = useState<any>(null);
  // State to track if the results button has been clicked
  const [resultsButtonClicked, setResultsButtonClicked] = useState<boolean>(false);
  // State for credit info refresh trigger
  const [creditsRefreshTrigger, setCreditsRefreshTrigger] = useState<number>(0);
  const [aiScanConfirmOpen, setAiScanConfirmOpen] = useState<boolean>(false);
  
  // Function to run all scanners
  const runAllScanners = async () => {
    if (!uploadedFile) return;
    
    setError(null);
    setScanStarted(true);
    setRunningAllSast(true);
    setResultsButtonClicked(false); // Reset so the results button will show for this new scan
    
    // Reset all result states
    setSemgrepResults(null);
    setShiftLeftResults(null);
    setCodeQLResults(null);
    setCombinedResults(null);
    
    try {
      // Run Semgrep scan first
      setLoadingSastUpload(true);
      
      const semgrepFormData = new FormData();
      semgrepFormData.append('file', uploadedFile);
      
      if (ruleType === 'custom' && customRule) {
        semgrepFormData.append('custom_rule', customRule);
      }
      
      // Semgrep upload
      const semgrepResponse = await fetch(API_UPLOAD_URL, {
        method: 'POST',
        body: semgrepFormData,
      });
      
      setLoadingSastUpload(false);
      setLoadingSastProcessing(true);
      
      if (!semgrepResponse.ok) {
        const errorData = await semgrepResponse.json();
        throw new Error(errorData.detail || 'Failed to run Semgrep scan');
      }
      
      const semgrepData = await semgrepResponse.json();
      setSemgrepResults(semgrepData);
      
      // Allow UI to update for a moment
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Transition to ShiftLeft scan
      setLoadingSastProcessing(false);
      setLoadingShiftLeftUpload(true);
      
      const shiftleftFormData = new FormData();
      shiftleftFormData.append('file', uploadedFile);
      
      // ShiftLeft upload
      const shiftleftResponse = await fetch(API_SHIFTLEFT_URL, {
        method: 'POST',
        body: shiftleftFormData,
      });
      
      setLoadingShiftLeftUpload(false);
      setLoadingShiftLeftProcessing(true);
      
      if (!shiftleftResponse.ok) {
        const errorData = await shiftleftResponse.json();
        throw new Error(errorData.detail || 'Failed to run ShiftLeft scan');
      }
      
      const shiftleftData = await shiftleftResponse.json();
      setShiftLeftResults(shiftleftData);
      
      // Allow UI to update for a moment
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Transition to CodeQL scan
      setLoadingShiftLeftProcessing(false);
      setLoadingCodeQLUpload(true);
      
      const codeqlFormData = new FormData();
      codeqlFormData.append('file', uploadedFile);
      
      // CodeQL upload
      const codeqlResponse = await fetch(API_CODEQL_URL, {
        method: 'POST',
        body: codeqlFormData,
      });
      
      setLoadingCodeQLUpload(false);
      setLoadingCodeQLProcessing(true);
      
      if (!codeqlResponse.ok) {
        const errorData = await codeqlResponse.json();
        throw new Error(errorData.detail || 'Failed to run CodeQL scan');
      }
      
      const codeqlData = await codeqlResponse.json();
      setCodeQLResults(codeqlData);
      
      // Rather than showing the dialog immediately, combine the results
      const combined = await combineAndStoreResults(uploadedFile.name, semgrepData, shiftleftData, codeqlData);
      setCombinedResults(combined);
      
      // Clear all loading states
      setLoadingCodeQLProcessing(false);
      
    } catch (err) {
      // Clear all loading states in case of error
      setLoadingSastUpload(false);
      setLoadingSastProcessing(false);
      setLoadingCodeQLUpload(false);
      setLoadingCodeQLProcessing(false);
      setLoadingShiftLeftUpload(false);
      setLoadingShiftLeftProcessing(false);
      
      setError(err instanceof Error ? err.message : 'An error occurred running scans');
    } finally {
      setRunningAllSast(false);
    }
  };

  // Semgrep rules states
  const [semgrepRules, setSemgrepRules] = useState<any[]>([]);
  const [selectedRule, setSelectedRule] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingRules, setLoadingRules] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalRules, setTotalRules] = useState(0);
  
  const autocompleteRef = useRef<HTMLDivElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  // Handle search query with debounce
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  
  // Function to fetch semgrep rules
  const fetchSemgrepRules = useCallback(async (query: string = '', newOffset: number = 0, append: boolean = false) => {
    try {
      setLoadingRules(true);
      
      // Build parameters without filters
      const params: any = {
        query: query || undefined,
        limit: 50,
        offset: newOffset
      };
      
      const response = await axios.get<SemgrepRulesResponse>(`http://localhost:8000/api/v1/scan/semgrep-rules`, {
        params
      });
      
      const newRules = response.data.rules || [];
      setTotalRules(response.data.total || 0);
      setHasMore(response.data.has_more || false);
      
      // Don't filter out incomplete rules - just ensure they have an ID
      let validRules = newRules.filter((rule: any) => rule.id);
      
      // Update state based on whether we're appending or replacing
      if (append) {
        setSemgrepRules(prev => [...prev, ...validRules]);
      } else {
        setSemgrepRules(validRules);
      }
      
      setOffset(newOffset);
    } catch (error) {
      console.error('Error fetching semgrep rules:', error);
    } finally {
      setLoadingRules(false);
    }
  }, []);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  // Fetch rules when component mounts or when query changes
  useEffect(() => {
    if (ruleType === 'custom') {
      // Reset pagination when query changes
      setOffset(0);
      setHasMore(true);
      fetchSemgrepRules(debouncedSearchQuery, 0, false);
    }
  }, [ruleType, debouncedSearchQuery, fetchSemgrepRules]);
  
  // Handle infinite scroll
  const handleScroll = useCallback((event: React.UIEvent<HTMLUListElement>) => {
    if (!hasMore || loadingRules) return;
    
    const listbox = event.currentTarget;
    if (listbox.scrollTop + listbox.clientHeight >= listbox.scrollHeight - 100) {
      // We're close to the bottom, load more rules
      fetchSemgrepRules(debouncedSearchQuery, offset + 50, true);
    }
  }, [hasMore, loadingRules, debouncedSearchQuery, offset, fetchSemgrepRules]);

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
            <CreditsInfo key={creditsRefreshTrigger} onUpdate={() => setCreditsRefreshTrigger(prev => prev + 1)} />
            
            <Box>
              <FileUpload
                getRootProps={getRootProps}
                getInputProps={getInputProps}
                isDragActive={isDragActive}
                loading={isAnyScanLoading}
                uploadedFile={uploadedFile}
              />
            </Box>
            
            {uploadedFile && (
              <Box sx={{ mt: 3 }}>
                {/* <FormControl component="fieldset" sx={{ mb: 3 }}>
                  <FormLabel component="legend">SemGrep Scan Rule Type</FormLabel>
                  <RadioGroup
                    value={ruleType}
                    onChange={(e) => setRuleType(e.target.value as 'auto' | 'custom')}
                  >
                    <FormControlLabel value="auto" control={<Radio />} label="Default (Auto)" />
                    <FormControlLabel value="custom" control={<Radio />} label="Custom Semgrep Rule" />
                  </RadioGroup>
                </FormControl> */}
                
                {/* {ruleType === 'custom' && (
                  <Box sx={{ mb: 3 }}>
                    <SemgrepRuleSelector
                      selectedRule={selectedRule}
                      setSelectedRule={setSelectedRule}
                      ruleType={ruleType}
                    />
                    
                    {selectedRule && <RuleDetails selectedRule={selectedRule} />}
                  </Box>
                )} */}
                
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                  <ScanActions 
                    uploadedFile={uploadedFile}
                    isAnyScanLoading={isAnyScanLoading}
                    runAllScanners={runAllScanners}
                    startAiScan={() => {
                      // Show confirmation dialog instead of starting scan immediately
                      setAiScanConfirmOpen(true);
                    }}
                    loadingSastUpload={loadingSastUpload}
                    loadingSastProcessing={loadingSastProcessing}
                    loadingShiftLeftUpload={loadingShiftLeftUpload}
                    loadingShiftLeftProcessing={loadingShiftLeftProcessing}
                    loadingCodeQLUpload={loadingCodeQLUpload}
                    loadingCodeQLProcessing={loadingCodeQLProcessing}
                    loadingAiScan={loadingAiScan}
                    runningAllSast={runningAllSast}
                    processingButtonStyle={processingButtonStyle}
                    uploadingButtonStyle={uploadingButtonStyle}
                    combinedResults={combinedResults}
                    resultsButtonClicked={resultsButtonClicked}
                    setDialogOpen={setDialogOpen}
                    setResultsButtonClicked={setResultsButtonClicked}
                    disableRunAllSast={ruleType === 'custom' && !selectedRule}
                  />
                </Box>
              </Box>
            )}
            
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            <ScanHistory onViewScan={handleViewScan} />
          </TabPanel>
        </Paper>
      </Box>
      
      <ScanDialog 
        dialogOpen={dialogOpen}
        handleCloseDialog={handleCloseDialog}
        scanResults={scanResults}
        combinedResults={combinedResults}
        isAnyScanLoading={isAnyScanLoading}
        loadingSastUpload={loadingSastUpload}
        loadingSastProcessing={loadingSastProcessing}
        loadingShiftLeftUpload={loadingShiftLeftUpload}
        loadingShiftLeftProcessing={loadingShiftLeftProcessing}
        loadingCodeQLUpload={loadingCodeQLUpload}
        loadingCodeQLProcessing={loadingCodeQLProcessing}
        runningAllSast={runningAllSast}
        loadingAiScan={loadingAiScan}
      />
      
      <ConfirmationModal
        open={aiScanConfirmOpen}
        title="Confirm AI Scan"
        message={
          <Box>
            <Typography variant="body1" paragraph>
              This AI scan will deduct <strong>4 credits</strong> from your account.
            </Typography>
            <Typography variant="body1">
              Do you want to proceed with the scan?
            </Typography>
          </Box>
        }
        onConfirm={() => {
          setAiScanConfirmOpen(false);
          // Set loading states for AI scan
          setLoadingAiScan(true);
          
          startAiScan({
            uploadedFile,
            setScanResults: (results) => {
              setScanResults(results);
              setAiScanResults(results);
              setCombinedResults(null); // Clear combined results when showing AI results
            },
            setError,
            setScanStarted,
            setDialogOpen,
            setLoadingUpload: () => {}, // These are handled directly here
            setLoadingProcessing: () => {}, // These are handled directly here
            setCreditsRefreshTrigger
          }).finally(() => {
            setLoadingAiScan(false);
          });
        }}
        onCancel={() => setAiScanConfirmOpen(false)}
        confirmText="Yes, Proceed"
        cancelText="Cancel"
      />
    </Container>
  );
}

export default App; 