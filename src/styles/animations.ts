import { keyframes } from "@mui/material";

// Define the pulse animation keyframes
export const pulseAnimation = keyframes`
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
  100% {
    opacity: 1;
  }
`;

// Create the animation style functions
export const createProcessingButtonStyle = (theme: any) => ({
  animation: `${pulseAnimation} 1.5s infinite ease-in-out`,
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: theme.palette.primary.main,
    opacity: 0.2,
    borderRadius: 'inherit',
  }
});

export const createUploadingButtonStyle = (theme: any) => ({
  animation: `${pulseAnimation} 1s infinite ease-in-out`,
  background: theme.palette.mode === 'dark' 
    ? 'linear-gradient(45deg, rgba(63,81,181,1) 0%, rgba(100,125,200,1) 50%, rgba(63,81,181,1) 100%)' 
    : 'linear-gradient(45deg, rgba(25,118,210,1) 0%, rgba(66,165,245,1) 50%, rgba(25,118,210,1) 100%)',
  backgroundSize: '200% 200%',
  transition: 'all 0.3s ease'
}); 