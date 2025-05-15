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
  languageFilter: string[];
  severityFilter: string;
  categoryFilter: string[];
  scanTypeFilter: string[];
  setRuleDetailsLoading?: (loading: boolean) => void;
}

const SemgrepRuleSelector: React.FC<SemgrepRuleSelectorProps> = ({
  selectedRule,
  setSelectedRule,
  ruleType,
  languageFilter,
  severityFilter,
  categoryFilter,
  scanTypeFilter,
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
      
      // Build filter parameters
      const params: any = {
        query: query || undefined,
        limit: 50,
        offset: newOffset
      };
      
      // Add rule_type filter if there's only one selected
      if (scanTypeFilter.length === 1) {
        params.rule_type = scanTypeFilter[0];
        console.log(`SemgrepRuleSelector: Sending rule_type filter to backend: ${scanTypeFilter[0]}`);
      }
      
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
      
      // Log comprehensive information about received rules
      console.log(`Received ${rules?.length || 0} rules from API`);
      
      // Log structure of first rule to help debugging
      if (rules && rules.length > 0) {
        console.log('First rule structure:', rules[0]);
        console.log('Languages in first rule:', rules[0].languages);
        console.log('Meta object in first rule:', rules[0].meta);
        console.log('Rule type in first rule:', rules[0].rule_type);
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
      
      // Apply client-side filtering for scan types (rule_type)
      if (scanTypeFilter.length > 0) {
        validRules = validRules.filter((rule: any) => {
          // Check the rule_type field directly at the root level
          if (rule.rule_type) {
            const ruleType = rule.rule_type.toLowerCase();
            return scanTypeFilter.some(type => 
              ruleType === type.toLowerCase());
          }
          
          return false;
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
  }, [languageFilter, scanTypeFilter]);
  
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

  const handleRuleSelection = async (event: any, newValue: any) => {
    if (newValue && newValue.id) {
      try {
        // Immediately set loading state
        setLoadingRuleDetails(true);
        // Notify parent component of loading state
        if (setRuleDetailsLoading) setRuleDetailsLoading(true);
        
        // Store the basic rule info temporarily so it shows in the search bar
        setTempSelectedRule(newValue);
        
        // Clear existing rule to show loading spinner instead of old rule details
        setSelectedRule(null);
        
        // Store the ID for the API call
        const ruleId = newValue.id;
        
        console.log(`Fetching detailed rule information for ID: ${ruleId}`);
        
        // Fetch detailed rule information using ID
        const response = await axios.get(`http://localhost:8000/api/v1/scan/semgrep-rule/${ruleId}`);
        
        // Type assertion for response data
        const responseData = response.data as any;
        
        // Log the response structure for debugging
        console.log('API response structure:', Object.keys(responseData));
        console.log('API response data:', responseData);
        
        // Check for languages in the API response
        if (responseData.definition && responseData.definition.rules && responseData.definition.rules.length > 0) {
          console.log('Languages in definition:', responseData.definition.rules[0].languages);
        }
        
        // Only set the selected rule after we have the detailed information
        if (responseData) {
          // Ensure the ID from the list is preserved
          const detailedRule = {
            ...responseData,
            id: ruleId
          };
          
          console.log('Detailed rule structure:', Object.keys(detailedRule));
          console.log('Rule path:', detailedRule.path);
          
          // Now set the selected rule with complete details
          setSelectedRule(detailedRule);
        }
      } catch (error) {
        console.error('Error fetching detailed rule information:', error);
        // If there's an error, still keep the basic rule info in the search bar
        setSelectedRule(newValue);
      } finally {
        setLoadingRuleDetails(false);
        // Notify parent component loading is complete
        if (setRuleDetailsLoading) setRuleDetailsLoading(false);
        // Clear the temporary selection
        setTempSelectedRule(null);
      }
    } else {
      // If no rule is selected, clear the selection
      setSelectedRule(null);
      setTempSelectedRule(null);
    }
  };

  return (
    <>
      <Autocomplete
        id="semgrep-rules"
        options={semgrepRules}
        loading={loadingRules}
        value={tempSelectedRule || selectedRule}
        onChange={handleRuleSelection}
        getOptionLabel={(option) => option?.id || ''}
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
                  {(loadingRules || loadingRuleDetails) ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
            onChange={(e) => {
              setSearchQuery(e.target.value);
            }}
            helperText={loadingRuleDetails ? "Loading rule details..." : `Search and select a rule from the Semgrep registry (${semgrepRules.length} of ${totalRules} rules loaded)`}
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
                      label={`id:${option.id}`} 
                      variant="outlined" 
                      color="primary"
                    />
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
                      label={`id:${option.id}`} 
                      variant="outlined" 
                      color="primary"
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
    </>
  );
};

export default SemgrepRuleSelector; 