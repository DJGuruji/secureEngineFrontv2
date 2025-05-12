// src/components/FileUpload.tsx
import React from 'react';
import {
  Box,
  Typography,
  Button,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { styled } from '@mui/material/styles';
import { DropzoneState } from 'react-dropzone';

interface FileUploadProps {
  getRootProps: DropzoneState['getRootProps'];
  getInputProps: DropzoneState['getInputProps'];
  isDragActive: boolean;
  loading: boolean;
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
    </Box>
  </UploadBox>
);

export default FileUpload;
