import './App.css';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ExistingUser from './components/ExistingUser';
import ChatButton from './components/ChatButton';
import {
  Button, AppBar, Toolbar, Typography, Container, TextField,
  FormControl, InputLabel, Select, MenuItem, Checkbox,
  FormGroup, FormControlLabel, Grid, Card, CardContent, Stack,
  CircularProgress, Paper
} from '@mui/material';

// Add to the schema near the top
const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  age: z.string().min(1, 'Age is required'),
  gender: z.string().min(1, 'Gender is required'),
  income: z.string().min(1, 'Income is required'),  // Add this line
  location: z.string().min(1, 'Location is required'),
  interests: z.array(z.string()).min(1, 'Select at least one interest'),
  travelFrequency: z.string().optional(),
  diningFrequency: z.string().optional(),
  gamingFrequency: z.string().optional(),
  socialMediaPost: z.string().optional()
});

const INTERESTS = [
  'Travel', 'Dining', 'Shopping', 'Local', 'Luxury', 'Entertainment',
  'Gaming', 'Fitness', 'Streaming', 'Technology', 'Food', 'Sports',
  'General', 'Arts'
];

const FREQUENCY_OPTIONS = {
  travel: ['Never', 'Rarely', 'Occasionally', 'Monthly', 'Frequently'],
  dining: ['Never', 'Rarely', 'Often', 'Weekly', 'Very Frequently'],
  gaming: ['Never', 'Rarely', 'Occasionally', 'Regularly', 'Very Frequently']
};

