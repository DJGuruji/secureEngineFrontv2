// src/components/ScanResults.tsx
import React, { useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
  CircularProgress,
  Paper,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Badge,
} from '@mui/material';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import TimelineIcon from '@mui/icons-material/Timeline';
import SecurityIcon from '@mui/icons-material/Security';
import BugReportIcon from '@mui/icons-material/BugReport';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import TimerIcon from '@mui/icons-material/Timer';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { format } from 'date-fns';

/* ------------------------------------------------------------------ */
/*  helpers                                                           */
/* ------------------------------------------------------------------ */

const SeverityIcon = ({ severity }: { severity: string }) => {
  const normalizedSeverity = severity?.toUpperCase() || 'INFO';
  switch (normalizedSeverity) {
    case 'ERROR':
    case 'HIGH':
    case 'CRITICAL':
      return <ErrorIcon color="error" />;
    case 'WARNING':
    case 'MEDIUM':
    case 'MODERATE':
      return <WarningIcon color="warning" />;
    default:
      return <InfoIcon color="info" />;
  }
};

const RiskIndicator = ({ severity }: { severity: number }) => {
  const getColor = (v: number) => (v >= 0.8 ? 'error' : v >= 0.5 ? 'warning' : 'info');
  return (
    <Chip
      icon={<SecurityIcon />}
      label={`Risk: ${(severity * 100).toFixed(0)}%`}
      color={getColor(severity)}
      size="small"
    />
  );
};

/* ------------------------------------------------------------------ */
/*  interfaces                                                        */
/* ------------------------------------------------------------------ */

interface Vulnerability {
  check_id: string;
  path: string;
  start: { line: number; col?: number };
  end: { line: number; col?: number };
  message?: string;
  severity?: string;
  description?: string;
  code_snippet?: string;
  remediation?: string;
  extra?: {
    message?: string;
    severity?: string;
    metadata?: {
      owasp?: string;
      cwe?: string;
      category?: string;
    };
    description?: string;
    code_snippet?: string;
    remediation?: string;
  };
  risk_severity?: number;
  exploitability?: string;
  impact?: string;
  detection_timestamp?: string;
  source?: string;
}

interface ScanResultsProps {
  results: {
    security_score: number;
    vulnerabilities: Vulnerability[];
    severity_count: { ERROR: number; WARNING: number; INFO: number };
    scan_timestamp?: string;
    scan_duration?: number;
    scan_metadata?: {
      scan_start_time?: string;
      scan_end_time?: string;
      tool_version?: string;
      scan_type?: string;
      environment?: string;
      scan_mode?: string;
      scan_sources?: string[];
      individual_scores?: {
        semgrep?: number;
        shiftleft?: number;
        codeql?: number;
      };
    };
  };
}

/* ------------------------------------------------------------------ */
/*  main component                                                    */
/* ------------------------------------------------------------------ */

