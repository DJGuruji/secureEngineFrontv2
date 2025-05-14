import React from 'react';
import {
  Box,
  Chip,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  InputLabel,
  ListSubheader,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  Typography,
  useTheme
} from '@mui/material';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface RuleFiltersProps {
  severityFilter: string;
  setSeverityFilter: (value: string) => void;
  languageFilter: string[];
  setLanguageFilter: (value: string[]) => void;
  categoryFilter: string[];
  setCategoryFilter: (value: string[]) => void;
  languageDropdownOpen: boolean;
  setLanguageDropdownOpen: (value: boolean) => void;
  categoryDropdownOpen: boolean;
  setCategoryDropdownOpen: (value: boolean) => void;
}

const RuleFilters: React.FC<RuleFiltersProps> = ({
  severityFilter,
  setSeverityFilter,
  languageFilter,
  setLanguageFilter,
  categoryFilter,
  setCategoryFilter,
  languageDropdownOpen,
  setLanguageDropdownOpen,
  categoryDropdownOpen,
  setCategoryDropdownOpen
}) => {
  const theme = useTheme();

  return (
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
                    
                    if (value === 'security') {
                      chipColor = 'error';
                    } else if (value === 'performance') {
                      chipColor = 'warning';
                    } else if (value === 'best-practice') {
                      chipColor = 'success';
                    }
                    
                    return (
                      <Chip 
                        key={value} 
                        label={value} 
                        size="small"
                        color={chipColor}
                        onDelete={() => {
                          setCategoryFilter(prev => prev.filter(item => item !== value));
                        }}
                        sx={{
                          borderRadius: '16px',
                          transition: 'all 0.2s ease'
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
  );
};

export default RuleFilters; 