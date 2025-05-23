// src/components/FileUpload.tsx
import React from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { styled } from '@mui/material/styles';
import { DropzoneState } from 'react-dropzone';

interface FileUploadProps {
  getRootProps: DropzoneState['getRootProps'];
  getInputProps: DropzoneState['getInputProps'];
  isDragActive: boolean;
  loading: boolean;
  uploadedFile: File | null;
}

const UploadBox = styled(Box)(({ theme }) => ({
  border: `2px dashed ${theme.palette.primary.main}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(3),
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const FileUpload: React.FC<FileUploadProps> = ({
  getRootProps,
  getInputProps,
  isDragActive,
  loading,
  uploadedFile,
}) => (
  <UploadBox {...getRootProps()}>
    <input {...getInputProps()} />
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main' }} />

      {isDragActive ? (
        <Typography variant="h6" component="div" color="primary">
          Drop the file here…
        </Typography>
      ) : (
        <>
          {uploadedFile ? (
            <>
              <Chip 
                icon={<InsertDriveFileIcon />}
                label={uploadedFile.name}
                color="primary"
                variant="outlined"
                sx={{ py: 1, px: 2, fontSize: '1rem' }}
              />
              <Typography variant="body2" color="text.secondary">
                {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
              </Typography>
              <Button
                variant="outlined"
                color="primary"
                disabled={loading}
                sx={{ mt: 1 }}
              >
                Change File
              </Button>
            </>
          ) : (
            <>
              <Typography variant="h6" component="div">
                Drag&nbsp;and&nbsp;drop a file here, or click to select
              </Typography>

              <Typography
                variant="body2"
                component="span"
                color="text.secondary"
              >
                Supported formats:&nbsp;.zip,&nbsp;.py,&nbsp;.js,&nbsp;.ts,&nbsp;.java,&nbsp;.cpp,&nbsp;.c,&nbsp;.cs,&nbsp;.php,&nbsp;.rb,&nbsp;.go,&nbsp;.rs
              </Typography>

              <Button
                variant="contained"
                color="primary"
                disabled={loading}
                sx={{ mt: 2 }}
              >
                Select File
              </Button>
            </>
          )}
        </>
      )}
    </Box>
  </UploadBox>
);

export default FileUpload;
