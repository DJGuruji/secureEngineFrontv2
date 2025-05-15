import React from 'react';import {  Box,  Chip,  FormControl,  FormControlLabel,  FormLabel,  Grid,  InputLabel,  ListSubheader,  MenuItem,  Paper,  Radio,  RadioGroup,  Select,  Typography,  useTheme} from '@mui/material';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface RuleFiltersProps {
  languageFilter: string[];
  setLanguageFilter: (value: string[]) => void;
  languageDropdownOpen: boolean;
  setLanguageDropdownOpen: (value: boolean) => void;
  scanTypeFilter?: string[];
  setScanTypeFilter?: (value: string[]) => void;
  scanTypeDropdownOpen?: boolean;
  setScanTypeDropdownOpen?: (value: boolean) => void;
  severityFilter?: string;
  setSeverityFilter?: (value: string) => void;
  categoryFilter?: string[];
  setCategoryFilter?: (value: string[]) => void;
  categoryDropdownOpen?: boolean;
  setCategoryDropdownOpen?: (value: boolean) => void;
}



const RuleFilters: React.FC<RuleFiltersProps> = ({
  languageFilter,
  setLanguageFilter,
  languageDropdownOpen,
  setLanguageDropdownOpen,
  scanTypeFilter = [],
  setScanTypeFilter = () => {},
  scanTypeDropdownOpen = false,
  setScanTypeDropdownOpen = () => {},
  severityFilter,
  setSeverityFilter,
  categoryFilter = [],
  setCategoryFilter = () => {},
  categoryDropdownOpen = false,
  setCategoryDropdownOpen = () => {},
}) => {
  const theme = useTheme();

  

  // Custom styles for menu items
  const menuItemStyle = {
    py: 0.25, // Minimal vertical padding
    px: 2, // Standard horizontal padding
    my: 0, // No vertical margin
    minHeight: 'auto', // Override any min-height
    lineHeight: 1.2, // Reduce line height
    '&:hover': {
      backgroundColor: theme.palette.mode === 'dark' 
        ? 'rgba(255, 255, 255, 0.08)' 
        : 'rgba(0, 0, 0, 0.04)'
    }
  };

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
     
    
      <Grid container spacing={3}>
       
        
        {/* Language Filter */}
        <Grid item xs={12} sm={4}>
          <Box 
            sx={{ 
              p: 3, 
              bgcolor: 'background.paper', 
              borderRadius: 2,
              boxShadow: theme.shadows[1],
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative', // Add relative positioning
              zIndex: 1 // Ensure proper stacking context
            }}
          >
            <FormControl fullWidth>
              <InputLabel 
                sx={{ 
                  fontWeight: 'bold', 
                  color: 'primary.main',
                  zIndex: 2, // Ensure label is above content
                  position: 'absolute',
                  top: '-6px',
                  backgroundColor: 'background.paper',
                  padding: '0 4px'
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
                  height: 'auto',
                  minHeight: '30px',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.divider
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.primary.main
                  },
                  // Reduce padding on the select itself
                  '& .MuiSelect-select': {
                    padding: '4px 14px',
                    minHeight: 'initial',
                    lineHeight: 1.5,
                    display: 'flex',
                    alignItems: 'center'
                  },
                  // Force correct list position
                  '& .MuiMenu-paper': {
                    marginTop: '0px !important'
                  }
                }}
                MenuProps={{
                  // Positioning
                  anchorOrigin: {
                    vertical: 'bottom',
                    horizontal: 'left',
                  },
                  transformOrigin: {
                    vertical: 'top',
                    horizontal: 'left',
                  },
                  // Menu appearance
                  PaperProps: {
                    style: {
                      maxHeight: 300,
                      marginTop: '0px', // No margin at all
                      borderRadius: 8,
                      padding: 0
                    }
                  }
                }}
              >
                <ListSubheader sx={{ 
                  bgcolor: 'background.paper', 
                  fontWeight: 'bold', 
                  color: 'primary.main',
                  py: 0.5 // Reduce padding
                }}>
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
                    sx={{
                      ...menuItemStyle,
                      py: 0.5, // Reduce vertical padding
                      my: 0, // Remove margins
                      lineHeight: '1.2' // Decrease line height
                    }}
                  >
                    {lang.charAt(0).toUpperCase() + lang.slice(1)}
                  </MenuItem>
                ))}
                
                <ListSubheader sx={{ 
                  bgcolor: 'background.paper', 
                  fontWeight: 'bold', 
                  color: 'primary.main',
                  py: 0.5 // Reduce padding
                }}>
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
                    sx={{
                      ...menuItemStyle,
                      py: 0.5, // Reduce vertical padding
                      my: 0, // Remove margins
                      lineHeight: '1.2' // Decrease line height
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
                        // Direct approach without callback to avoid TypeScript errors
                        const newFilters = languageFilter.filter(item => item !== value);
                        setLanguageFilter(newFilters);
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
      </Grid>
    </Paper>
  );
};

export default RuleFilters; 