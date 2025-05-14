import React from 'react';
import {
  Box,
  Button,
  Chip,
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
}

const RuleDetails: React.FC<RuleDetailsProps> = ({ selectedRule }) => {
  const theme = useTheme();

  if (!selectedRule) return null;

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
                  {/* Languages - Priority given to meta.languages */}
                  {(selectedRule.meta && Array.isArray(selectedRule.meta.languages) && selectedRule.meta.languages.length > 0) || 
                   (Array.isArray(selectedRule.languages) && selectedRule.languages.length > 0) ? (
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
                  ) : null}
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
        </Grid>
      </Box>
    </Paper>
  );
};

export default RuleDetails; 