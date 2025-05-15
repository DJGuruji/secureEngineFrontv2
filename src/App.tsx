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
import SemgrepRuleSelector from './components/SemgrepRuleSelector';
import RuleDetails from './components/RuleDetails';
import RuleFilters from './components/RuleFilters';

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

  const startScan = async () => {      try {        setError('');        setLoadingSastUpload(true);                const formData = new FormData();        formData.append('file', uploadedFile as File);        
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
    // Don't reset resultsButtonClicked so the button stays hidden
  };

  // Add new state variables for storing all scan results
  const [semgrepResults, setSemgrepResults] = useState<any>(null);
  const [shiftLeftResults, setShiftLeftResults] = useState<any>(null);
  const [codeQLResults, setCodeQLResults] = useState<any>(null);
  const [combinedResults, setCombinedResults] = useState<any>(null);
  // Add state to track if the results button has been clicked
  const [resultsButtonClicked, setResultsButtonClicked] = useState<boolean>(false);
  
  // Add a function to run all scanners
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
      await combineAndStoreResults(semgrepData, shiftleftData, codeqlData);
      
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
  const [scanTypeFilter, setScanTypeFilter] = useState<string[]>([]);
  // Add state to control dropdown open/close
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [scanTypeDropdownOpen, setScanTypeDropdownOpen] = useState(false);
  
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
      
      // Add rule_type filter if there's only one selected
      if (scanTypeFilter.length === 1) {
        params.rule_type = scanTypeFilter[0];
        console.log(`Sending rule_type filter to backend: ${scanTypeFilter[0]}`);
      }
      
      // Add language filter - handled client-side
      // Add category filter - handled client-side
      
      const response = await axios.get<SemgrepRulesResponse>(`http://localhost:8000/api/v1/scan/semgrep-rules`, {
        params
      });
      
      const newRules = response.data.rules || [];
      setTotalRules(response.data.total || 0);
      setHasMore(response.data.has_more || false);
      
      // Log comprehensive information about received rules
      console.log(`Received ${newRules?.length || 0} rules from API`);
      
      // Log structure of first rule to help debugging
      if (newRules && newRules.length > 0) {
        console.log('First rule structure:', newRules[0]);
        console.log('Languages in first rule:', newRules[0].languages);
        console.log('Meta object in first rule:', newRules[0].meta);
        if (newRules[0].meta && newRules[0].meta.languages) {
          console.log('Languages in meta:', newRules[0].meta.languages);
        }
      }
      
      // Don't filter out incomplete rules - just ensure they have an ID
      let validRules = newRules.filter((rule: any) => rule.id);
      
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
      
      // Apply client-side filtering for scan types
      if (scanTypeFilter.length > 0) {
        console.log(`Filtering by rule types: ${scanTypeFilter.join(', ')}`);
        console.log(`Before filtering: ${validRules.length} rules`);
        
        validRules = validRules.filter((rule: any) => {
          // Check the rule_type field directly at the root level
          if (rule.rule_type) {
            const ruleType = rule.rule_type.toLowerCase();
            console.log(`Rule ${rule.id} has rule_type: ${ruleType}`);
            return scanTypeFilter.some(type => 
              ruleType === type.toLowerCase());
          }
          
          // Fallback checks in other locations
          // Check in rule.meta.metadata.type field if it exists
          if (rule.meta && rule.meta.metadata && rule.meta.metadata.type) {
            const ruleType = rule.meta.metadata.type.toLowerCase();
            console.log(`Rule ${rule.id} has meta.metadata.type: ${ruleType}`);
            return scanTypeFilter.some(type => 
              ruleType === type.toLowerCase());
          }
          
          // Check in rule.metadata.type field if it exists
          if (rule.metadata && rule.metadata.type) {
            const ruleType = rule.metadata.type.toLowerCase();
            console.log(`Rule ${rule.id} has metadata.type: ${ruleType}`);
            return scanTypeFilter.some(type => 
              ruleType === type.toLowerCase());
          }
          
          // Check in rule.id field for common scan type identifiers
          if (rule.id) {
            const ruleId = rule.id.toLowerCase();
            const matchesType = scanTypeFilter.some(type => 
              ruleId.includes(type.toLowerCase()));
            if (matchesType) {
              console.log(`Rule ${rule.id} ID contains rule type`);
            }
            return matchesType;
          }
          
          return false;
        });
        
        console.log(`After filtering: ${validRules.length} rules`);
      }
      
      if (validRules.length < newRules.length) {
        console.warn(`Filtered out ${newRules.length - validRules.length} rules with missing IDs or that didn't match filters`);
      }
      
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
  }, [severityFilter, languageFilter, categoryFilter, scanTypeFilter]);
  
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
  }, [ruleType, debouncedSearchQuery, fetchSemgrepRules, severityFilter, languageFilter, categoryFilter, scanTypeFilter]);
  
  // Handle infinite scroll
  const handleScroll = useCallback((event: React.UIEvent<HTMLUListElement>) => {
    if (!hasMore || loadingRules) return;
    
    const listbox = event.currentTarget;
    if (listbox.scrollTop + listbox.clientHeight >= listbox.scrollHeight - 100) {
      // We're close to the bottom, load more rules
      fetchSemgrepRules(debouncedSearchQuery, offset + 50, true);
    }
  }, [hasMore, loadingRules, debouncedSearchQuery, offset, fetchSemgrepRules]);

  // Add function to combine and store scan results
  const combineAndStoreResults = async (semgrepData: any, shiftleftData: any, codeqlData: any) => {
    try {
      // Extract vulnerabilities from each scan
      const semgrepVulns = semgrepData?.vulnerabilities || [];
      const shiftleftVulns = shiftleftData?.vulnerabilities || [];
      const codeqlVulns = codeqlData?.vulnerabilities || [];
      
      // Create a set to track unique vulnerabilities (prevent duplicates)
      // We'll use a simple approach to determine duplicates: combining check_id and path
      const uniqueVulnsMap = new Map();
      
      // Helper function to add vulnerabilities to our map with source tracking and enhanced details
      const addVulnsToMap = (vulns: any[], source: string) => {
        vulns.forEach(vuln => {
          // Generate a key for deduplication
          const key = `${vuln.check_id}:${vuln.path}:${vuln.start?.line || 0}`;
          
          // If we haven't seen this vulnerability or the current one has higher severity, add it
          if (!uniqueVulnsMap.has(key) || 
             (uniqueVulnsMap.get(key).severity === 'info' && vuln.severity !== 'info') ||
             (uniqueVulnsMap.get(key).severity === 'warning' && vuln.severity === 'error')) {
            
            // Add enhanced vulnerability details - make sure it's a proper object with all required fields
            const enhancedVuln = { 
              ...vuln,
              source,
              // Ensure these critical fields exist for backend processing
              check_id: vuln.check_id || `${source}-${Math.random().toString(36).substring(2)}`,
              path: vuln.path || "Unknown",
              start: vuln.start || { line: 0 },
              end: vuln.end || { line: 0 },
              extra: vuln.extra || {}
            };
            
            // Make sure extra object exists and has required fields
            if (!enhancedVuln.extra) {
              enhancedVuln.extra = {};
            }
            
            // Ensure message exists in extra
            if (!enhancedVuln.extra.message) {
              enhancedVuln.extra.message = vuln.message || 'Unknown vulnerability';
            }
            
            // Ensure severity exists and is normalized
            enhancedVuln.extra.severity = (enhancedVuln.extra.severity || vuln.severity || 'INFO').toUpperCase();
            
            // Generate a description if not present
            if (!enhancedVuln.extra.description) {
              enhancedVuln.extra.description = generateDescription(enhancedVuln, source);
            }
            
            // Add OWASP category mapping if available
            if (!enhancedVuln.extra.owasp_category) {
              const owaspMapping = mapToOwasp(enhancedVuln.check_id, enhancedVuln.extra?.message || '');
              if (owaspMapping) {
                enhancedVuln.extra.owasp_category = owaspMapping;
              }
            }
            
            // Add CWE mapping if available
            if (!enhancedVuln.extra.cwe_id) {
              const cweMapping = mapToCwe(enhancedVuln.check_id, enhancedVuln.extra?.message || '');
              if (cweMapping) {
                enhancedVuln.extra.cwe_id = cweMapping;
              }
            }
            
            // Always generate and set remediation regardless of whether one exists
            enhancedVuln.extra.remediation = generateRemediation(enhancedVuln, source);
            
            // Add references if not present
            // if (!enhancedVuln.extra.references) {
            //   enhancedVuln.extra.references = generateReferences(enhancedVuln, source);
            // }
            
            // Add the vulnerability to the map
            uniqueVulnsMap.set(key, enhancedVuln);
          }
        });
      };
      
      // Add all vulnerabilities to our map
      addVulnsToMap(semgrepVulns, 'Semgrep');
      addVulnsToMap(shiftleftVulns, 'ShiftLeft');
      addVulnsToMap(codeqlVulns, 'CodeQL');
      
      // Convert back to array
      const combinedVulns = Array.from(uniqueVulnsMap.values());
      
      // Calculate average security score
      const semgrepScore = semgrepData?.security_score || 0;
      const shiftleftScore = shiftleftData?.security_score || 0;
      const codeqlScore = codeqlData?.security_score || 0;
      
      // Only include scores that exist (non-zero)
      const scores = [
        semgrepScore > 0 ? semgrepScore : null,
        shiftleftScore > 0 ? shiftleftScore : null,
        codeqlScore > 0 ? codeqlScore : null
      ].filter(score => score !== null);
      
      const averageScore = scores.length > 0 
        ? scores.reduce((sum, score) => sum + (score || 0), 0) / scores.length 
        : 0;
      
      // Count severities in combined results
      const severityCount = {
        ERROR: combinedVulns.filter(v => v.severity === 'error' || v.extra?.severity === 'ERROR').length,
        WARNING: combinedVulns.filter(v => v.severity === 'warning' || v.extra?.severity === 'WARNING').length,
        INFO: combinedVulns.filter(v => v.severity === 'info' || v.extra?.severity === 'INFO').length
      };
      
      // Create the combined results object
      const combined = {
        file_name: uploadedFile?.name || '',
        security_score: averageScore,
        vulnerabilities: combinedVulns,
        severity_count: severityCount,
        total_vulnerabilities: combinedVulns.length,
        scan_timestamp: new Date().toISOString(),
        scan_metadata: {
          scan_type: 'Combined SAST',
          scan_sources: ['Semgrep', 'ShiftLeft', 'CodeQL'],
          individual_scores: {
            semgrep: semgrepScore,
            shiftleft: shiftleftScore,
            codeql: codeqlScore
          }
        }
      };
      
      // Store combined results in state
      setCombinedResults(combined);
      setScanResults(combined);
      
      // Store in database by sending to API
      try {
        // Log the combined object for debugging
        console.log('Sending combined results to API:', combined);
        console.log('Vulnerabilities being sent:', combined.vulnerabilities);
        console.log('Vulnerabilities length:', combined.vulnerabilities.length);
        
        // Make sure all vulnerabilities have the correct structure
        const sanitizedVulnerabilities = combined.vulnerabilities.map(vuln => {
          // Ensure all required fields are present and valid
          return {
            check_id: vuln.check_id || `generic-${Math.random().toString(36).substring(2)}`,
            path: vuln.path || "Unknown",
            start: vuln.start || { line: 0 },
            end: vuln.end || { line: 0 },
            extra: {
              message: vuln.extra?.message || vuln.message || "Unknown vulnerability",
              severity: (vuln.extra?.severity || vuln.severity || "INFO").toUpperCase(),
              description: vuln.extra?.description || "",
              remediation: vuln.extra?.remediation || "",
              ...(vuln.extra || {})
            },
            source: vuln.source || "Combined",
            severity: (vuln.severity || "INFO").toUpperCase()
          };
        });
        
        // Create a sanitized copy of the combined results
        const sanitizedCombined = {
          ...combined,
          vulnerabilities: sanitizedVulnerabilities
        };
        
        console.log('Sanitized vulnerabilities being sent:', sanitizedCombined.vulnerabilities);
        
        const response = await fetch('http://localhost:8000/api/v1/scan/combined-results', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(sanitizedCombined),
        });
        
        if (!response.ok) {
          console.error('Failed to store combined results in database');
          const errorText = await response.text();
          console.error('Error response:', errorText);
        } else {
          const responseData = await response.json();
          console.log('Successfully stored combined results, response:', responseData);
        }
      } catch (error) {
        console.error('Error storing combined results:', error);
      }
    } catch (error) {
      console.error('Error combining scan results:', error);
      // Use the CodeQL results as fallback if combining fails
      setScanResults(codeqlData);
    }
  };
  
  // Helper functions for generating additional vulnerability details
  const generateDescription = (vuln: any, source: string): string => {
    const checkId = vuln.check_id || '';
    const message = vuln.extra?.message || vuln.message || '';
    
    // Base description from the message
    let description = message;
    
    // Add more context based on vulnerability type
    if (message.toLowerCase().includes('sql injection')) {
      description += ` SQL injection vulnerabilities allow attackers to modify database queries, potentially leading to unauthorized data access, data manipulation, or system compromise. This could affect business operations and expose sensitive customer or company data.`;
    } else if (message.toLowerCase().includes('xss') || checkId.toLowerCase().includes('xss')) {
      description += ` Cross-site scripting (XSS) allows attackers to inject malicious scripts into web pages viewed by users. This could lead to session hijacking, credential theft, or malicious actions performed on behalf of the user.`;
    } else if (message.toLowerCase().includes('command injection') || checkId.toLowerCase().includes('command-injection')) {
      description += ` Command injection vulnerabilities can allow attackers to execute arbitrary system commands on the host operating system, potentially leading to complete system compromise, data theft, or service disruption.`;
    } else if (message.toLowerCase().includes('path traversal') || checkId.toLowerCase().includes('path-traversal')) {
      description += ` Path traversal vulnerabilities allow attackers to access files and directories outside of the intended directory, potentially exposing sensitive configuration files, credentials, or system files.`;
    } else if (message.toLowerCase().includes('ssrf') || checkId.toLowerCase().includes('ssrf')) {
      description += ` Server-Side Request Forgery (SSRF) allows attackers to induce the server to make requests to internal resources, potentially bypassing network controls and accessing internal services.`;
    }
    
    if (source === 'Semgrep') {
      description += ` This vulnerability was detected by static pattern matching in your code.`;
    } else if (source === 'CodeQL') {
      description += ` This vulnerability was identified through semantic code analysis.`;
    } else if (source === 'ShiftLeft') {
      description += ` This vulnerability was detected through program flow analysis.`;
    }
    
    return description;
  };
  
  const mapToOwasp = (checkId: string, message: string): string | null => {
    // Map the vulnerability to OWASP Top 10
    const lowerCheckId = checkId.toLowerCase();
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('injection') || lowerCheckId.includes('injection') || 
        lowerMessage.includes('sql') || lowerCheckId.includes('sql')) {
      return 'A1:2021-Injection';
    } else if (lowerMessage.includes('auth') || lowerCheckId.includes('auth') || 
               lowerMessage.includes('password') || lowerCheckId.includes('password')) {
      return 'A2:2021-Broken Authentication';
    } else if (lowerMessage.includes('xss') || lowerCheckId.includes('xss')) {
      return 'A3:2021-Cross-Site Scripting';
    } else if (lowerMessage.includes('access control') || lowerCheckId.includes('access-control')) {
      return 'A5:2021-Broken Access Control';
    } else if (lowerMessage.includes('serialize') || lowerCheckId.includes('serialize')) {
      return 'A8:2021-Insecure Deserialization';
    } else if (lowerMessage.includes('log') || lowerCheckId.includes('log')) {
      return 'A9:2021-Insufficient Logging & Monitoring';
    }
    
    return null;
  };
  
  const mapToCwe = (checkId: string, message: string): string | null => {
    // Map the vulnerability to CWE ID
    const lowerCheckId = checkId.toLowerCase();
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('sql injection') || lowerCheckId.includes('sql-injection')) {
      return 'CWE-89';
    } else if (lowerMessage.includes('xss') || lowerCheckId.includes('xss')) {
      return 'CWE-79';
    } else if (lowerMessage.includes('command injection') || lowerCheckId.includes('command-injection')) {
      return 'CWE-78';
    } else if (lowerMessage.includes('path traversal') || lowerCheckId.includes('path-traversal')) {
      return 'CWE-22';
    } else if (lowerMessage.includes('ssrf') || lowerCheckId.includes('ssrf')) {
      return 'CWE-918';
    } else if (lowerMessage.includes('hard-coded') || lowerCheckId.includes('hardcoded')) {
      return 'CWE-798';
    }
    
    return null;
  };
  
  const generateRemediation = (vuln: any, source: string): string => {
    const checkId = vuln.check_id || '';
    const message = vuln.extra?.message || vuln.message || '';
    const lowerMessage = message.toLowerCase();
    const lowerCheckId = checkId.toLowerCase();
    
    // Generate remediation guidance based on vulnerability type
    if (lowerMessage.includes('sql injection') || lowerCheckId.includes('sql-injection')) {
      return `Use parameterized queries or prepared statements instead of string concatenation for SQL queries. If using an ORM, ensure you're not using raw query methods with user input. Always validate and sanitize user input before using it in database operations.`;
    } else if (lowerMessage.includes('xss') || lowerCheckId.includes('xss')) {
      return `Sanitize and validate all user input before displaying it in HTML context. Use context-appropriate encoding (HTML, JavaScript, CSS, URL) when displaying user-controlled data. Consider using a Content Security Policy (CSP) as an additional layer of defense.`;
    } else if (lowerMessage.includes('command injection') || lowerCheckId.includes('command-injection')) {
      return `Avoid using shell commands with user input whenever possible. If necessary, use allowlists for permitted commands and arguments, and properly escape all user-provided inputs. Consider using language-specific APIs for the functionality instead of shell commands.`;
    } else if (lowerMessage.includes('path traversal') || lowerCheckId.includes('path-traversal')) {
      return `Validate and sanitize file paths provided by users. Use absolute paths with a whitelist of allowed directories. Normalize paths to remove ".." sequences before validation. Consider using a library designed for safe file operations.`;
    } else if (lowerMessage.includes('hardcoded') || lowerCheckId.includes('hardcoded')) {
      return `Remove hardcoded credentials from the code. Use a secure configuration management system or environment variables to store sensitive values. Consider using a secrets management service for production deployments.`;
    } else if (lowerMessage.includes('ssrf') || lowerCheckId.includes('ssrf')) {
      return `Implement strict URL validation using a whitelist of allowed domains, protocols, and ports. Avoid using user-controlled input in URL-fetching functions. Consider using a dedicated SSRF prevention library.`;
    } else if (lowerMessage.includes('deserialization') || lowerCheckId.includes('deserial')) {
      return `Never deserialize untrusted data. If deserialization is necessary, use safer alternatives like JSON or implement integrity checks. Run deserialization code with minimal privileges and in a sandbox if possible.`;
    } else if (lowerMessage.includes('crypto') || lowerMessage.includes('encrypt') || lowerMessage.includes('cipher')) {
      return `Use established cryptographic libraries and avoid implementing custom cryptographic algorithms. Ensure you are using strong encryption algorithms with proper key sizes and secure modes of operation.`;
    } else if (lowerMessage.includes('csrf') || lowerCheckId.includes('csrf')) {
      return `Implement anti-CSRF tokens in all forms and require them for all state-changing operations. Verify the origin of requests using strict same-origin policies. Use SameSite cookie attributes.`;
    } else if (lowerMessage.includes('auth') || lowerMessage.includes('password') || lowerCheckId.includes('auth')) { 
      return `Implement strong password policies, multi-factor authentication, and rate limiting for authentication attempts. Use secure, standard authentication frameworks instead of custom implementations.`;
    } else if (lowerMessage.includes('cors') || lowerCheckId.includes('cors')) {
      return `Restrict cross-origin resource sharing (CORS) to trusted domains only. Avoid using wildcard origins in production. Be careful with Access-Control-Allow-Credentials and ensure it's only used with specific origins.`;
    }
    
    // Determine source-specific recommendations
    if (source === 'Semgrep' && lowerMessage.includes('pattern')) {
      return `This pattern match indicates a potential security issue. Review the code to ensure it follows secure coding patterns and implement proper validation and sanitization of all inputs.`;
    } else if (source === 'CodeQL' && lowerMessage.includes('taint')) {
      return `This taint flow analysis indicates that untrusted data may reach a sensitive sink. Implement proper validation, sanitization, or encoding at the appropriate points in the data flow path.`;
    } else if (source === 'ShiftLeft' && lowerMessage.includes('leak')) {
      return `This analysis indicates a potential information leak. Ensure sensitive data is properly encrypted during transmission and storage, and implement appropriate access controls.`;
    }
    
    // Default remediation based on the severity
    if (vuln.severity === 'error' || vuln.extra?.severity === 'ERROR') {
      return `This is a high-severity issue that requires immediate attention. Review the code for security issues related to the reported vulnerability and implement proper input validation, output encoding, and strong access controls.`;
    } else if (vuln.severity === 'warning' || vuln.extra?.severity === 'WARNING') {
      return `This is a medium-severity issue that should be addressed. Implement appropriate security controls including data validation and proper error handling to mitigate this risk.`;
    }
    
    // Generic fallback
    return `Review the code for security issues related to the reported vulnerability. Implement proper input validation, output encoding, and access controls appropriate for this specific type of vulnerability.`;
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
                    <RuleFilters
                      severityFilter={severityFilter}
                      setSeverityFilter={setSeverityFilter}
                      languageFilter={languageFilter}
                      setLanguageFilter={setLanguageFilter}
                      categoryFilter={categoryFilter}
                      setCategoryFilter={setCategoryFilter}
                      languageDropdownOpen={languageDropdownOpen}
                      setLanguageDropdownOpen={setLanguageDropdownOpen}
                      categoryDropdownOpen={categoryDropdownOpen}
                      setCategoryDropdownOpen={setCategoryDropdownOpen}
                      scanTypeFilter={scanTypeFilter}
                      setScanTypeFilter={setScanTypeFilter}
                      scanTypeDropdownOpen={scanTypeDropdownOpen}
                      setScanTypeDropdownOpen={setScanTypeDropdownOpen}
                    />
                    
                    <SemgrepRuleSelector
                      selectedRule={selectedRule}
                      setSelectedRule={setSelectedRule}
                      ruleType={ruleType}
                      severityFilter={severityFilter}
                      languageFilter={languageFilter}
                      categoryFilter={categoryFilter}
                      scanTypeFilter={scanTypeFilter}
                    />
                    
                    {selectedRule && <RuleDetails selectedRule={selectedRule} />}
                  </Box>
                )}
                
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                  {/* Individual scan buttons are now hidden 
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
                  */}
                  
                  {/* Only show the "Run All SAST" button with enhanced styling */}
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
                </Box>
              </Box>
            )}
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
            {!isAnyScanLoading && combinedResults && !resultsButtonClicked && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
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
            <Typography variant="h6">
              {combinedResults ? 'Combined Security Analysis Results' : 
               scanResults?.scan_metadata?.scan_type === 'CodeQL' ? 'CodeQL Scan Results' : 
               scanResults?.scan_metadata?.scan_type === 'ShiftLeft' ? 'ShiftLeft Scan Results' : 
               'Security Scan Results'}
              {combinedResults && (
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
                {loadingSastUpload ? 'Uploading file for Semgrep scan...' : 
                 loadingSastProcessing ? 'Running Semgrep security analysis...' : 
                 loadingShiftLeftUpload ? 'Uploading file for ShiftLeft scan...' : 
                 loadingShiftLeftProcessing ? 'Running ShiftLeft security analysis...' : 
                 loadingCodeQLUpload ? 'Uploading file for CodeQL scan...' : 
                 loadingCodeQLProcessing ? 'Running CodeQL security analysis...' : 
                 'Running SAST security analysis...'}
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
          ) : scanResults && (
            <ScanResults results={scanResults} />
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
}

export default App; 