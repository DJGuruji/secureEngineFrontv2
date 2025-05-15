import { useState } from 'react';
import axios from 'axios';

// API endpoint constants
const API_UPLOAD_URL = 'http://localhost:8000/api/v1/scan/upload';
const API_CODEQL_URL = 'http://localhost:8000/api/v1/scan/codeql';
const API_SHIFTLEFT_URL = 'http://localhost:8000/api/v1/scan/shiftleft';
const API_AI_SCAN_URL = 'http://localhost:8000/api/v1/scan/ai-scan';

// Types
export interface ScanProps {
  uploadedFile: File | null;
  setScanResults: (results: any) => void;
  setError: (error: string | null) => void;
  setScanStarted: (started: boolean) => void;
  setDialogOpen: (open: boolean) => void;
  setCreditsRefreshTrigger?: (cb: (prev: number) => number) => void;
}

export interface ScanFunctionProps extends ScanProps {
  setLoadingUpload: (loading: boolean) => void;
  setLoadingProcessing: (loading: boolean) => void;
  customRule?: string;
  selectedRule?: any;
}

// Semgrep scan function
export const startSemgrepScan = async ({
  uploadedFile,
  setScanResults,
  setError,
  setScanStarted,
  setDialogOpen,
  setLoadingUpload,
  setLoadingProcessing,
  customRule,
  selectedRule
}: ScanFunctionProps) => {
  if (!uploadedFile) return;
  
  try {
    setError('');
    setScanStarted(true);
    setLoadingUpload(true);
    
    const formData = new FormData();
    formData.append('file', uploadedFile);
    
    if (customRule) {
      formData.append('custom_rule', customRule);
    } else if (selectedRule) {
      formData.append('custom_rule', selectedRule.registry_id || selectedRule.id || '');
    }
  
    const response = await axios.post(API_UPLOAD_URL, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    setLoadingUpload(false);
    setLoadingProcessing(true);
    
    // Allow UI to update
    await new Promise(resolve => setTimeout(resolve, 300));
    
    setScanResults(response.data);
    setDialogOpen(true);
  } catch (err: any) {
    setError(err.message || 'An error occurred during scanning');
  } finally {
    setLoadingUpload(false);
    setLoadingProcessing(false);
  }
};

// CodeQL scan function
export const startCodeQLScan = async ({
  uploadedFile,
  setScanResults,
  setError,
  setScanStarted,
  setDialogOpen,
  setLoadingUpload,
  setLoadingProcessing
}: ScanFunctionProps) => {
  if (!uploadedFile) return;
  
  try {
    setError(null);
    setScanStarted(true);
    setLoadingUpload(true);
    
    const formData = new FormData();
    formData.append('file', uploadedFile);

    const response = await fetch(API_CODEQL_URL, {
      method: 'POST',
      body: formData,
    });
    
    setLoadingUpload(false);
    setLoadingProcessing(true);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to scan file with CodeQL');
    }
    
    const data = await response.json();
    
    // Ensure processing state is visible for at least 1 second
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setScanResults(data);
    setDialogOpen(true);
  } catch (err: any) {
    setError(err.message || 'An error occurred');
  } finally {
    setLoadingUpload(false);
    setLoadingProcessing(false);
  }
};

// ShiftLeft scan function
export const startShiftLeftScan = async ({
  uploadedFile,
  setScanResults,
  setError,
  setScanStarted,
  setDialogOpen,
  setLoadingUpload,
  setLoadingProcessing
}: ScanFunctionProps) => {
  if (!uploadedFile) return;
  
  try {
    setError(null);
    setScanStarted(true);
    setLoadingUpload(true);
    
    const formData = new FormData();
    formData.append('file', uploadedFile);

    const response = await fetch(API_SHIFTLEFT_URL, {
      method: 'POST',
      body: formData,
    });
    
    setLoadingUpload(false);
    setLoadingProcessing(true);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to scan file with ShiftLeft');
    }
    
    const data = await response.json();
    
    // Ensure processing state is visible for at least 1 second
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setScanResults(data);
    setDialogOpen(true);
  } catch (err: any) {
    setError(err.message || 'An error occurred');
  } finally {
    setLoadingUpload(false);
    setLoadingProcessing(false);
  }
};

// AI scan function
export const startAiScan = async ({
  uploadedFile,
  setScanResults,
  setError,
  setScanStarted,
  setDialogOpen,
  setLoadingUpload,
  setLoadingProcessing,
  setCreditsRefreshTrigger
}: ScanFunctionProps) => {
  if (!uploadedFile) return;
  
  try {
    setError(null);
    setScanStarted(true);
    setLoadingUpload(true);
    setLoadingProcessing(true);
    
    const formData = new FormData();
    formData.append('file', uploadedFile);

    const response = await fetch(API_AI_SCAN_URL, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      // Check for credit-specific error (402 Payment Required)
      if (response.status === 402) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Insufficient credits for AI scan.');
      }
      
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to scan file with AI');
    }
    
    const data = await response.json();
    
    // Make sure the scan type is correctly set for the UI
    if (data.scan_metadata) {
      data.scan_metadata.scan_type = 'AI';
    }
    
    setScanResults(data);
    setDialogOpen(true);
    
    // Refresh credit info after scan
    if (setCreditsRefreshTrigger) {
      setCreditsRefreshTrigger(prev => prev + 1);
    }
  } catch (err: any) {
    console.error('Error during AI scan:', err);
    setError(err.message || 'An error occurred during AI scan');
  } finally {
    setLoadingUpload(false);
    setLoadingProcessing(false);
  }
}; 