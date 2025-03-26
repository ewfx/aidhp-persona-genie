import React, { useState, useEffect } from 'react';
import { Fab, Tooltip, Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button, Box, Paper } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import MicIcon from '@mui/icons-material/Mic';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import axios from 'axios';

// Add this function at the top of the component
function ChatButton() {
  const generateSessionId = () => {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  };
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = React.useRef(null);
  // Add recording handler
  // Add new state for speech recognition
  const [recognition, setRecognition] = useState(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);
  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
  
      recognition.onresult = async (event) => {
        const transcript = event.results[0][0].transcript;
        setMessage(transcript);
        setIsRecording(false);
        
        // Automatically send the transcribed message
        setChatHistory(prev => [...prev, { text: transcript, sender: 'user' }]);
        setIsTyping(true); 
        try {
          const response = await axios.post('http://localhost:3001/api/chat', {
            message: transcript,
            session_id: sessionId || generateSessionId()
          });
          setIsTyping(false); //
          if (!sessionId && response.data.session_id) {
            setSessionId(response.data.session_id);
          }

          // In both handleSendMessage and recognition.onresult, update the AI response handling
          const cleanResponse = response.data.response;
          
          setChatHistory(prev => [...prev, { 
            text: cleanResponse, 
            sender: 'ai' 
          }]);

        } catch (error) {
          console.error('Error sending message:', error);
          setChatHistory(prev => [...prev, { 
            text: "Sorry, I encountered an error. Please try again.", 
            sender: 'ai' 
          }]);
        }
      };
  
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };
  
      recognition.onend = () => {
        setIsRecording(false);
      };
  
      setRecognition(recognition);
    }
  }, [sessionId]);
  
  // Update handleVoiceRecord function
  const handleVoiceRecord = () => {
    if (!recognition) {
      alert('Speech recognition is not supported in your browser');
      return;
    }
  
    if (isRecording) {
      recognition.stop();
    } else {
      recognition.start();
    }
    setIsRecording(!isRecording);
  };
  
  // Add to Button component for visual feedback

  const handleClickOpen = () => {
    setOpen(true);
    if (chatHistory.length === 0) {
        setChatHistory([{
          text: `
            👋 Hi there! Welcome to our chat support.
            How can I assist you today?
            `,
          sender: 'ai'
        }]);
      }
  };

  const handleClose = () => {
    setOpen(false);
    setChatHistory([]); // Clear chat history
    setMessage(''); // Clear any unsent message
    setSessionId(null); // Clear session ID
  };

  // Update the session ID usage in handleSendMessage and recognition.onresult
  const handleSendMessage = async () => {
    if (message.trim()) {
      // Add message to chat history immediately
      setChatHistory([...chatHistory, { text: message, sender: 'user' }]);
      const currentMessage = message;
      setMessage('');
      setIsTyping(true); // Show typing indicator
      try {
        const response = await axios.post('http://localhost:3001/api/chat', {
          message: currentMessage,
          session_id: sessionId || generateSessionId()
        });
        setIsTyping(false);
        // Save the session ID if it's a new chat
        if (!sessionId && response.data.session_id) {
          setSessionId(response.data.session_id);
        }

        // Add AI response to chat history
        setChatHistory(prev => [...prev, { 
          text: response.data.response, 
          sender: 'ai' 
        }]);

      } catch (error) {
        console.error('Error sending message:', error);
        setChatHistory(prev => [...prev, { 
          text: "Sorry, I encountered an error. Please try again.", 
          sender: 'ai' 
        }]);
      }
    }
  };

  return (
    <>
      <Tooltip title="Chat with us" placement="left">
        <Fab
          color="primary"
          aria-label="chat"
          onClick={handleClickOpen}
          sx={{
            position: 'fixed',
            bottom: 32,
            right: 32,
            backgroundColor: '#D71E28',
            '&:hover': {
              backgroundColor: '#b71c1c',
            },
            zIndex: 1000
          }}
        >
          <ChatIcon />
        </Fab>
      </Tooltip>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            position: 'fixed',
            bottom: 100,
            right: 32,
            m: 0,
            width: 450, // Increased from 350
            height: 500,
            borderRadius: 2
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: '#D71E28', 
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          Chat Support
          <CloseIcon 
            onClick={handleClose}
            sx={{ cursor: 'pointer' }}
          />
        </DialogTitle>
        
        <DialogContent sx={{ p: 2 }}>
  <Box sx={{ height: '320px', overflowY: 'auto', mb: 2, pt:1 }}>
    {chatHistory.map((chat, index) => (
      <Box
        key={index}
        sx={{
          display: 'flex',
          justifyContent: chat.sender === 'user' ? 'flex-end' : 'flex-start',
          mb: 1
        }}
      >
        <Paper
          sx={{
            p: 1,
            bgcolor: chat.sender === 'user' ? '#D71E28' : '#f5f5f5',
            color: chat.sender === 'user' ? 'white' : 'black',
            maxWidth: '80%',
            borderRadius: 2
          }}
        >
          <div dangerouslySetInnerHTML={{
            __html: chat.text
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              .replace(/\n/g, '<br/>')
          }} />
        </Paper>
        </Box>
        ))}
       {isTyping && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 1 }}>
                <Paper sx={{ p: 1, bgcolor: '#f5f5f5', maxWidth: '80%', borderRadius: 2 }}>
                <div className="typing-indicator">
                    Typing<span>.</span><span>.</span><span>.</span>
                </div>
                </Paper>
            </Box>
            )}
        <div ref={messagesEndRef} />
    </Box>
    </DialogContent>

        <DialogActions sx={{ p: 2, bgcolor: '#f5f5f5' }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSendMessage();
              }
            }}
            size="small"
            sx={{ mr: 1 }}
          />
            <Button 
                onClick={handleVoiceRecord}
                variant="contained"
                sx={{
                mr: 1,
                bgcolor: isRecording ? '#b71c1c' : '#D71E28',
                '&:hover': {
                    bgcolor: isRecording ? '#8f1818' : '#b71c1c',
                },
                animation: isRecording ? 'pulse 1.5s infinite' : 'none',
                '@keyframes pulse': {
                    '0%': { opacity: 1 },
                    '50%': { opacity: 0.5 },
                    '100%': { opacity: 1 },
                }
                }}
            >
                {isRecording ? (
                    <GraphicEqIcon sx={{ 
                        color: '#fff',
                        animation: 'wave 1s infinite',
                        '@keyframes wave': {
                            '0%': { transform: 'scaleY(1)' },
                            '50%': { transform: 'scaleY(0.6)' },
                            '100%': { transform: 'scaleY(1)' },
                        }
                    }} />
                ) : (
                    <MicIcon sx={{ color: '#fff' }} />
                )}
            </Button>
          <Button 
            onClick={handleSendMessage}
            variant="contained"
            sx={{
              bgcolor: '#D71E28',
              '&:hover': {
                bgcolor: '#b71c1c',
              }
            }}
          >
            <SendIcon />
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default ChatButton;