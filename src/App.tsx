import React, { useState, useCallback, useEffect, useRef } from 'react';
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
  keyframes,
  Autocomplete,
  InputAdornment,
  ListSubheader,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import FileUpload from './components/FileUpload';
import ScanHistory from './components/ScanHistory';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ScanResults from './components/ScanResults';
import { format } from 'date-fns';
import SearchIcon from '@mui/icons-material/Search';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LaunchIcon from '@mui/icons-material/Launch';

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
const API_SHIFTLEFT_URL = 'http://localhost:8000/api/v1/scan/shiftleft';
const API_COMPARE_URL = 'http://localhost:8000/api/v1/scan/compare';

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
  const [loadingSastUpload, setLoadingSastUpload] = useState(false);
  const [loadingCodeQLUpload, setLoadingCodeQLUpload] = useState(false);
  const [loadingShiftLeftUpload, setLoadingShiftLeftUpload] = useState(false);
  const [loadingSastProcessing, setLoadingSastProcessing] = useState(false);
  const [loadingCodeQLProcessing, setLoadingCodeQLProcessing] = useState(false);
  const [loadingShiftLeftProcessing, setLoadingShiftLeftProcessing] = useState(false);
  
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
  const isAnyScanLoading = isSastLoading || isCodeQLLoading || isShiftLeftLoading;
  
  // New state to track if "Run All SAST" is specifically running
  const [runningAllSast, setRunningAllSast] = useState(false);

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

  const startScan = async () => {      try {        setError('');        setLoadingSastUpload(true);                const formData = new FormData();        formData.append('file', uploadedFile as File);        
        if (ruleType === 'custom' && selectedRule) {
          formData.append('custom_rule', selectedRule.registry_id || selectedRule.id || '');
        }
      
      const response = await axios.post(`http://localhost:8000/api/v1/scan/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
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

  const startShiftLeftScan = async () => {
    if (!uploadedFile) return;
    
    try {
      // Reset states at the start
      setError(null);
      setScanStarted(true);
      
      // First set upload state
      setLoadingShiftLeftUpload(true);
      setLoadingShiftLeftProcessing(false);
      
      const formData = new FormData();
      formData.append('file', uploadedFile);
  
      // Upload file
      const response = await fetch(API_SHIFTLEFT_URL, {
        method: 'POST',
        body: formData,
      });
      
      // Switch from upload to processing state
      setLoadingShiftLeftUpload(false);
      setLoadingShiftLeftProcessing(true);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to scan file with ShiftLeft');
      }
      
      const data = await response.json();
      
      // Ensure processing state is visible for at least 1 second
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update the results
      setScanResults(data);
      setDialogOpen(true);
      
      // Then clear the processing state after dialog is opened
      setLoadingShiftLeftProcessing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      // Clear all loading states in case of error
      setLoadingShiftLeftUpload(false);
      setLoadingShiftLeftProcessing(false);
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

  // Add a function to run all scanners
  const runAllScanners = async () => {
    if (!uploadedFile) return;
    
    setError(null);
    setScanStarted(true);
    setRunningAllSast(true);
    
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
      const semgrepResults = semgrepData;
      
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
      const shiftleftResults = shiftleftData;
      
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
      
      // Clear all loading states
      setLoadingCodeQLProcessing(false);
      
      // Combine results - for now, use the last scan's results
      // A more advanced implementation could combine all results
      setScanResults(codeqlData);
      setDialogOpen(true);
      
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

  // Add semgrep rules states
  const [semgrepRules, setSemgrepRules] = useState<any[]>([]);
  const [selectedRule, setSelectedRule] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingRules, setLoadingRules] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalRules, setTotalRules] = useState(0);
  // Add filter state variables
  const [severityFilter, setSeverityFilter] = useState('all');
  const [languageFilter, setLanguageFilter] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  // Add state to control dropdown open/close
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  
  const autocompleteRef = useRef<HTMLDivElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  // Handle search query with debounce
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  
  // Add function to fetch semgrep rules FIRST
  const fetchSemgrepRules = useCallback(async (query: string = '', newOffset: number = 0, append: boolean = false) => {
    try {
      setLoadingRules(true);
      
      // Build filter parameters
      const params: any = {
        query: query || undefined,
        limit: 50,
        offset: newOffset
      };
      
      // Add severity filter
      if (severityFilter !== 'all') {
        params.severity = severityFilter;
      }
      
      // Add language filter - handled client-side
      // Add category filter - handled client-side
      
      const response = await axios.get(`http://localhost:8000/api/v1/scan/semgrep-rules`, {
        params
      });
      
      const { rules, total, has_more } = response.data;
      
      // Log comprehensive information about received rules
      console.log(`Received ${rules?.length || 0} rules from API`);
      
      // Log structure of first rule to help debugging
      if (rules && rules.length > 0) {
        console.log('First rule structure:', rules[0]);
        console.log('Languages in first rule:', rules[0].languages);
        console.log('Meta object in first rule:', rules[0].meta);
        if (rules[0].meta && rules[0].meta.languages) {
          console.log('Languages in meta:', rules[0].meta.languages);
        }
      }
      
      // Don't filter out incomplete rules - just ensure they have an ID
      let validRules = rules.filter((rule: any) => rule.id);
      
      // Apply client-side filtering for languages
      if (languageFilter.length > 0) {
        validRules = validRules.filter((rule: any) => {
          // Check in rule.meta.languages array first if it exists
          if (rule.meta && rule.meta.languages && Array.isArray(rule.meta.languages)) {
            if (rule.meta.languages.some((lang: string) => 
              languageFilter.includes(lang.toLowerCase()))) {
              return true;
            }
          }
          
          // Then check in rule.languages array
          if (rule.languages && Array.isArray(rule.languages)) {
            if (rule.languages.some((lang: string) => 
              languageFilter.includes(lang.toLowerCase()))) {
              return true;
            }
          }
          
          // Also check in rule.path
          if (rule.path) {
            return languageFilter.some(lang => 
              rule.path.toLowerCase().includes(lang.toLowerCase()));
          }
          
          return false;
        });
      }
      
      // Apply client-side filtering for category
      if (categoryFilter.length > 0) {
        validRules = validRules.filter((rule: any) => {
          // Check both direct category and meta.category field
          const directCategory = rule.category || '';
          const metaCategory = rule.meta && rule.meta.category ? rule.meta.category : '';
          
          if (!directCategory && !metaCategory) return false;
          
          const ruleCategoryLower = (directCategory || metaCategory).toLowerCase();
          return categoryFilter.some(category => 
            ruleCategoryLower.includes(category.toLowerCase()));
        });
      }
      
      if (validRules.length < rules.length) {
        console.warn(`Filtered out ${rules.length - validRules.length} rules with missing IDs or that didn't match filters`);
      }
      
      // Update state based on whether we're appending or replacing
      if (append) {
        setSemgrepRules(prev => [...prev, ...validRules]);
      } else {
        setSemgrepRules(validRules);
      }
      
      setTotalRules(total);
      setHasMore(has_more);
      setOffset(newOffset);
    } catch (error) {
      console.error('Error fetching semgrep rules:', error);
    } finally {
      setLoadingRules(false);
    }
  }, [severityFilter, languageFilter, categoryFilter]);
  
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
  }, [ruleType, debouncedSearchQuery, fetchSemgrepRules, severityFilter, languageFilter, categoryFilter]);
  
  // Handle infinite scroll
  const handleScroll = useCallback((event: React.UIEvent<HTMLUListElement>) => {
    if (!hasMore || loadingRules) return;
    
    const listbox = event.currentTarget;
    if (listbox.scrollTop + listbox.clientHeight >= listbox.scrollHeight - 100) {
      // We're close to the bottom, load more rules
      fetchSemgrepRules(debouncedSearchQuery, offset + 50, true);
    }
  }, [hasMore, loadingRules, debouncedSearchQuery, offset, fetchSemgrepRules]);

  // State variables moved up to fix reference error

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
                  <FormLabel component="legend">SemGrep Scan Rule Type</FormLabel>
                  <RadioGroup
                    value={ruleType}
                    onChange={(e) => setRuleType(e.target.value as 'auto' | 'custom')}
                  >
                    <FormControlLabel value="auto" control={<Radio />} label="Default (Auto)" />
                    <FormControlLabel value="custom" control={<Radio />} label="Custom Semgrep Rule" />
                  </RadioGroup>
                </FormControl>
                
                {ruleType === 'custom' && (
                  <Box sx={{ mb: 3 }}>
                    <Paper 
                      elevation={1} 
                      sx={{ 
                        p: 2.5, 
                        mb: 3, 
                        borderRadius: 2,
                        background: theme.palette.mode === 'dark' 
                          ? 'linear-gradient(to right, rgba(66,66,66,0.8), rgba(50,50,50,0.8))' 
                          : 'linear-gradient(to right, rgba(245,245,250,1), rgba(240,240,250,0.8))',
                        border: `1px solid ${theme.palette.divider}`
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5 }}>
                        <FilterAltIcon color="primary" sx={{ mr: 1.5 }} />
                        <Typography 
                          variant="h6" 
                          color="primary" 
                          sx={{ 
                            fontWeight: 600, 
                            letterSpacing: 0.5,
                            fontSize: '1.1rem'
                          }}
                        >
                          Rule Filters
                        </Typography>
                      </Box>
                    
                      <Grid container spacing={3}>
                        {/* Severity Filter */}
                        <Grid item xs={12} sm={4}>
                          <Box 
                            sx={{ 
                              p: 2, 
                              bgcolor: 'background.paper', 
                              borderRadius: 2,
                              boxShadow: theme.shadows[1],
                              height: '100%',
                              display: 'flex',
                              flexDirection: 'column'
                            }}
                          >
                            <FormControl component="fieldset" fullWidth>
                              <FormLabel 
                                component="legend" 
                                sx={{ 
                                  fontWeight: 'bold', 
                                  color: 'primary.main',
                                  mb: 1.5
                                }}
                              >
                                Severity Level
                              </FormLabel>
                              <RadioGroup
                                value={severityFilter}
                                onChange={(e) => setSeverityFilter(e.target.value)}
                                sx={{ 
                                  display: 'flex', 
                                  flexDirection: 'column',
                                  gap: 1
                                }}
                              >
                                <FormControlLabel 
                                  value="all" 
                                  control={
                                    <Radio 
                                      size="small" 
                                      sx={{ 
                                        color: theme.palette.text.secondary,
                                        '&.Mui-checked': {
                                          color: theme.palette.primary.main
                                        }
                                      }}
                                    />
                                  } 
                                  label="All Levels" 
                                  sx={{ 
                                    borderRadius: 1,
                                    py: 0.5,
                                    pl: 0.5,
                                    '&:hover': { 
                                      bgcolor: theme.palette.action.hover 
                                    }
                                  }}
                                />
                                <FormControlLabel 
                                  value="error" 
                                  control={
                                    <Radio 
                                      size="small"
                                      sx={{ 
                                        color: theme.palette.error.main,
                                        '&.Mui-checked': {
                                          color: theme.palette.error.main
                                        }
                                      }} 
                                    />
                                  } 
                                  label={
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                      <Typography>Error</Typography>
                                      <Chip 
                                        size="small" 
                                        label="High" 
                                        color="error" 
                                        sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} 
                                        variant="outlined"
                                      />
                                    </Box>
                                  }
                                  sx={{ 
                                    borderRadius: 1,
                                    py: 0.5,
                                    pl: 0.5,
                                    '&:hover': { 
                                      bgcolor: theme.palette.action.hover 
                                    }
                                  }}
                                />
                                <FormControlLabel 
                                  value="warning" 
                                  control={
                                    <Radio 
                                      size="small" 
                                      sx={{ 
                                        color: theme.palette.warning.main,
                                        '&.Mui-checked': {
                                          color: theme.palette.warning.main
                                        }
                                      }}
                                    />
                                  } 
                                  label={
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                      <Typography>Warning</Typography>
                                      <Chip 
                                        size="small" 
                                        label="Medium" 
                                        color="warning" 
                                        sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} 
                                        variant="outlined"
                                      />
                                    </Box>
                                  }
                                  sx={{ 
                                    borderRadius: 1,
                                    py: 0.5,
                                    pl: 0.5,
                                    '&:hover': { 
                                      bgcolor: theme.palette.action.hover 
                                    }
                                  }}
                                />
                                <FormControlLabel 
                                  value="info" 
                                  control={
                                    <Radio 
                                      size="small" 
                                      sx={{ 
                                        color: theme.palette.info.main,
                                        '&.Mui-checked': {
                                          color: theme.palette.info.main
                                        }
                                      }}
                                    />
                                  } 
                                  label={
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                      <Typography>Info</Typography>
                                      <Chip 
                                        size="small" 
                                        label="Low" 
                                        color="info" 
                                        sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} 
                                        variant="outlined"
                                      />
                                    </Box>
                                  }
                                  sx={{ 
                                    borderRadius: 1,
                                    py: 0.5,
                                    pl: 0.5,
                                    '&:hover': { 
                                      bgcolor: theme.palette.action.hover 
                                    }
                                  }}
                                />
                              </RadioGroup>
                            </FormControl>
                          </Box>
                        </Grid>
                        
                        {/* Language Filter */}
                        <Grid item xs={12} sm={4}>
                          <Box 
                            sx={{ 
                              p: 2, 
                              bgcolor: 'background.paper', 
                              borderRadius: 2,
                              boxShadow: theme.shadows[1],
                              height: '100%',
                              display: 'flex',
                              flexDirection: 'column'
                            }}
                          >
                            <FormControl fullWidth>
                              <InputLabel 
                                sx={{ 
                                  fontWeight: 'bold', 
                                  color: 'primary.main' 
                                }}
                              >
                                Programming Languages
                              </InputLabel>
                              
                              {/* Dropdown for selecting languages */}
                              <Select
                                multiple
                                open={languageDropdownOpen}
                                onOpen={() => setLanguageDropdownOpen(true)}
                                onClose={() => setLanguageDropdownOpen(false)}
                                value={languageFilter}
                                onChange={(e) => {
                                  setLanguageFilter(e.target.value as string[]);
                                  // Close dropdown immediately after selection
                                  setLanguageDropdownOpen(false);
                                }}
                                renderValue={() => {
                                  // Show just a placeholder if items are selected
                                  return languageFilter.length > 0 ? 
                                    <Typography variant="body2" noWrap sx={{ color: 'text.secondary' }}>
                                      {languageFilter.length} languages selected
                                    </Typography> : 
                                    <Typography variant="body2" noWrap sx={{ color: 'text.secondary' }}>
                                      Select programming languages
                                    </Typography>;
                                }}
                                size="small"
                                sx={{
                                  borderRadius: 1,
                                  '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: theme.palette.divider
                                  },
                                  '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: theme.palette.primary.main
                                  }
                                }}
                                MenuProps={{
                                  // Close on selection
                                  autoFocus: false,
                                  disableAutoFocusItem: true,
                                  disableAutoFocus: true,
                                  PaperProps: {
                                    sx: {
                                      maxHeight: 300,
                                      borderRadius: 2,
                                      boxShadow: theme.shadows[3]
                                    }
                                  }
                                }}
                              >
                                <ListSubheader sx={{ bgcolor: 'background.paper', fontWeight: 'bold', color: 'primary.main' }}>
                                  Common Languages
                                </ListSubheader>
                                {['generic', 'python', 'javascript', 'typescript', 'java'].map((lang) => (
                                  <MenuItem 
                                    key={lang} 
                                    value={lang}
                                    onClick={() => {
                                      // Handle single item selection to close dropdown immediately
                                      if (!languageFilter.includes(lang)) {
                                        setLanguageFilter([...languageFilter, lang]);
                                      }
                                      setLanguageDropdownOpen(false);
                                    }}
                                  >
                                    {lang.charAt(0).toUpperCase() + lang.slice(1)}
                                  </MenuItem>
                                ))}
                                
                                <ListSubheader sx={{ bgcolor: 'background.paper', fontWeight: 'bold', color: 'primary.main' }}>
                                  Other Languages
                                </ListSubheader>
                                {['go', 'ruby', 'c', 'cpp'].map((lang) => (
                                  <MenuItem 
                                    key={lang} 
                                    value={lang}
                                    onClick={() => {
                                      // Handle single item selection to close dropdown immediately
                                      if (!languageFilter.includes(lang)) {
                                        setLanguageFilter([...languageFilter, lang]);
                                      }
                                      setLanguageDropdownOpen(false);
                                    }}
                                  >
                                    {lang === 'cpp' ? 'C++' : lang.charAt(0).toUpperCase() + lang.slice(1)}
                                  </MenuItem>
                                ))}
                              </Select>
                              
                              {/* Selected languages display (separate from dropdown) */}
                              <Box 
                                sx={{ 
                                  display: 'flex', 
                                  flexWrap: 'wrap', 
                                  gap: 0.5,
                                  mt: 2,
                                  position: 'relative',
                                  zIndex: 5, // Higher z-index to ensure chips are clickable
                                  minHeight: '32px'
                                }}
                              >
                                {languageFilter.length > 0 ? (
                                  languageFilter.map((value) => (
                                    <Chip 
                                      key={value} 
                                      label={value} 
                                      size="small"
                                      color="primary"
                                      variant="outlined"
                                      onDelete={() => {
                                        setLanguageFilter(prev => prev.filter(item => item !== value));
                                      }}
                                      sx={{
                                        borderRadius: '16px',
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                          backgroundColor: theme.palette.primary.light,
                                          color: theme.palette.primary.contrastText
                                        }
                                      }}
                                    />
                                  ))
                                ) : (
                                  <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center', fontStyle: 'italic' }}>
                                    No language filters selected
                                  </Typography>
                                )}
                              </Box>
                            </FormControl>
                          </Box>
                        </Grid>
                        
                        {/* Category Filter */}
                        <Grid item xs={12} sm={4}>
                          <Box 
                            sx={{ 
                              p: 2, 
                              bgcolor: 'background.paper', 
                              borderRadius: 2,
                              boxShadow: theme.shadows[1],
                              height: '100%',
                              display: 'flex',
                              flexDirection: 'column'
                            }}
                          >
                            <FormControl fullWidth>
                              <InputLabel 
                                sx={{ 
                                  fontWeight: 'bold', 
                                  color: 'primary.main' 
                                }}
                              >
                                Rule Categories
                              </InputLabel>
                              
                              {/* Dropdown for selecting categories */}
                              <Select
                                multiple
                                open={categoryDropdownOpen}
                                onOpen={() => setCategoryDropdownOpen(true)}
                                onClose={() => setCategoryDropdownOpen(false)}
                                value={categoryFilter}
                                onChange={(e) => {
                                  setCategoryFilter(e.target.value as string[]);
                                  // Close dropdown immediately after selection
                                  setCategoryDropdownOpen(false);
                                }}
                                renderValue={() => {
                                  // Show just a placeholder if items are selected
                                  return categoryFilter.length > 0 ? 
                                    <Typography variant="body2" noWrap sx={{ color: 'text.secondary' }}>
                                      {categoryFilter.length} categories selected
                                    </Typography> : 
                                    <Typography variant="body2" noWrap sx={{ color: 'text.secondary' }}>
                                      Select rule categories
                                    </Typography>;
                                }}
                                size="small"
                                sx={{
                                  borderRadius: 1,
                                  '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: theme.palette.divider
                                  },
                                  '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: theme.palette.primary.main
                                  }
                                }}
                                MenuProps={{
                                  // Close on selection
                                  autoFocus: false,
                                  disableAutoFocusItem: true,
                                  disableAutoFocus: true,
                                  PaperProps: {
                                    sx: {
                                      maxHeight: 300,
                                      borderRadius: 2,
                                      boxShadow: theme.shadows[3]
                                    }
                                  }
                                }}
                              >
                                {[
                                  { 
                                    value: 'security', 
                                    label: 'Security', 
                                    icon: <SecurityIcon sx={{ color: theme.palette.error.main, mr: 1, fontSize: '1.2rem' }} />
                                  },
                                  { 
                                    value: 'performance', 
                                    label: 'Performance', 
                                    icon: <SpeedIcon sx={{ color: theme.palette.warning.main, mr: 1, fontSize: '1.2rem' }} /> 
                                  },
                                  { 
                                    value: 'best-practice', 
                                    label: 'Best Practice', 
                                    icon: <CheckCircleIcon sx={{ color: theme.palette.success.main, mr: 1, fontSize: '1.2rem' }} />
                                  }
                                ].map((category) => (
                                  <MenuItem 
                                    key={category.value} 
                                    value={category.value}
                                    onClick={() => {
                                      // Handle single item selection to close dropdown immediately
                                      if (!categoryFilter.includes(category.value)) {
                                        setCategoryFilter([...categoryFilter, category.value]);
                                      }
                                      setCategoryDropdownOpen(false);
                                    }}
                                  >
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                      {category.icon}
                                      {category.label}
                                    </Box>
                                  </MenuItem>
                                ))}
                              </Select>
                              
                              {/* Selected categories display (separate from dropdown) */}
                              <Box 
                                sx={{ 
                                  display: 'flex', 
                                  flexWrap: 'wrap', 
                                  gap: 0.5,
                                  mt: 2,
                                  position: 'relative',
                                  zIndex: 5, // Higher z-index to ensure chips are clickable
                                  minHeight: '32px'
                                }}
                              >
                                {categoryFilter.length > 0 ? (
                                  categoryFilter.map((value) => {
                                    // Determine chip color based on category
                                    let chipColor: 'error' | 'warning' | 'success' | 'default' = 'default';
                                    let chipIcon = null;
                                    
                                    if (value === 'security') {
                                      chipColor = 'error';
                                      chipIcon = <SecurityIcon sx={{ fontSize: '0.8rem', mr: 0.5 }} />;
                                    } else if (value === 'performance') {
                                      chipColor = 'warning';
                                      chipIcon = <SpeedIcon sx={{ fontSize: '0.8rem', mr: 0.5 }} />;
                                    } else if (value === 'best-practice') {
                                      chipColor = 'success';
                                      chipIcon = <CheckCircleIcon sx={{ fontSize: '0.8rem', mr: 0.5 }} />;
                                    }
                                    
                                    return (
                                      <Chip 
                                        key={value} 
                                        label={value} 
                                        size="small"
                                        color={chipColor}
                                        icon={chipIcon}
                                        onDelete={() => {
                                          setCategoryFilter(prev => prev.filter(item => item !== value));
                                        }}
                                        sx={{
                                          borderRadius: '16px',
                                          transition: 'all 0.2s ease',
                                          '& .MuiChip-icon': {
                                            ml: 0.5
                                          }
                                        }}
                                      />
                                    );
                                  })
                                ) : (
                                  <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center', fontStyle: 'italic' }}>
                                    No category filters selected
                                  </Typography>
                                )}
                              </Box>
                            </FormControl>
                          </Box>
                        </Grid>
                      </Grid>
                    </Paper>
                    
                    <Autocomplete
                      id="semgrep-rules"
                      options={semgrepRules}
                      loading={loadingRules}
                      value={selectedRule}
                      onChange={(event, newValue) => {
                        setSelectedRule(newValue);
                      }}
                      getOptionLabel={(option) => option.id || ''}
                      filterOptions={(x) => x} // Disable built-in filtering as we do server-side filtering
                      ListboxProps={{
                        onScroll: handleScroll,
                        ref: listboxRef
                      }}
                      ref={autocompleteRef}
                      renderInput={(params) => (
                    <TextField
                          {...params}
                          label="Select Semgrep Rule"
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: (
                              <>
                                <InputAdornment position="start">
                                  <SearchIcon />
                                </InputAdornment>
                                {params.InputProps.startAdornment}
                              </>
                            ),
                            endAdornment: (
                              <>
                                {loadingRules ? <CircularProgress color="inherit" size={20} /> : null}
                                {params.InputProps.endAdornment}
                              </>
                            ),
                          }}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                          }}
                          helperText={`Search and select a rule from the Semgrep registry (${semgrepRules.length} of ${totalRules} rules loaded)`}
                        />
                      )}
                      renderOption={(props, option) => {
                        if (!option) return <li {...props}>Missing rule data</li>;
                        
                        // Check for incomplete rule data
                        const isIncompleteRule = !option.name || !option.description || !option.languages || !Array.isArray(option.languages) || option.languages.length === 0;
                        
                        if (isIncompleteRule) {
                          return (
                            <li {...props}>
                              <Box sx={{ width: '100%' }}>
                                <Typography variant="body1" fontWeight="bold">
                                  Rule: {option.id || 'Unknown ID'}
                                </Typography>
                                <Box display="flex" flexWrap="wrap" gap={0.75} mt={1}>
                                  <Chip 
                                    size="small" 
                                    label={option.id} 
                                    variant="outlined" 
                                    color="primary"
                                  />
                                  {option.severity && (
                                    <Chip 
                                      size="small" 
                                      label={`Severity: ${option.severity}`} 
                                      color="default"
                                    />
                                  )}
                                  {option.path && (
                                    <Chip
                                      size="small"
                                      label={`Path: ${option.path.split('/').pop()}`}
                                      variant="outlined"
                                    />
                                  )}
                                </Box>
                              </Box>
                            </li>
                          );
                        }
                        
                        // Get severity color
                        const getSeverityColor = (severity: string) => {
                          const sev = (severity || '').toLowerCase();
                          if (sev === 'error') return 'error';
                          if (sev === 'warning') return 'warning';
                          if (sev === 'info') return 'info';
                          return 'default';
                        };
                        
                        // Get severity label
                        const getSeverityLabel = (severity: string) => {
                          const sev = (severity || '').toLowerCase();
                          if (sev === 'error') return 'High';
                          if (sev === 'warning') return 'Medium';
                          if (sev === 'info') return 'Low';
                          return severity || 'Unknown';
                        };
                        
                        return (
                          <li {...props}>
                            <Box sx={{ width: '100%' }}>
                              <Typography variant="body1" fontWeight="bold">
                                Rule ID: {option.id}
                              </Typography>
                              
                              <Box display="flex" flexWrap="wrap" gap={0.75} mt={1}>
                                {option.id && (
                                  <Chip 
                                    size="small" 
                                    label={option.id} 
                                    variant="outlined" 
                                    color="primary"
                                  />
                                )}
                                
                                {option.severity && (
                                  <Chip 
                                    size="small" 
                                    label={`Severity: ${getSeverityLabel(option.severity)}`} 
                                    color={getSeverityColor(option.severity)}
                                  />
                                )}
                                
                                {option.category && (
                                  <Chip 
                                    size="small" 
                                    label={`Category: ${option.category}`} 
                                    variant="outlined"
                                  />
                                )}
                                
                                {option.path && (
                                  <Chip 
                                    size="small" 
                                    label={`Path: ${option.path}`} 
                                    variant="outlined"
                                    color="success"
                                  />
                                )}
                                
                                {option.message && (
                                  <Chip
                                    size="small"
                                    label="Has message"
                                    color="success"
                                    variant="outlined"
                                  />
                                )}
                                
                                {option.patterns && option.patterns.length > 0 && (
                                  <Chip
                                    size="small"
                                    label="Has patterns"
                                    color="info"
                                    variant="outlined"
                                  />
                                )}
                              </Box>
                              
                              {/* Languages - Priority given to meta.languages */}
                              {(option.meta && Array.isArray(option.meta.languages) && option.meta.languages.length > 0) || 
                               (Array.isArray(option.languages) && option.languages.length > 0) ? (
                                <Box display="flex" flexWrap="wrap" gap={0.5} mt={1}>
                                  <Typography variant="caption" sx={{ mr: 1, alignSelf: 'center' }}>
                                    Languages:
                                  </Typography>
                                  {/* Prioritize meta.languages over languages */}
                                  {((option.meta && Array.isArray(option.meta.languages)) 
                                    ? option.meta.languages 
                                    : option.languages || []).map((lang: string, idx: number) => (
                                     <Chip 
                                       key={idx} 
                                       label={lang} 
                                       size="small" 
                                       variant="outlined" 
                                       color="secondary"
                                       sx={{ height: 20, fontSize: '0.7rem' }}
                                     />
                                   ))}
                                </Box>
                              ) : null}
                            </Box>
                          </li>
                        );
                      }}
                      ListboxComponent={(props) => (
                        <ul {...props}>
                          {props.children}
                          {hasMore && (
                            <ListSubheader style={{ textAlign: 'center', background: 'transparent' }}>
                              {loadingRules ? (
                                <CircularProgress size={24} />
                              ) : (
                                <Typography variant="caption">Scroll to load more</Typography>
                              )}
                            </ListSubheader>
                          )}
                        </ul>
                      )}
                    />
                    
                    {selectedRule && (
                      <Paper 
                        elevation={2} 
                        sx={{ 
                          mt: 3, 
                          borderRadius: 2,
                          overflow: 'hidden',
                          border: `1px solid ${theme.palette.divider}`,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            boxShadow: theme.shadows[4]
                          }
                        }}
                      >
                        {/* Header with rule ID and severity */}
                        <Box 
                          sx={{ 
                            p: 2, 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderBottom: `1px solid ${theme.palette.divider}`,
                            background: theme.palette.mode === 'dark' 
                              ? 'linear-gradient(45deg, rgba(66,66,66,1) 0%, rgba(50,50,50,1) 100%)' 
                              : 'linear-gradient(45deg, rgba(245,245,245,1) 0%, rgba(235,235,235,1) 100%)'
                          }}
                        >
                          <Box>
                            <Typography variant="h6" color="primary">
                              Selected Rule
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              ID: <code>{selectedRule.id}</code>
                            </Typography>
                          </Box>
                          
                          {selectedRule.severity && (
                            <Chip 
                              label={selectedRule.severity.toUpperCase()}
                              color={
                                selectedRule.severity.toLowerCase() === 'error' ? 'error' :
                                selectedRule.severity.toLowerCase() === 'warning' ? 'warning' : 'info'
                              }
                              size="medium"
                              sx={{ fontWeight: 'bold' }}
                            />
                          )}
                        </Box>
                        
                        {/* Main content */}
                        <Box sx={{ p: 2 }}>
                          <Grid container spacing={3}>
                            {/* Left column - Basic info */}
                            <Grid item xs={12} md={6}>
                              <Box 
                                sx={{ 
                                  p: 2, 
                                  borderRadius: 1, 
                                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                                  height: '100%'
                                }}
                              >
                                <Typography variant="subtitle1" color="primary" gutterBottom>
                                  Basic Information
                                </Typography>
                                
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                  <tbody>
                                    {selectedRule.rule_id && (
                                      <tr>
                                        <td style={{ padding: '4px 0', width: '35%', fontWeight: 'bold' }}>Rule ID:</td>
                                        <td>{selectedRule.rule_id}</td>
                                      </tr>
                                    )}
                                    {((Array.isArray(selectedRule.languages) && selectedRule.languages.length > 0) || 
                                      (selectedRule.meta && Array.isArray(selectedRule.meta.languages) && selectedRule.meta.languages.length > 0)) && (
                                      <tr>
                                        <td style={{ padding: '4px 0', fontWeight: 'bold' }}>Languages:</td>
                                        <td>
                                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {/* Prioritize meta.languages over languages */}
                                            {((selectedRule.meta && Array.isArray(selectedRule.meta.languages)) 
                                              ? selectedRule.meta.languages 
                                              : selectedRule.languages || []).map((lang: string, idx: number) => (
                                              <Chip 
                                                key={idx} 
                                                label={lang} 
                                                size="small" 
                                                variant="outlined" 
                                                color="primary"
                                              />
                                            ))}
                                          </Box>
                                        </td>
                                      </tr>
                                    )}
                                    {/* Path field removed */}
                                    {selectedRule.mode && (
                                      <tr>
                                        <td style={{ padding: '4px 0', fontWeight: 'bold' }}>Mode:</td>
                                        <td>{selectedRule.mode}</td>
                                      </tr>
                                    )}
                                    {(selectedRule.metadata?.cwe || (selectedRule.meta && selectedRule.meta.cwe)) && (
                                      <tr>
                                        <td style={{ padding: '4px 0', fontWeight: 'bold' }}>CWE:</td>
                                        <td>
                                          <Chip 
                                            label={`CWE-${selectedRule.metadata?.cwe || (selectedRule.meta && selectedRule.meta.cwe)}`}
                                            color="error"
                                            size="small"
                                            sx={{ fontWeight: 'bold' }}
                                            component="a"
                                            href={`https://cwe.mitre.org/data/definitions/${selectedRule.metadata?.cwe || (selectedRule.meta && selectedRule.meta.cwe)}.html`}
                                            target="_blank"
                                            clickable
                                          />
                                        </td>
                                      </tr>
                                    )}
                                    {(selectedRule.metadata?.owasp || (selectedRule.meta && selectedRule.meta.owasp)) && (
                                      <tr>
                                        <td style={{ padding: '4px 0', fontWeight: 'bold' }}>OWASP:</td>
                                        <td>
                                          <Chip 
                                            label={selectedRule.metadata?.owasp || (selectedRule.meta && selectedRule.meta.owasp)}
                                            color="warning"
                                            size="small"
                                            sx={{ fontWeight: 'bold' }}
                                          />
                                        </td>
                                      </tr>
                                    )}
                                    <tr>
                                      <td style={{ padding: '4px 0', width: '35%', fontWeight: 'bold' }}>Category:</td>
                                      <td>
                                        {selectedRule.category || (selectedRule.meta && selectedRule.meta.category) ? (
                                          <Chip 
                                            label={selectedRule.category || (selectedRule.meta && selectedRule.meta.category)}
                                            color="primary"
                                            size="small"
                                            sx={{ fontWeight: 'bold' }}
                                          />
                                        ) : 'N/A'}
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </Box>
                            </Grid>
                            
                            {/* Right column - Details */}
                            <Grid item xs={12} md={6}>
                              <Box 
                                sx={{ 
                                  p: 2, 
                                  borderRadius: 1, 
                                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                                  height: '100%'
                                }}
                              >
                                <Typography variant="subtitle1" color="primary" gutterBottom>
                                  Detection Details
                                </Typography>
                                
                                {selectedRule.message && (
                                  <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" fontWeight="bold">Message:</Typography>
                                    <Box sx={{ 
                                      p: 1, 
                                      borderRadius: 1, 
                                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)',
                                      fontSize: '0.9rem',
                                      fontFamily: 'monospace'
                                    }}>
                                      {selectedRule.message}
                                    </Box>
                                  </Box>
                                )}
                                
                                {selectedRule.tags && selectedRule.tags.length > 0 && (
                                  <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5 }}>Tags:</Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                      {Array.isArray(selectedRule.tags) && selectedRule.tags.map((tag: string, idx: number) => (
                                        <Chip 
                                          key={idx} 
                                          label={tag} 
                                          size="small" 
                                          variant="outlined"
                                          color="secondary"
                                        />
                                      ))}
                                    </Box>
                                  </Box>
                                )}
                                
                                {selectedRule.fix && (
                                  <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" fontWeight="bold">Fix:</Typography>
                                    <Typography variant="body2">{selectedRule.fix}</Typography>
                                  </Box>
                                )}
                                
                                {selectedRule.source_uri && (
                                  <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                    <Typography variant="body2" fontWeight="bold" sx={{ mr: 1 }}>Source:</Typography>
                                    <IconButton
                                      component="a"
                                      href={selectedRule.source_uri}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      size="small"
                                      color="primary"
                                      aria-label="View Source"
                                      title={selectedRule.source_uri}
                                    >
                                      <LaunchIcon fontSize="small" />
                                    </IconButton>
                                  </Box>
                                )}
                              </Box>
                            </Grid>
                            
                                                          {/* Metadata section */}
                              {((selectedRule.metadata && Object.keys(selectedRule.metadata).length > 0) || 
                               (selectedRule.meta && Object.keys(selectedRule.meta).length > 0)) && (
                              <Grid item xs={12}>
                                <Box 
                                  sx={{ 
                                    p: 2, 
                                    borderRadius: 1, 
                                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                                  }}
                                >
                                  <Grid container spacing={2}>
                                    {(selectedRule.metadata?.owasp || (selectedRule.meta && selectedRule.meta.owasp)) && (
                                      <Grid item xs={12} sm={6} md={4}>
                                        <Paper variant="outlined" sx={{ p: 1.5 }}>
                                          <Typography variant="body2" fontWeight="bold" color="error">
                                            OWASP Reference
                                          </Typography>
                                          <Typography variant="body2">
                                            {selectedRule.metadata?.owasp || (selectedRule.meta && selectedRule.meta.owasp)}
                                          </Typography>
                                        </Paper>
                                      </Grid>
                                    )}
                                    
                                    {(selectedRule.metadata?.cwe || (selectedRule.meta && selectedRule.meta.cwe)) && (
                                      <Grid item xs={12} sm={6} md={4}>
                                        <Paper variant="outlined" sx={{ p: 1.5, borderColor: theme.palette.error.main }}>
                                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <SecurityIcon color="error" sx={{ mr: 1 }} />
                                            <Typography variant="body1" fontWeight="bold" color="error">
                                              CWE Reference
                                            </Typography>
                                          </Box>
                                          <Button 
                                            variant="outlined" 
                                            color="error" 
                                            size="small"
                                            href={`https://cwe.mitre.org/data/definitions/${selectedRule.metadata?.cwe || (selectedRule.meta && selectedRule.meta.cwe)}.html`}
                                            target="_blank"
                                            startIcon={<LaunchIcon />}
                                            fullWidth
                                          >
                                            CWE-{selectedRule.metadata?.cwe || (selectedRule.meta && selectedRule.meta.cwe)}: View Details
                                          </Button>
                                        </Paper>
                                      </Grid>
                                    )}
                                    
                                    {/* Display additional security-related metadata fields from both locations */}
                                    {(selectedRule.metadata?.impact || (selectedRule.meta && selectedRule.meta.impact)) && (
                                      <Grid item xs={12} sm={6} md={4}>
                                        <Paper variant="outlined" sx={{ p: 1.5 }}>
                                          <Typography variant="body2" fontWeight="bold" color="primary">
                                            Security Impact
                                          </Typography>
                                          <Typography variant="body2">
                                            {selectedRule.metadata?.impact || (selectedRule.meta && selectedRule.meta.impact)}
                                          </Typography>
                                        </Paper>
                                      </Grid>
                                    )}
                                    
                                    {(selectedRule.metadata?.confidence || (selectedRule.meta && selectedRule.meta.confidence)) && (
                                      <Grid item xs={12} sm={6} md={4}>
                                        <Paper variant="outlined" sx={{ p: 1.5 }}>
                                          <Typography variant="body2" fontWeight="bold" color="primary">
                                            Detection Confidence
                                          </Typography>
                                          <Typography variant="body2">
                                            {selectedRule.metadata?.confidence || (selectedRule.meta && selectedRule.meta.confidence)}
                                          </Typography>
                                        </Paper>
                                      </Grid>
                                    )}
                                    
                                    {(selectedRule.metadata?.likelihood || (selectedRule.meta && selectedRule.meta.likelihood)) && (
                                      <Grid item xs={12} sm={6} md={4}>
                                        <Paper variant="outlined" sx={{ p: 1.5 }}>
                                          <Typography variant="body2" fontWeight="bold" color="primary">
                                            Exploitation Likelihood
                                          </Typography>
                                          <Typography variant="body2">
                                            {selectedRule.metadata?.likelihood || (selectedRule.meta && selectedRule.meta.likelihood)}
                                          </Typography>
                                        </Paper>
                                      </Grid>
                                    )}
                                    
                                    {/* Display any additional metadata from meta field */}
                                    {selectedRule.meta && Object.entries(selectedRule.meta)
                                      .filter(([key]) => 
                                        // Display important fields and filter out unwanted/already shown fields
                                        !['owasp', 'cwe', 'category', 'impact', 'confidence', 'likelihood', 
                                          'author_photo_url', 'author', 'languages', 'rule'].includes(key)
                                      )
                                      .map(([key, value]) => (
                                        <Grid item xs={12} sm={6} md={4} key={key}>
                                          <Paper variant="outlined" sx={{ p: 1.5 }}>
                                            <Typography variant="body2" fontWeight="bold" color="primary">
                                              {key.charAt(0).toUpperCase() + key.slice(1)}
                                            </Typography>
                                            <Typography variant="body2">
                                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                            </Typography>
                                          </Paper>
                                        </Grid>
                                      ))
                                    }
                                    
                                    {/* Similarly check metadata field for other properties */}
                                    {selectedRule.metadata && Object.entries(selectedRule.metadata)
                                      .filter(([key]) => 
                                        // Display important fields and filter out unwanted/already shown fields
                                        !['owasp', 'cwe', 'category', 'impact', 'confidence', 'likelihood', 
                                          'technology', 'references'].includes(key)
                                      )
                                      .map(([key, value]) => (
                                        <Grid item xs={12} sm={6} md={4} key={key}>
                                          <Paper variant="outlined" sx={{ p: 1.5 }}>
                                            <Typography variant="body2" fontWeight="bold" color="primary">
                                              {key.charAt(0).toUpperCase() + key.slice(1)}
                                            </Typography>
                                            <Typography variant="body2">
                                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                            </Typography>
                                          </Paper>
                                        </Grid>
                                      ))
                                    }
                                    
                                    {(selectedRule.metadata?.technology || (selectedRule.meta && selectedRule.meta.technology)) && (
                                      <Grid item xs={12} sm={6} md={4}>
                                        <Paper variant="outlined" sx={{ p: 1.5 }}>
                                          <Typography variant="body2" fontWeight="bold" color="primary">
                                            Technology
                                          </Typography>
                                          <Typography variant="body2">
                                            {selectedRule.metadata?.technology || (selectedRule.meta && selectedRule.meta.technology)}
                                          </Typography>
                                        </Paper>
                                      </Grid>
                                    )}
                                    
                                    {(selectedRule.metadata?.references || (selectedRule.meta && selectedRule.meta.references)) && (
                                      <Grid item xs={12}>
                                        <Paper variant="outlined" sx={{ p: 1.5 }}>
                                          <Typography variant="body2" fontWeight="bold" color="primary">
                                            References
                                          </Typography>
                                          <Typography variant="body2">
                                            {Array.isArray(selectedRule.metadata?.references || (selectedRule.meta && selectedRule.meta.references))
                                              ? (selectedRule.metadata?.references || (selectedRule.meta && selectedRule.meta.references)).join(', ')
                                              : (selectedRule.metadata?.references || (selectedRule.meta && selectedRule.meta.references))}
                                          </Typography>
                                        </Paper>
                                      </Grid>
                                    )}
                                  </Grid>
                                </Box>
                              </Grid>
                            )}
                            
                            {/* Pattern rules section */}
                            {selectedRule.patterns && selectedRule.patterns.length > 0 && (
                              <Grid item xs={12}>
                                <Box 
                                  sx={{ 
                                    p: 2, 
                                    borderRadius: 1, 
                                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                                  }}
                                >
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                    <Typography variant="subtitle1" color="primary">
                                      Pattern Rules
                                    </Typography>
                                    <Chip 
                                      label={`${selectedRule.patterns.length} pattern${selectedRule.patterns.length > 1 ? 's' : ''}`} 
                                      color="primary" 
                                      size="small" 
                                      variant="outlined"
                                    />
                                  </Box>
                                  
                                  <Box component="pre" sx={{ 
                                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.06)', 
                                    p: 2, 
                                    borderRadius: 1,
                                    fontSize: '0.85rem',
                                    fontFamily: 'monospace',
                                    overflow: 'auto',
                                    maxHeight: '300px',
                                    border: `1px solid ${theme.palette.divider}`
                                  }}>
                                    {JSON.stringify(selectedRule.patterns, null, 2)}
                                  </Box>
                                </Box>
                              </Grid>
                            )}
                          </Grid>
                        </Box>
                      </Paper>
                    )}
                  </Box>
                )}
                
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    size="large" 
                    onClick={startScan} 
                    disabled={isSastLoading || (ruleType === 'custom' && !selectedRule)}
                    sx={loadingSastProcessing ? processingButtonStyle : loadingSastUpload ? uploadingButtonStyle : {}}
                  >
                    {loadingSastUpload ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={16} color="inherit" />
                        Scanning File...
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
                    color="success"
                    size="large"
                    onClick={startShiftLeftScan}
                    disabled={isShiftLeftLoading}
                    sx={loadingShiftLeftProcessing ? processingButtonStyle : loadingShiftLeftUpload ? uploadingButtonStyle : {}}
                  >
                    {loadingShiftLeftUpload ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={16} color="inherit" />
                        Uploading File...
                      </Box>
                    ) : loadingShiftLeftProcessing ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={20} color="inherit" />
                        Running ShiftLeft...
                      </Box>
                    ) : 'Run ShiftLeft'}
                  </Button>
                  <Button
                    variant="contained"
                    color="secondary"
                    size="large"
                    onClick={startCodeQLScan}
                    disabled={isCodeQLLoading || (ruleType === 'custom' && !selectedRule)}
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
                  <Button
                    variant="contained"
                    color="info"
                    size="large"
                    onClick={runAllScanners}
                    disabled={isAnyScanLoading}
                    sx={{
                      background: 'linear-gradient(45deg, #2196F3 30%, #9c27b0 70%, #4CAF50 100%)',
                      ...(runningAllSast ? processingButtonStyle : {})
                    }}
                  >
                    {runningAllSast ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={20} color="inherit" />
                        Running All Scanners...
                      </Box>
                    ) : 'Run All SAST'}
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
                 loadingCodeQLProcessing ? 'Running CodeQL security analysis...' : 
                 loadingShiftLeftUpload ? 'Uploading file for ShiftLeft scan...' : 
                 'Running ShiftLeft security analysis...'}
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