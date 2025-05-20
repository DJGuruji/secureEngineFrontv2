import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Chip,
  Tooltip
} from '@mui/material';
import CreditScoreIcon from '@mui/icons-material/CreditScore';
import AddIcon from '@mui/icons-material/Add';
import axios from 'axios';

// Use API endpoint constants
const API_BASE_URL = 'http://localhost:8000/api/v1/scan';

interface CreditInfo {
  user_id: string;
  total_credits: number;
  used_credits: number;
  remaining_credits: number;
  last_updated: string;
}

interface CreditsInfoProps {
  onUpdate?: () => void;
}

const CreditsInfo: React.FC<CreditsInfoProps> = ({ onUpdate }) => {
  const [creditInfo, setCreditInfo] = useState<CreditInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [creditAmount, setCreditAmount] = useState<number>(10);
  const [addingCredits, setAddingCredits] = useState<boolean>(false);

  // Fetch credit info when component mounts
  useEffect(() => {
    fetchCreditInfo();
  }, []);

  const fetchCreditInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/credits`);
      setCreditInfo(response.data);
    } catch (err: any) {
      console.error('Error fetching credit info:', err);
      setError(err.response?.data?.detail || 'Failed to fetch credit information');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCredits = async () => {
    setAddingCredits(true);
    setError(null);
    try {
      const response = await axios.post(`${API_BASE_URL}/credits/add`, null, {
        params: { amount: creditAmount }
      });
      setCreditInfo(response.data);
      setOpenDialog(false);
      if (onUpdate) onUpdate();
    } catch (err: any) {
      console.error('Error adding credits:', err);
      setError(err.response?.data?.detail || 'Failed to add credits');
    } finally {
      setAddingCredits(false);
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box display="flex" alignItems="center">
          <CreditScoreIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6">AI Scan Credits</Typography>
        </Box>
        {/* <Button
          startIcon={<AddIcon />}
          variant="contained"
          size="small"
          onClick={() => setOpenDialog(true)}
        >
          Add Credits
        </Button> */}
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" p={2}>
          <CircularProgress size={24} />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : creditInfo ? (
        <Box>
          {/* <Box display="flex" alignItems="center" mb={1}>
            <Typography variant="body1" mr={1}>
              Remaining Credits:
            </Typography>
            <Tooltip title="Credits available for AI scans">
              <Chip 
                label={creditInfo.remaining_credits}
                color={creditInfo.remaining_credits > 5 ? "success" : creditInfo.remaining_credits > 0 ? "warning" : "error"}
                size="medium"
              />
            </Tooltip>
          </Box> */}
          
          {/* <Box display="flex" alignItems="center" mb={1}>
            <Typography variant="body2" color="text.secondary" mr={1}>
              Total Credits: {creditInfo.total_credits}
            </Typography>
          </Box> */}
          
          <Box display="flex" alignItems="center">
            <Typography variant="body2" color="text.secondary" mr={1}>
              Used Credits: {creditInfo.used_credits}
            </Typography>
          </Box>
          
          <Typography variant="caption" color="text.secondary" display="block" mt={1}>
            Last Updated: {new Date(creditInfo.last_updated).toLocaleString()}
          </Typography>
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary">
          No credit information available.
        </Typography>
      )}

      {/* Add Credits Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Add AI Scan Credits</DialogTitle>
        <DialogContent>
          <Typography variant="body2" paragraph sx={{ mt: 1 }}>
            Add more credits to perform AI-powered security scans on your code.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Number of Credits"
            type="number"
            fullWidth
            variant="outlined"
            value={creditAmount}
            onChange={(e) => setCreditAmount(parseInt(e.target.value) || 1)}
            inputProps={{ min: 1, max: 100 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleAddCredits} 
            variant="contained" 
            disabled={addingCredits}
            startIcon={addingCredits ? <CircularProgress size={20} /> : null}
          >
            {addingCredits ? 'Adding...' : 'Add Credits'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default CreditsInfo; 