const ScanResults: React.FC<ScanResultsProps> = ({ results }) => {
  const [expandedPanel, setExpandedPanel] = useState<string | false>('vulnerable');

  const handlePanelChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedPanel(isExpanded ? panel : false);
  };

  const {
    security_score,
    vulnerabilities,
    severity_count,
    scan_timestamp,
    scan_duration,
    scan_metadata,
  } = results;

  // Check if this is a combined scan
  const isCombinedScan = scan_metadata?.scan_type?.includes('Combined');
  const isAIScan = scan_metadata?.scan_type?.includes('AI');
  const individualScores = isCombinedScan ? scan_metadata?.individual_scores : null;

  /* utilities */
  const formatDuration = (secs?: number) => {
    if (!secs && secs !== 0) return 'N/A';
    const m = Math.floor(secs / 60);
    const s = Math.round(secs % 60);
    return `${m}m ${s}s`;
  };
  const validDate = (d?: string) => (d && !isNaN(Date.parse(d)) ? new Date(d) : undefined);

  // Helper to get vulnerability message
  const getVulnMessage = (vuln: Vulnerability) => {
    return vuln.message || vuln.extra?.message || 'Unknown vulnerability';
  };

  // Helper to get vulnerability severity
  const getVulnSeverity = (vuln: Vulnerability) => {
    return (vuln.severity || vuln.extra?.severity || 'INFO').toUpperCase();
  };

  // Helper to get metadata
  const getVulnMetadata = (vuln: Vulnerability) => {
    return {
      owasp: vuln.extra?.metadata?.owasp,
      cwe: vuln.extra?.metadata?.cwe,
      category: vuln.extra?.metadata?.category || 'Security',
      description: vuln.description || vuln.extra?.description || vuln.message || vuln.extra?.message,
      code_snippet: vuln.code_snippet || vuln.extra?.code_snippet,
      remediation: vuln.remediation || vuln.extra?.remediation
    };
  };

  /* ------------------------------------------------------------------ */
  /* render                                                             */
  /* ------------------------------------------------------------------ */

  return (
    <Box>
      {/* ---------- top summary cards ---------- */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* security score */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Security Score
            </Typography>

            <Box
              sx={{
                position: 'relative',
                display: 'inline-flex',
                width: 120,
                height: 120,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                color: 'white',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <CircularProgress
                variant="determinate"
                value={security_score * 10}
                size={120}
                thickness={4}
                sx={{ position: 'absolute', color: 'white', opacity: 0.25 }}
              />
              <Typography variant="h3" component="div">
                {Math.floor(security_score)}/10
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* scan info */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Scan Information
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarTodayIcon color="action" />
                <Typography variant="body1">
                  Date:{' '}
                  {validDate(scan_timestamp)
                    ? format(validDate(scan_timestamp)!, 'PPP')
                    : 'N/A'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccessTimeIcon color="action" />
                <Typography variant="body1">
                  Time:{' '}
                  {validDate(scan_timestamp)
                    ? format(validDate(scan_timestamp)!, 'p')
                    : 'N/A'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TimerIcon color="action" />
                <Typography variant="body1">Duration: {formatDuration(scan_duration)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SecurityIcon color="action" />
                <Typography variant="body1">
                  {scan_metadata?.scan_sources ? 
                    `Tools Used: ${scan_metadata.scan_sources.join(', ')}` : 
                    `Scan Type: ${scan_metadata?.scan_type || 'SAST'}`
                  }
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* ---------- vulnerability summary ---------- */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Vulnerability Summary
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Chip icon={<ErrorIcon />} label={`${severity_count.ERROR} Vulnerabilities`} color="error" />
          <Chip icon={<WarningIcon />} label={`${severity_count.WARNING} Warnings`} color="warning" />
          <Chip icon={<InfoIcon />} label={`${severity_count.INFO} Info`} color="info" />
        </Box>
      </Paper>

      <Divider sx={{ my: 2 }} />

      {/* ---------- detailed findings ---------- */}
      <Typography variant="h6" gutterBottom>
        Detailed Findings
      </Typography>

      {(!vulnerabilities || vulnerabilities.length === 0) ? (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography color="text.secondary">No vulnerability details available</Typography>
        </Box>
      ) : (
        <List>
          {vulnerabilities.map((vuln, idx) => (
            <React.Fragment key={idx}>
              <ListItem alignItems="flex-start" sx={{ flexDirection: 'column', py: 2 }}>
                {/* Header with severity and title */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', mb: 1 }}>
                  <SeverityIcon severity={getVulnSeverity(vuln)} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    {getVulnMessage(vuln)}
                  </Typography>
                </Box>
                
                {/* Vulnerability details in card format */}
                <Card variant="outlined" sx={{ width: '100%', mt: 1 }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    {/* Risk metrics row */}
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                      {vuln.risk_severity !== undefined && (
                        <RiskIndicator severity={vuln.risk_severity} />
                      )}
                      {vuln.exploitability && (
                        <Chip
                          icon={<BugReportIcon sx={{ fontSize: '1.2rem' }} />}
                          label={`Exploitability: ${vuln.exploitability}`}
                          size="small"
                        />
                      )}
                      {vuln.impact && (
                        <Chip
                          icon={<TimelineIcon sx={{ fontSize: '1.2rem' }} />}
                          label={`Impact: ${vuln.impact}`}
                          size="small"
                        />
                      )}
                      
                      {/* OWASP/CWE mapping if available */}
                      {getVulnMetadata(vuln).owasp && (
                        <Chip
                          label={`OWASP: ${getVulnMetadata(vuln).owasp}`}
                          color="secondary"
                          size="small"
                        />
                      )}
                      {getVulnMetadata(vuln).cwe && (
                        <Chip
                          label={`CWE: ${getVulnMetadata(vuln).cwe}`}
                          color="info"
                          size="small"
                        />
                      )}
                    </Box>
                    
                    {/* Location information */}
                    <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                      Location: {vuln.path}:{vuln.start.line}-{vuln.end.line}
                    </Typography>
                    
                    {/* Description with business context */}
                    {getVulnMetadata(vuln).description && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                          📜 Description
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, ml: 1 }}>
                          {getVulnMetadata(vuln).description}
                        </Typography>
                      </Box>
                    )}
                    
                    {/* Evidence/Code snippet */}
                    {getVulnMetadata(vuln).code_snippet && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                          🔎 Evidence
                        </Typography>
                        <Paper 
                          variant="outlined" 
                          sx={{ 
                            mt: 0.5, 
                            ml: 1, 
                            p: 1, 
                            backgroundColor: 'grey.100', 
                            fontSize: '0.875rem',
                            fontFamily: 'monospace',
                            overflow: 'auto',
                            maxHeight: '150px'
                          }}
                        >
                          <pre style={{ margin: 0 }}>{getVulnMetadata(vuln).code_snippet}</pre>
                        </Paper>
                      </Box>
                    )}
                    
                    {/* Remediation guidance */}
                    {getVulnMetadata(vuln).remediation && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                          ✅ Suggested Remediation
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, ml: 1 }}>
                          {getVulnMetadata(vuln).remediation}
                        </Typography>
                      </Box>
                    )}
                    
                    {/* Metadata and detection info */}
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                      <Typography variant="caption" color="text.secondary">
                        Check ID: {vuln.check_id}
                      </Typography>
                      {vuln.detection_timestamp && (
                        <Typography variant="caption" color="text.secondary">
                          Detected:{' '}
                          {validDate(vuln.detection_timestamp)
                            ? format(validDate(vuln.detection_timestamp)!, 'PPpp')
                            : 'N/A'}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </ListItem>
              {idx < vulnerabilities.length - 1 && <Divider component="li" />}
            </React.Fragment>
          ))}
        </List>
      )}
    </Box>
  );
};

export default ScanResults;
