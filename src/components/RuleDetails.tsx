import React from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  Paper,
  Typography,
  useTheme
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import LaunchIcon from '@mui/icons-material/Launch';

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

  // Get author information
  const getAuthor = () => {
    return selectedRule.meta?.author || 
           selectedRule.metadata?.author || 
           'Unknown';
  };

  // Get rule type
  const getRuleType = () => {
    return selectedRule.rule_type ||
           selectedRule.meta?.rule?.rule_type ||
           selectedRule.definition?.rules?.[0]?.id ||
           'SAST';
  };

  // Get rule name - Extract the last part of the path directly
  const getRuleName = () => {
    // First priority: Check if path exists in the response
    if (selectedRule.path) {
      // Extract everything after the last dot or slash
      const pathParts = selectedRule.path.split(/[./]/);
      if (pathParts.length > 0) {
        return pathParts[pathParts.length - 1];
      }
    }
    
    // Second priority: Check for ID in definition
    if (selectedRule.definition?.rules?.[0]?.id) {
      return selectedRule.definition.rules[0].id;
    }
    
    // Third priority: Check for name field
    if (selectedRule.name) {
      return selectedRule.name;
    }
    
    // Last resort: Use ID
    return selectedRule.id || 'Unknown Rule';
  };

  // Get rule languages correctly from nested structure
  const getLanguages = () => {
    // Try to get languages from the top level
    if (selectedRule.languages && Array.isArray(selectedRule.languages) && selectedRule.languages.length > 0) {
      return selectedRule.languages;
    }
    
    // Try to get languages from definition.rules[0].languages
    if (selectedRule.definition?.rules?.[0]?.languages) {
      return selectedRule.definition.rules[0].languages;
    }
    
    return [];
  };

 

  // Get rule severity correctly with debug output
  const getSeverity = () => {
    // Log all possible places where severity might be defined
    console.log('Severity check:', {
      'selectedRule.severity': selectedRule.severity,
      'definition.rules[0].severity': selectedRule.definition?.rules?.[0]?.severity,
      'full definition rules': selectedRule.definition?.rules
    });
    
    // Try to get severity from definition.rules[0].severity first, as this seems to be most reliable
    if (selectedRule.definition?.rules?.[0]?.severity) {
      return selectedRule.definition.rules[0].severity;
    }
    
    // Fall back to selectedRule.severity or default to "INFO"
    return selectedRule.severity || "INFO";
  };

  // Display detailed CWE information if available
  const renderCweInfo = () => {
    const cweId = 
      selectedRule.cwe_id || 
      selectedRule.metadata?.cwe || 
      (selectedRule.meta && selectedRule.meta.cwe);
    
    if (!cweId) return null;
    
    return (
      <tr>
        <td style={{ padding: '4px 0', fontWeight: 'bold' }}>CWE:</td>
        <td>
          <Chip 
            label={`CWE-${cweId}`}
            color="error"
            size="small"
            sx={{ fontWeight: 'bold' }}
            component="a"
            href={`https://cwe.mitre.org/data/definitions/${cweId}.html`}
            target="_blank"
            clickable
          />
        </td>
      </tr>
    );
  };

  // Display detailed OWASP information if available
  const renderOwaspInfo = () => {
    const owaspInfo = 
      selectedRule.owasp || 
      selectedRule.metadata?.owasp || 
      (selectedRule.meta && selectedRule.meta.owasp);
    
    if (!owaspInfo) return null;
    
    return (
      <tr>
        <td style={{ padding: '4px 0', fontWeight: 'bold' }}>OWASP:</td>
        <td>
          <Chip 
            label={owaspInfo}
            color="warning"
            size="small"
            sx={{ fontWeight: 'bold' }}
          />
        </td>
      </tr>
    );
  };

  // Display detailed Language information
  const renderLanguagesInfo = () => {
    // Collect all possible language sources with priority
    const languagesFromMetaLanguages = (selectedRule.meta && Array.isArray(selectedRule.meta.languages)) 
      ? selectedRule.meta.languages 
      : [];
      
    const languagesFromLanguages = Array.isArray(selectedRule.languages) 
      ? selectedRule.languages 
      : [];
      
    // Combine unique languages from all sources
    const allLanguages = [...new Set([...languagesFromMetaLanguages, ...languagesFromLanguages])];
    
    if (allLanguages.length === 0) return null;
    
    return (
      <tr>
        <td style={{ padding: '4px 0', fontWeight: 'bold' }}>Languages:</td>
        <td>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {allLanguages.map((lang: string, idx: number) => (
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
    );
  };

  // Display references if available
  const renderReferences = () => {
    const references = selectedRule.references || selectedRule.metadata?.references || [];
    
    if (!references || references.length === 0) return null;
    
    return (
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle1" color="primary" gutterBottom>
          References
        </Typography>
        <Box sx={{ 
          p: 1, 
          borderRadius: 1, 
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)',
        }}>
          <ul style={{ margin: '0.5rem 0', paddingInlineStart: '1.5rem' }}>
            {references.map((ref: string, idx: number) => (
              <li key={idx} style={{ marginBottom: '0.25rem' }}>
                <a href={ref} target="_blank" rel="noopener noreferrer" style={{ color: theme.palette.primary.main }}>
                  {ref}
                </a>
              </li>
            ))}
          </ul>
        </Box>
      </Box>
    );
  };

  // Display detailed source code pattern information
  const renderPatternInfo = () => {
    const patterns = selectedRule.patterns || [];
    
    if (patterns.length === 0) return null;
    
    return (
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle1" color="primary" gutterBottom>
          Detection Patterns
        </Typography>
        <Box sx={{ 
          p: 1, 
          borderRadius: 1, 
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)',
          fontSize: '0.9rem',
          fontFamily: 'monospace',
          whiteSpace: 'pre-wrap',
          overflowX: 'auto'
        }}>
          {patterns.map((pattern: any, idx: number) => (
            <Box key={idx} sx={{ mb: 2 }}>
              <Typography variant="caption" fontWeight="bold" sx={{ display: 'block', mb: 0.5 }}>
                Pattern {idx + 1}:
              </Typography>
              <code>{typeof pattern === 'string' ? pattern : JSON.stringify(pattern, null, 2)}</code>
            </Box>
          ))}
        </Box>
      </Box>
    );
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
          <Typography variant="h6" color="">
            Rule Name: {getRuleName()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ID: <code>{selectedRule.id}</code>
          </Typography>
          {selectedRule.path && (
            <Typography variant="body2" color="text.secondary">
              Path: <code>{selectedRule.path}</code>
            </Typography>
          )}
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
      
      {/* Main content - simplified */}
      <Box sx={{ p: 2 }}>
        <Grid container spacing={2}>
          {/* Basic Details */}
          <Grid item xs={12}>
            <Box sx={{ 
              p: 2, 
              borderRadius: 1, 
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '8px 0', width: '30%', fontWeight: 'bold' }}>Rule Type:</td>
                    <td>
                      <Chip 
                        label={getRuleType()}
                        color="primary"
                        size="small"
                      />
                    </td>
                  </tr>
                  
                  <tr>
                    <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Author:</td>
                    <td>{getAuthor()}</td>
                  </tr>
                  
                  <tr>
                    <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Languages:</td>
                    <td>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {getLanguages().map((lang: string, idx: number) => (
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
                  
                  <tr>
                    <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Severity:</td>
                    <td>
                      <Chip 
                        label={getSeverity()}
                        color={
                          getSeverity().toLowerCase() === 'error' ? 'error' :
                          getSeverity().toLowerCase() === 'warning' ? 'warning' : 
                          getSeverity().toLowerCase() === 'info' ? 'info' : 'default'
                        }
                        size="small"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </Box>
          </Grid>
          
       
        </Grid>
      </Box>
      
      {/* Metadata section - removed heading */}
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
    </Paper>
  );
};

export default RuleDetails; 