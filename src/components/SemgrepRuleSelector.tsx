import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Autocomplete,
  Box,
  Chip,
  CircularProgress,
  Grid,
  ListSubheader,
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
import LaunchIcon from '@mui/icons-material/Launch';
import axios from 'axios';

interface SemgrepRuleSelectorProps {
  selectedRule: any;
  setSelectedRule: (rule: any) => void;
  ruleType: 'auto' | 'custom';
  severityFilter: string;
  languageFilter: string[];
  categoryFilter: string[];
}

const SemgrepRuleSelector: React.FC<SemgrepRuleSelectorProps> = ({
  selectedRule,
  setSelectedRule,
  ruleType,
  severityFilter,
  languageFilter,
  categoryFilter
}) => {
  const theme = useTheme();
  const [semgrepRules, setSemgrepRules] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingRules, setLoadingRules] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalRules, setTotalRules] = useState(0);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  
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

  return (
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
  );
};

export default SemgrepRuleSelector; 