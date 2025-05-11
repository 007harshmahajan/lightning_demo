import React from 'react';

interface ErrorDisplayProps {
  message: string;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message }) => {
  if (!message) return null;
  
  return (
    <div className="error">
      <p>{message}</p>
    </div>
  );
};

export default ErrorDisplay; 