function App() {
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { control, handleSubmit, watch } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      interests: [],
      income: '',  // Add this line
      travelFrequency: '',
      diningFrequency: '',
      gamingFrequency: '',
      socialMediaPost: ''
    }
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:3001/api/recommendations', {
        userInfo: {
          name: data.name,
          age: data.age,
          gender: data.gender,
          income: data.income,  // Add this line
          location: data.location,
          interests: data.interests,
          travelFrequency: data.travelFrequency,
          diningFrequency: data.diningFrequency,
          gamingFrequency: data.gamingFrequency,
          socialMediaPost: ''
        }
      });

      setRecommendations(response.data);
      
      // Add smooth scroll after recommendations are set
      setTimeout(() => {
        window.scrollTo({
          top: document.documentElement.scrollHeight,
          behavior: 'smooth'
        });
      }, 100);
      
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setRecommendations([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Update the submit button to show loading state

  const interests = watch('interests') || [];
  const showTravelFreq = interests.includes('Travel');
  const showDiningFreq = interests.includes('Dining');
  const showGamingFreq = interests.includes('Gaming');
  
  return (
    <div className="App" style={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
                <AppBar position="fixed" sx={{ 
                  background: '#D71E28',
                  boxShadow: 'none'
                }}>
                  <Toolbar>
                    <Typography variant="h6" component="div" sx={{ 
                      flexGrow: 1,
                      fontWeight: 600,
                      letterSpacing: '0.5px',
                      color: '#FFFFFF'
                    }}>
                      FinAI
                    </Typography>
                    <Stack direction="row" spacing={2}>
                      <Button 
                        color="inherit" 
                         href="/"
                        sx={{ 
                          fontWeight: 500,
                          borderBottom: '2px solid #FDC82F'
                        }}
                      >
                        Apply New
                      </Button>
                      <Button 
                        color="inherit"
                        href="/existing-user"
                        sx={{ fontWeight: 500 }}
                      >
                        Existing User
                      </Button>
                    </Stack>
                  </Toolbar>
                  <div style={{
                    width: '100%',
                    height: '5px',
                    backgroundColor: '#FDC82F'
                  }} />
                </AppBar>
          <Toolbar /> {/* This empty Toolbar acts as a spacer */}
    <Router>
      <Routes>
        <Route path="/" element={
 <div>
  
          
          <Container maxWidth="md" sx={{ mt: 6 }}> {/* Increased top margin */}
            <Typography variant="h4" gutterBottom sx={{ 
              textAlign: 'center',
              mb: 3,
              fontWeight: 500
            }}>
              Find Your Perfect Card Match
            </Typography>
            <Typography variant="body1" sx={{ 
              textAlign: 'center',
              mb: 4,
              color: 'text.secondary'
            }}>
              Tell us about yourself and we'll help you discover the best credit cards tailored to your lifestyle.
            </Typography>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ mb: 3, color: 'primary.main' }}>
                  Personal Information
                </Typography>
                <Grid container spacing={3}>
                  {/* Basic Information */}
                <Grid item xs={12}>
                  <Controller
                    name="name"
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Name"
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Controller
                    name="age"
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Age"
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Controller
                    name="gender"
                    control={control}
                    render={({ field, fieldState }) => (
                      <FormControl fullWidth error={!!fieldState.error}>
                        <InputLabel>Gender</InputLabel>
                        <Select {...field} label="Gender">
                          <MenuItem value="Male">Male</MenuItem>
                          <MenuItem value="Female">Female</MenuItem>
                          <MenuItem value="Other">Other</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Controller
                    name="income"
                    control={control}
                    render={({ field, fieldState }) => (
                      <FormControl fullWidth error={!!fieldState.error}>
                        <InputLabel>Annual Income</InputLabel>
                        <Select {...field} label="Annual Income">
                          {INCOME_RANGES.map(range => (
                            <MenuItem key={range} value={range}>{range}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Controller
                    name="location"
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Current Location"
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                      />
                    )}
                  />
                </Grid>

                {/* Interests Section */}
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Select Your Interests</Typography>
                  <Controller
                    name="interests"
                    control={control}
                    render={({ field, fieldState }) => (
                      <FormGroup>
                        <Stack spacing={2}>
                          <Grid container spacing={2} columns={3}>
                            {INTERESTS.map((interest) => (
                              <Grid item xs={1} key={interest}>
                                <FormControlLabel
                                  control={
                                    <Checkbox
                                      checked={field.value.includes(interest)}
                                      onChange={(e) => {
                                        const newValue = e.target.checked
                                          ? [...field.value, interest]
                                          : field.value.filter(i => i !== interest);
                                        field.onChange(newValue);
                                      }}
                                    />
                                  }
                                  label={interest}
                                  sx={{ minWidth: '120px' }}
                                />
                              </Grid>
                            ))}
                          </Grid>
                        </Stack>
                      </FormGroup>
                    )}
                  />
                </Grid>

                {/* Conditional Frequency Dropdowns */}
                {showTravelFreq && (
                  <Grid item xs={12} sm={4}>
                    <Controller
                      name="travelFrequency"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth>
                          <InputLabel>Travel Frequency</InputLabel>
                          <Select {...field} label="Travel Frequency">
                            {FREQUENCY_OPTIONS.travel.map(option => (
                              <MenuItem key={option} value={option}>{option}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
                    />
                  </Grid>
                )}

                {showDiningFreq && (
                  <Grid item xs={12} sm={4}>
                    <Controller
                      name="diningFrequency"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth>
                          <InputLabel>Dining Frequency</InputLabel>
                          <Select {...field} label="Dining Frequency">
                            {FREQUENCY_OPTIONS.dining.map(option => (
                              <MenuItem key={option} value={option}>{option}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
                    />
                  </Grid>
                )}

                {showGamingFreq && (
                  <Grid item xs={12} sm={4}>
                    <Controller
                      name="gamingFrequency"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth>
                          <InputLabel>Gaming Frequency</InputLabel>
                          <Select {...field} label="Gaming Frequency">
                            {FREQUENCY_OPTIONS.gaming.map(option => (
                              <MenuItem key={option} value={option}>{option}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
                    />
                  </Grid>
                )}

                
              </Grid>
              
              <Button 
                type="submit" 
                variant="contained" 
                sx={{ 
                  mt: 3,
                  py: 1.5,
                  background: 'linear-gradient(45deg, #1976d2 30%, #2196f3 90%)',
                  boxShadow: '0 3px 5px 2px rgba(33, 150, 243, .3)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)',
                  }
                }}
                fullWidth   
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
                    <Typography variant="button">Finding Best Matches...</Typography>
                  </>
                ) : 'Get Recommendations'}
              </Button>
              </Paper>
            </form>

            {recommendations.length === 0 && (
              <Typography sx={{ mt: 4, textAlign: 'center', color: 'text.secondary' }}>
                No matching cards found. Please select your interests and submit the form.
              </Typography>
            )}

    {recommendations.length > 0 && (
      <Grid container spacing={3} sx={{ mt: 4 }}>
        {recommendations.map((card, index) => (
          <Grid item xs={12} key={index}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
  <div 
    style={{
      width: '100%',
      height: '200px',
      borderRadius: '8px',
      overflow: 'hidden',
      position: 'relative'
    }}
  >
    <img
      src={`http://localhost:3001/${card.imageUrl}`}
      alt={card.name}
      style={{
        width: '100%',
        height: '80%',
        objectFit: 'cover',
        objectPosition: 'center'
      }}
    />
    
  </div>
</Grid>
                    <Grid item xs={12} sm={8}>
                      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>{card.name}</Typography>
                      <Typography 
                        variant="body1" 
                        paragraph 
                        sx={{ 
                          textAlign: 'left',
                          pl: 3.5,  // Changed from pl: 1 to pl: 2.5 (20px)
                          lineHeight: 1.6,
                          mb: 2
                        }}
                      >
                        {card.description}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>
    )}
          </Container>
        </div>
 
        } />
    <Route path="/existing-user" element={<ExistingUser />} />
  </Routes>
</Router>
<ChatButton />
</div>
);
}

export default App;


function adjustColor(color, amount) {
  const hex = color.replace('#', '');
  const num = parseInt(hex, 16);
  const r = Math.max(Math.min((num >> 16) + amount, 255), 0);
  const g = Math.max(Math.min(((num >> 8) & 0x00FF) + amount, 255), 0);
  const b = Math.max(Math.min((num & 0x0000FF) + amount, 255), 0);
  return `#${(g | (b << 8) | (r << 16)).toString(16).padStart(6, '0')}`;
}


// Add income ranges constant after other constants
const INCOME_RANGES = [
  '< $30,000',
  '$30,000 - $50,000',
  '$50,001 - $75,000',
  '$75,001 - $100,000',
  '$100,001 - $150,000',
  '$150,001 - $200,000',
  '> $200,000'
];


