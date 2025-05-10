// src/components/ScanResults.tsx
import React from 'react';
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
import { format } from 'date-fns';

/* ------------------------------------------------------------------ */
/*  helpers                                                           */
/* ------------------------------------------------------------------ */

const SeverityIcon = ({ severity }: { severity: string }) => {
  switch (severity) {
    case 'ERROR':
      return <ErrorIcon color="error" />;
    case 'WARNING':
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
/*  main component                                                    */
/* ------------------------------------------------------------------ */

interface ScanResultsProps {
  results: {
    security_score: number;
    vulnerabilities: Array<{
      check_id: string;
      path: string;
      start: { line: number };
      end: { line: number };
      extra: { message: string; severity: string };
      risk_severity: number;
      exploitability: string;
      impact: string;
      detection_timestamp: string;
    }>;
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
    };
  };
}

const ScanResults: React.FC<ScanResultsProps> = ({ results }) => {
  const {
    security_score,
    vulnerabilities,
    severity_count,
    scan_timestamp,
    scan_duration,
    scan_metadata,
  } = results;

  /* utilities */
  const formatDuration = (secs?: number) => {
    if (!secs && secs !== 0) return 'N/A';
    const m = Math.floor(secs / 60);
    const s = Math.round(secs % 60);
    return `${m}m ${s}s`;
  };
  const validDate = (d?: string) => (d && !isNaN(Date.parse(d)) ? new Date(d) : undefined);

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
                {security_score}/10
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
                  Scan Type: {scan_metadata?.scan_type ?? 'SAST'}
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
              <ListItem alignItems="flex-start">
                <ListItemText
                  disableTypography          /* ✨ <— crucial line */
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SeverityIcon severity={vuln.extra.severity} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {vuln.extra.message}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 0.5 }}>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                        <RiskIndicator severity={vuln.risk_severity} />
                        <Chip
                          icon={<BugReportIcon sx={{ fontSize: '1.2rem' }} />}
                          label={`Exploitability: ${vuln.exploitability}`}
                          size="small"
                        />
                        <Chip
                          icon={<TimelineIcon sx={{ fontSize: '1.2rem' }} />}
                          label={`Impact: ${vuln.impact}`}
                          size="small"
                        />
                      </Box>

                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {vuln.path}:{vuln.start.line}-{vuln.end.line}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Check ID: {vuln.check_id}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Detected:{' '}
                        {validDate(vuln.detection_timestamp)
                          ? format(validDate(vuln.detection_timestamp)!, 'PPpp')
                          : 'N/A'}
                      </Typography>
                    </Box>
                  }
                />
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
