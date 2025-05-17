import React from 'react';
import {
  Box,
  Chip,
  CircularProgress,
  Paper,
  Typography,
  useTheme
} from '@mui/material';

interface RuleDetailsProps {
  selectedRule: any;
  isLoading?: boolean;
}

const RuleDetails: React.FC<RuleDetailsProps> = ({ selectedRule, isLoading = false }) => {
  const theme = useTheme();

  if (isLoading) {
    return (
      <Paper 
        elevation={2} 
        sx={{ 
          mt: 3, 
          p: 4,
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '200px'
        }}
      >
        <CircularProgress size={40} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading rule details...
        </Typography>
      </Paper>
    );
  }

  if (!selectedRule) return null;

  // Get rule name
  const getRuleName = () => {
    if (selectedRule.name) {
      return selectedRule.name;
    }
    
    if (selectedRule.id) {
      return selectedRule.id;
    }
    
    return 'Unknown Rule';
  };

  // Get rule message
  const getMessage = () => {
    return selectedRule.message || 
           selectedRule.definition?.rules?.[0]?.message ||
           'No description available';
  };

  // Get rule severity
  const getSeverity = () => {
    if (selectedRule.definition?.rules?.[0]?.severity) {
      return selectedRule.definition.rules[0].severity;
    }
    
    return selectedRule.severity || "INFO";
  };

  return (
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
      {/* Header with rule name and severity */}
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
          <Typography variant="h6">
            {getRuleName()}
          </Typography>
        </Box>
        
        <Chip 
          label={getSeverity().toUpperCase()}
          color={
            getSeverity().toLowerCase() === 'error' ? 'error' :
            getSeverity().toLowerCase() === 'warning' ? 'warning' : 
            getSeverity().toLowerCase() === 'info' ? 'info' : 'default'
          }
          size="medium"
          sx={{ fontWeight: 'bold' }}
        />
      </Box>
      
      {/* Message content */}
      <Box sx={{ p: 3 }}>
        <Typography variant="body1">
          {getMessage()}
        </Typography>
      </Box>
    </Paper>
  );
};

export default RuleDetails; 