import React, { useState, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';
import { Typography, Autocomplete, TextField, CircularProgress, Box } from '@mui/material';

interface SemgrepRulesResponse {
  rules: any[];
  total: number;
  has_more: boolean;
}

interface RuleManagementProps {
  selectedRule: any | null;
  setSelectedRule: (rule: any | null) => void;
  ruleType: 'auto' | 'custom';
  severityFilter: string;
  languageFilter: string[];
  categoryFilter: string[];
  scanTypeFilter: string[];
}

const RuleManagement: React.FC<RuleManagementProps> = ({
  selectedRule,
  setSelectedRule,
  ruleType,
  severityFilter,
  languageFilter,
  categoryFilter,
  scanTypeFilter
}) => {
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
  
  // Function to fetch semgrep rules
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
      }
      
      const response = await axios.get<SemgrepRulesResponse>(`http://localhost:8000/api/v1/scan/semgrep-rules`, {
        params
      });
      
      const newRules = response.data.rules || [];
      setTotalRules(response.data.total || 0);
      setHasMore(response.data.has_more || false);
      
      // Log comprehensive information about received rules
      console.log(`Received ${newRules?.length || 0} rules from API`);
      
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
        validRules = validRules.filter((rule: any) => {
          // Check the rule_type field directly at the root level
          if (rule.rule_type) {
            const ruleType = rule.rule_type.toLowerCase();
            return scanTypeFilter.some(type => 
              ruleType === type.toLowerCase());
          }
          
          // Fallback checks in other locations
          // Check in rule.meta.metadata.type field if it exists
          if (rule.meta && rule.meta.metadata && rule.meta.metadata.type) {
            const ruleType = rule.meta.metadata.type.toLowerCase();
            return scanTypeFilter.some(type => 
              ruleType === type.toLowerCase());
          }
          
          // Check in rule.metadata.type field if it exists
          if (rule.metadata && rule.metadata.type) {
            const ruleType = rule.metadata.type.toLowerCase();
            return scanTypeFilter.some(type => 
              ruleType === type.toLowerCase());
          }
          
          // Check in rule.id field for common scan type identifiers
          if (rule.id) {
            const ruleId = rule.id.toLowerCase();
            return scanTypeFilter.some(type => 
              ruleId.includes(type.toLowerCase()));
          }
          
          return false;
        });
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
  
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle1" gutterBottom>
        Select a Semgrep Rule
      </Typography>
      <Autocomplete
        ref={autocompleteRef}
        options={semgrepRules}
        getOptionLabel={(option) => option.id || 'Unknown'}
        filterOptions={(x) => x} // Disable built-in filtering as we handle it on the server
        loading={loadingRules}
        value={selectedRule}
        onChange={(_, newValue) => setSelectedRule(newValue)}
        onInputChange={(_, newInputValue) => setSearchQuery(newInputValue)}
        isOptionEqualToValue={(option, value) => option.id === value?.id}
        ListboxProps={{ 
          // @ts-ignore - for handling infinite scroll
          onScroll: handleScroll,
          ref: listboxRef
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Search Semgrep Rules"
            placeholder="Type to search rules..."
            variant="outlined"
            fullWidth
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loadingRules ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        renderOption={(props, option) => (
          <li {...props} key={option.id}>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography variant="body1" fontWeight="medium">
                {option.id}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                {option.message}
              </Typography>
              {option.severity && (
                <Box 
                  component="span" 
                  sx={{ 
                    mt: 0.5,
                    fontSize: '0.75rem',
                    backgroundColor: 
                      option.severity.toLowerCase() === 'error' ? 'error.light' : 
                      option.severity.toLowerCase() === 'warning' ? 'warning.light' : 'info.light',
                    color: 'white',
                    px: 1,
                    py: 0.25,
                    borderRadius: 1,
                    display: 'inline-block',
                    width: 'fit-content'
                  }}
                >
                  {option.severity.toUpperCase()}
                </Box>
              )}
            </Box>
          </li>
        )}
      />
      {totalRules > 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Showing {semgrepRules.length} of {totalRules} rules {hasMore ? '(scroll for more)' : ''}
        </Typography>
      )}
    </Box>
  );
};

export default RuleManagement; 