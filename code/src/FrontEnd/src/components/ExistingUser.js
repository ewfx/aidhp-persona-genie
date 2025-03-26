import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material';
import { Box, Card } from '@mui/material';

function ExistingUser() {
  const [selectedUser, setSelectedUser] = useState('');
  const [customerData, setCustomerData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Add new state for recommendations
  const [recommendations, setRecommendations] = useState([]);
  
  // Update handleUserChange to fetch both customer data and recommendations
  const handleUserChange = async (event) => {
    setLoading(true);
    try {
      const customerId = `CUS${String(event.target.value).padStart(6, '0')}`;
      const [customerResponse, recommendationsResponse] = await Promise.all([
        axios.post('http://localhost:3001/api/customer', { customerId }),
        axios.post('http://localhost:3001/api/card-recommendations', { customerId })
      ]);
      
      if (customerResponse.data.status === 'success') {
        setCustomerData(customerResponse.data.data);
      }
      if (recommendationsResponse.data.status === 'success') {
        setRecommendations(recommendationsResponse.data.data.recommendations);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <Container maxWidth="md" sx={{ pt: 12 }}>
        <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
          <Typography variant="h5" gutterBottom sx={{ mb: 4 }}>
            Welcome Back
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Select User</InputLabel>
                <Select
                  value={customerData ? customerData.customerId.replace('CUS', '') : ''}
                  onChange={handleUserChange}
                  label="Select User"
                >
                  {[...Array(10)].map((_, index) => (
                    <MenuItem key={index + 1} value={index + 1}>
                      Customer {String(index + 1).padStart(6, '0')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {loading ? (
              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
              </Grid>
            ) : customerData && (
              <>
                {/* Credit Card Display */}
                <Grid item xs={12} sx={{ mb: 3 }}>
                  <Box sx={{ perspective: '1000px' }}>
                    <Card
                      sx={{
                        background: 'linear-gradient(135deg, #D71E28 0%, #b71c1c 100%)',
                        color: 'white',
                        p: 3,
                        borderRadius: 2,
                        height: '200px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        position: 'relative'
                      }}
                    >
                      <Box>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            mb: 2,
                            fontSize: '1.1rem',
                            fontWeight: 600,
                            textTransform: 'uppercase'
                          }}
                        >
                          Wells Fargo
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="h5" sx={{ mb: 2, letterSpacing: 4 }}>
                          {customerData.creditCardNumber}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body1">
                            {customerData.name}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            {customerData.cardName}
                          </Typography>
                        </Box>
                      </Box>
                    </Card>
                  </Box>
                </Grid>

                {/* Customer Details */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Name"
                    variant="outlined"
                    value={customerData.name || ''}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Customer ID"
                    variant="outlined"
                    value={customerData.customerId || ''}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Location"
                    variant="outlined"
                    value={customerData.location || ''}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Income"
                    variant="outlined"
                    value={customerData.income || ''}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
              </>
            )}
            
             {/* Add after the customer details section and before the final button */}
            {recommendations.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 3 }}>
                  Recommended Cards for You
                </Typography>
                <Grid container spacing={3}>
                  {recommendations.map((card, index) => (
                    <Grid item xs={12} key={index}>
                      <Card sx={{ mb: 3 }}>
                        <Box sx={{ p: 3, textAlign: 'left' }}>
                          <Typography variant="h6" color="primary" gutterBottom sx={{ textAlign: 'left' }}>
                            {card.name}
                          </Typography>
                          <Typography variant="body1" sx={{ mb: 2, textAlign: 'left' }}>
                            {card.description}
                          </Typography>
                          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600, textAlign: 'left' }}>
                            Key Benefits:
                          </Typography>
                          <Box component="ul" sx={{ mt: 1, mb: 2, pl: 2 }}>
                            {card.key_benefits.map((benefit, idx) => (
                              <Typography component="li" key={idx} variant="body2" sx={{ mb: 0.5, textAlign: 'left' }}>
                                {benefit}
                              </Typography>
                            ))}
                          </Box>
                          <Typography 
                            variant="subtitle1" 
                            sx={{ 
                              mt: 2, 
                              p: 2, 
                              bgcolor: '#f5f5f5', 
                              borderRadius: 1,
                              textAlign: 'left'
                            }}
                          >
                            Potential Savings: {card.potential_savings}
                          </Typography>
                        </Box>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            )}
            <Grid item xs={12}>
              <Button
                variant="contained"
                fullWidth
                disabled={!customerData}
                sx={{
                  mt: 2,
                  py: 1.5,
                  background: '#D71E28',
                  '&:hover': {
                    background: '#b71c1c',
                  }
                }}
              >
                View Card Details
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </div>
  );
}

export default ExistingUser;