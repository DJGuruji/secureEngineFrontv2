import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Autocomplete,
  Box,
  CircularProgress,
  Grid,
  IconButton,
  Paper,
  TextField,
  Typography,
  useTheme,
  InputAdornment
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ClearIcon from '@mui/icons-material/Clear';
import axios from 'axios';

interface SemgrepRuleSelectorProps {
  selectedRule: any;
  setSelectedRule: (rule: any) => void;
  ruleType: 'auto' | 'custom';
  // We keep these props for compatibility but they won't be used
  languageFilter?: string[];
  severityFilter?: string;
  categoryFilter?: string[];
  scanTypeFilter?: string[];
  setRuleDetailsLoading?: (loading: boolean) => void;
}

const SemgrepRuleSelector: React.FC<SemgrepRuleSelectorProps> = ({
  selectedRule,
  setSelectedRule,
  ruleType,
  setRuleDetailsLoading
}) => {
  const theme = useTheme();
  const [semgrepRules, setSemgrepRules] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingRules, setLoadingRules] = useState(false);
  const [loadingRuleDetails, setLoadingRuleDetails] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalRules, setTotalRules] = useState(0);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  const [tempSelectedRule, setTempSelectedRule] = useState<any>(null);
  
  const autocompleteRef = useRef<HTMLDivElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  // Handle search query with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  // Add function to fetch semgrep rules
  const fetchSemgrepRules = useCallback(async (query: string = '', newOffset: number = 0, append: boolean = false) => {
    try {
      setLoadingRules(true);
      
      // Simplified parameters, no filtering
      const params: any = {
        query: query || undefined,
        limit: 50,
        offset: newOffset
      };
      
      const response = await axios.get(`http://localhost:8000/api/v1/scan/semgrep-rules`, {
        params
      });
      
      // Type assertion to fix TypeScript errors
      const responseData = response.data as {
        rules: any[],
        total: number,
        has_more: boolean
      };
      
      const { rules, total, has_more } = responseData;
      
      // Don't filter out incomplete rules - just ensure they have an ID
      let validRules = rules.filter((rule: any) => rule.id);
      
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
  }, []);
  
  // Fetch rules when component mounts or when query changes
  useEffect(() => {
    // Reset pagination when query changes
    setOffset(0);
    setHasMore(true);
    fetchSemgrepRules(debouncedSearchQuery, 0, false);
  }, [debouncedSearchQuery, fetchSemgrepRules]);
  
  // Handle infinite scroll
  const handleScroll = useCallback((event: React.UIEvent<HTMLUListElement>) => {
    if (!hasMore || loadingRules) return;
    
    const listbox = event.currentTarget;
    if (listbox.scrollTop + listbox.clientHeight >= listbox.scrollHeight - 100) {
      // We're close to the bottom, load more rules
      fetchSemgrepRules(debouncedSearchQuery, offset + 50, true);
    }
  }, [hasMore, loadingRules, debouncedSearchQuery, offset, fetchSemgrepRules]);
  
  // Function to fetch a specific rule by ID
  const fetchRuleById = useCallback(async (ruleId: string) => {
    try {
      setLoadingRuleDetails(true);
      if (setRuleDetailsLoading) setRuleDetailsLoading(true);
      
      // Try to find the rule in the already loaded rules first
      const existingRule = semgrepRules.find(rule => rule.id === ruleId);
      if (existingRule) {
        setSelectedRule(existingRule);
        return;
      }
      
      // If not found, fetch from API
      const response = await axios.get(`http://localhost:8000/api/v1/scan/semgrep-rule/${ruleId}`);
      setSelectedRule(response.data);
    } catch (error) {
      console.error('Error fetching rule details:', error);
    } finally {
      setLoadingRuleDetails(false);
      if (setRuleDetailsLoading) setRuleDetailsLoading(false);
    }
  }, [semgrepRules, setSelectedRule, setRuleDetailsLoading]);
  
  const handleRuleSelect = useCallback((event: React.SyntheticEvent, value: any) => {
    if (value && value.id) {
      console.log("Selected rule:", value);
      fetchRuleById(value.id);
    } else {
      setSelectedRule(null);
    }
  }, [fetchRuleById, setSelectedRule]);
  
  // Function to clear the selected rule
  const handleClearRule = useCallback(() => {
    setSelectedRule(null);
    setTempSelectedRule(null);
    setSearchQuery('');
  }, [setSelectedRule]);
  
  // Function to get label for a rule
  const getRuleLabel = (rule: any) => {
    const id = rule.id || "Unknown ID";
    const name = rule.name || id;
    const category = rule.category || (rule.metadata && rule.metadata.category) || "";
    const severity = rule.severity || (rule.metadata && rule.metadata.severity) || "UNKNOWN";
    
    return `${name} (${category ? category + " - " : ""}${severity})`;
  };
  
  // Function to get icon for a rule based on its category
  const getRuleIcon = (rule: any) => {
    const category = (rule.category || "").toLowerCase();
    
    if (category.includes("secur") || category.includes("inject") || category.includes("xss")) {
      return <SecurityIcon color="error" fontSize="small" />;
    } else if (category.includes("perf") || category.includes("optimiz")) {
      return <SpeedIcon color="warning" fontSize="small" />;
    } else {
      return <CheckCircleIcon color="info" fontSize="small" />;
    }
  };
  
  return (
    <Paper 
      elevation={1} 
      sx={{ 
        p: 2.5, 
        borderRadius: 2,
        background: theme.palette.mode === 'dark' 
          ? 'rgba(36,36,36,0.9)' 
          : 'linear-gradient(to right, rgba(250,250,255,0.9), rgba(245,245,255,0.7))',
        border: `1px solid ${theme.palette.divider}`
      }}
    >
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography 
              variant="subtitle1" 
              fontWeight="bold" 
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                color: theme.palette.text.primary,
              }}
            >
              <SecurityIcon 
                sx={{ 
                  mr: 1, 
                  color: theme.palette.primary.main
                }} 
              />
              Select Semgrep Rule
            </Typography>
            
            {selectedRule && (
              <IconButton 
                size="small" 
                onClick={handleClearRule}
                color="primary"
                sx={{ 
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'
                  }
                }}
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
          
          <Autocomplete
            id="semgrep-rule-selector"
            options={semgrepRules}
            getOptionLabel={(option) => getRuleLabel(option)}
            value={tempSelectedRule}
            onChange={handleRuleSelect}
            loading={loadingRules}
            filterOptions={(x) => x} // Disable client-side filtering, we're using the API
            onInputChange={(event, newInputValue) => {
              if (event) {
                setSearchQuery(newInputValue);
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                placeholder="Search for rules..."
                fullWidth
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <>
                      {loadingRules ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: theme.palette.background.paper,
                    '&.Mui-focused': {
                      borderColor: theme.palette.primary.main,
                      boxShadow: `0 0 0 2px ${theme.palette.primary.main}25`
                    }
                  }
                }}
              />
            )}
            renderOption={(props, option) => (
              <li {...props}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Box sx={{ mr: 1 }}>{getRuleIcon(option)}</Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" fontWeight="bold">{option.name || option.id}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {option.category || (option.metadata && option.metadata.category) || "General"}
                    </Typography>
                  </Box>
                  <Box 
                    sx={{ 
                      borderRadius: 1, 
                      px: 0.8, 
                      py: 0.2, 
                      fontSize: '0.7rem', 
                      fontWeight: 'bold',
                      backgroundColor: option.severity === 'ERROR' || option.severity === 'HIGH'
                        ? 'error.main'
                        : option.severity === 'WARNING' || option.severity === 'MEDIUM'
                        ? 'warning.main'
                        : 'info.main',
                      color: 'white'
                    }}
                  >
                    {option.severity || "INFO"}
                  </Box>
                </Box>
              </li>
            )}
            ListboxProps={{
              ref: listboxRef,
              onScroll: handleScroll
            }}
            sx={{ 
              width: '100%',
              '& .MuiAutocomplete-listbox': {
                maxHeight: '350px',
                scrollbarWidth: 'thin',
                '&::-webkit-scrollbar': {
                  width: '6px',
                },
                '&::-webkit-scrollbar-track': {
                  background: theme.palette.mode === 'dark' ? '#333' : '#f1f1f1',
                  borderRadius: '10px'
                },
                '&::-webkit-scrollbar-thumb': {
                  background: theme.palette.mode === 'dark' ? '#666' : '#888',
                  borderRadius: '10px',
                  '&:hover': {
                    background: theme.palette.mode === 'dark' ? '#555' : '#777'
                  }
                }
              }
            }}
          />
          
          {/* Rule counter */}
          <Typography 
            variant="caption" 
            sx={{ 
              display: 'block', 
              textAlign: 'right', 
              color: 'text.secondary', 
              mt: 1 
            }}
          >
            {loadingRules 
              ? 'Loading rules...' 
              : `Showing ${semgrepRules.length} of ${totalRules} rules`}
          </Typography>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default SemgrepRuleSelector; 