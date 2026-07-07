import React, { useState } from 'react';
import { Box, Paper, Typography, TextField, Button, IconButton, Divider } from '@mui/material';
import { motion } from 'framer-motion';
import MinimizeIcon from '@mui/icons-material/Minimize';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import PhoneIcon from '@mui/icons-material/Phone';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CloseIcon from '@mui/icons-material/Close';
import { collection, doc, setDoc, getDocs, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import './subMenu/Tiendao/tiendao.css';
import imageList from './Image/ImageList';
import background from './Image/background.png';

const Menu = ({
  avatarRef,
  resultRef,
  position,
  isDragging,
  handleMouseDown,
  handleTouchEnd,
  isMinimized,
  setIsMinimized,
  isSubmitted,
  handleSubmit,
  username,
  setUsername,
  contact,
  setContact,
  type,
  setIsSubmitted
}) => {
  const [password, setPassword] = useState('');
  const [, setIsRegistered] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [loginMessage, setLoginMessage] = useState('');
  const [registerMessage, setRegisterMessage] = useState('');
  const [currentLevel, setCurrentLevel] = useState(1);
  const [accountInfo, setAccountInfo] = useState({ username: '', xu: 0 });
  const [tiendaoResult, setTiendaoResult] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [lastUsed, setLastUsed] = useState(0);
  const [notification, setNotification] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 2000);
  };

  const handleGetResult = async () => {
    const now = Date.now();
    const timeSinceLastUsed = now - lastUsed;
    
    // Kiểm tra cooldown 2.5 giây
    if (timeSinceLastUsed < 2500) {
      const remainingTime = Math.ceil((2500 - timeSinceLastUsed) / 1000);
      showNotification(`Vui lòng đợi ${remainingTime} giây nữa!`);
      return;
    }

    // Kiểm tra xu trong tài khoản
    if (!accountInfo || !accountInfo.username || (accountInfo.xu ?? 0) < 1) {
      showNotification('Không đủ xu! Vui lòng liên hệ admin');
      return;
    }

    // Bắt đầu hiệu ứng loading
    setIsLoading(true);
    setTiendaoResult('Đang chạy thuật toán hack...');
    setSelectedIndex(null);

    try {
      // Cập nhật xu trong database
      const userDoc = doc(db, 'lstUsers', accountInfo.username);
      const currentXu = accountInfo.xu ?? 0;
      await updateDoc(userDoc, {
        xu: currentXu - 1
      });

      // Trừ 1 xu ở frontend
      setAccountInfo(prev => ({ ...prev, xu: (prev?.xu ?? 0) - 1 }));
      
      // Cập nhật thời gian sử dụng cuối
      setLastUsed(now);
      
      // Hiệu ứng loading 0.5 giây
      setTimeout(() => {
        // Hiển thị kết quả
        const sides = ['Giữa', 'Trái', 'Phải'];
        const percentage = Math.floor(Math.random() * (95 - 70 + 1)) + 70;
        const idx = Math.floor(Math.random() * 3);
        setSelectedIndex(idx);
        setTiendaoResult(`${sides[idx]} (${percentage}%)`);
        setIsLoading(false);
      }, 500);
      
    } catch (error) {
      console.error('Lỗi cập nhật xu:', error);
      showNotification('Có lỗi xảy ra! Vui lòng thử lại.');
      setIsLoading(false);
    }
  };

  const Tiendao = () => {

    return (
      <div className="tiendao-container neo-panel">
        <img src={background} alt="background" className="tiendao-background" />
        <div className="tiendao-title">Tiền Đạo Bóng Đá</div>
        {tiendaoResult && (
          <div className="tiendao-result">
            {isLoading ? (
              <>
                <span className="tiendao-loading"></span>
                {tiendaoResult || ''}
              </>
            ) : (
              `Kết quả: ${tiendaoResult || ''}`
            )}
          </div>
        )}
        {selectedIndex !== null && (
          <img className="tiendao-image" src={imageList[selectedIndex]} alt="Tiendao" />
        )}
        <button 
          className="tiendao-btn" 
          onClick={handleGetResult}
          disabled={isLoading}
          style={{ 
            opacity: isLoading ? 0.7 : 1,
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? 'Đang xử lý...' : 'Lấy kết quả'}
        </button>
        {notification && (
          <div style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(255, 0, 0, 0.9)',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '8px',
            zIndex: 9999,
            fontSize: '14px',
            fontWeight: 'bold',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            animation: 'fadeInOut 3s ease-in-out'
          }}>
            {notification}
          </div>
        )}
      </div>
    );
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const usersCollection = collection(db, 'lstUsers');
      const querySnapshot = await getDocs(usersCollection);
      const usernameExists = querySnapshot.docs.some(doc => doc.id.toLowerCase() === username.toLowerCase());
      if (!usernameExists) {
        await setDoc(doc(db, 'lstUsers', username), {
          username,
          pass: password,
          sdt: contact,
          xu: 0,
          timestamp: new Date()
        });
        setIsRegistered(true);
        setIsLogin(true);
        setRegisterMessage('Đăng ký thành công! Vui lòng đăng nhập.');
      } else {
        setRegisterMessage('Tên tài khoản đã tồn tại. Vui lòng chọn tên khác.');
      }
    } catch (error) {
      console.error('Error: ', error);
      setRegisterMessage('Đã xảy ra lỗi. Vui lòng thử lại.');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const usersCollection = collection(db, 'lstUsers');
      const querySnapshot = await getDocs(usersCollection);
      const userDoc = querySnapshot.docs.find(doc => doc.id.toLowerCase() === username.toLowerCase());
      if (userDoc) {
        const userData = userDoc.data();
        if (userData && userData.pass === password) {
          setAccountInfo({ 
            username: userData.username || '', 
            xu: userData.xu ?? 0 
          });
          setUsername(userData.username || '');
          handleLoginSuccess();
        } else {
          setLoginMessage('Mật khẩu không đúng.');
        }
      } else {
        setLoginMessage('Tên tài khoản không tồn tại.');
      }
    } catch (error) {
      console.error('Error: ', error);
      setLoginMessage('Đã xảy ra lỗi. Vui lòng thử lại.');
    }
  };

  const handleLoginSuccess = () => {
    setIsSubmitted(true);
    setCurrentLevel(3);
    setLoginMessage('Đăng nhập thành công!');
  };

  return (
    <>
      {/* Avatar Component */}
      <Box
        ref={avatarRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'fixed',
          left: `${position.x}px`,
          top: `${position.y}px`,
          zIndex: 1000,
          cursor: isDragging ? 'grabbing' : 'grab',
          touchAction: 'none'
        }}
      >
        <motion.img
          className="minimized-avatar"
          src="/robot.gif"
          alt="Avatar"
          style={{
            width: '60px',
            height: '60px',
            cursor: isDragging ? 'grabbing' : 'grab',
            WebkitTapHighlightColor: 'transparent',
            userSelect: 'none'
          }}
          onClick={() => !isDragging && setIsMinimized(false)}
          animate={{ y: [0, -5, 0, 5, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        />
      </Box>

      {/* Result Component */}
      {!isMinimized && (
        <div
          ref={resultRef}
          style={{
            position: 'fixed',
            left: `${position.x + 70}px`,
            top: `${position.y}px`,
            zIndex: 1000
          }}
        >
          <Paper
            elevation={3}
            style={{
              padding: '12px',
              width: '250px',
              backgroundColor: 'rgba(8, 12, 20, 0.7)',
              backdropFilter: 'blur(8px)',
              transition: 'all 0.3s ease',
              borderRadius: '12px',
              position: 'relative'
            }}
          >
            {/* Nút (x) và nút thu nhỏ luôn hiển thị ở góc phải trên menu */}
            <Box style={{ position: 'absolute', top: 8, right: 8, zIndex: 10, display: 'flex', alignItems: 'center', gap: 4, borderRadius: 6 }}>
              <IconButton
                onClick={() => setIsMinimized(true)}
                size="small"
                style={{ width: 28, height: 28, padding: 0 }}
              >
                <MinimizeIcon style={{ color: '#1976d2', fontSize: 20 }} />
              </IconButton>
              <IconButton
                onClick={() => {
                  if (currentLevel === 1) setIsMinimized(true);
                  else if (currentLevel === 3) setCurrentLevel(1);
                }}
                size="small"
                style={{ width: 28, height: 28, padding: 0 }}
              >
                <CloseIcon style={{ color: '#d32f2f', fontSize: 20 }} />
              </IconButton>
            </Box>

            {/* Box thông tin tài khoản */}
            <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'left', marginBottom: '8px' }}>
              <AccountCircleIcon style={{ color: '#1976d2', marginRight: 4, fontSize: '16px' }} />
              <Typography variant="caption" style={{ color: '#1976d2', fontWeight: 600, fontSize: '11px' }}>{accountInfo?.username || 'Chưa đăng nhập'}</Typography>
              <Divider orientation="vertical" flexItem style={{ margin: '0 6px', height: '12px' }} />
              <Typography variant="caption" style={{ color: '#d32f2f', fontWeight: 600, fontSize: '11px' }}>Xu: {accountInfo?.xu ?? 0}</Typography>
            </Box>

            <Box 
              className="draggable-area"
              onMouseDown={handleMouseDown}
              onTouchStart={handleMouseDown}
              style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                right: 0, 
                height: '40px',
                cursor: isDragging ? 'grabbing' : 'grab',
                touchAction: 'none'
              }}
            >
            </Box>

            {currentLevel === 1 && (
              <form onSubmit={isLogin ? handleLogin : handleRegister}>
                <Box textAlign="center" mb={2}>
                  <Typography 
                    variant="h6" 
                    style={{ 
                      fontWeight: 'bold',
                      color: '#1976d2',
                      fontSize: '16px'
                    }}
                  >
                    {isLogin ? 'Đăng nhập' : 'Đăng ký'}
                  </Typography>
                </Box>

                <Box mb={1.5}>
                  <Box display="flex" alignItems="center" mb={0.5}>
                    <AccountCircleIcon style={{ color: '#1976d2', marginRight: '6px', fontSize: '16px' }} />
                    <Typography variant="caption" style={{ color: '#666', fontSize: '11px' }}>
                      Tên tài khoản
                    </Typography>
                  </Box>
                  <TextField
                    fullWidth
                    variant="outlined"
                    size="small"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    InputProps={{
                      style: {
                        borderRadius: '8px',
                        backgroundColor: '#f5f5f5',
                        fontSize: '12px'
                      }
                    }}
                  />
                </Box>

                <Box mb={1.5}>
                  <Box display="flex" alignItems="center" mb={0.5}>
                    <Typography variant="caption" style={{ color: '#666', fontSize: '11px' }}>
                      Mật khẩu
                    </Typography>
                  </Box>
                  <TextField
                    fullWidth
                    variant="outlined"
                    size="small"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    InputProps={{
                      style: {
                        borderRadius: '8px',
                        backgroundColor: '#f5f5f5',
                        fontSize: '12px'
                      }
                    }}
                  />
                </Box>

                {!isLogin && (
                  <Box mb={1.5}>
                    <Box display="flex" alignItems="center" mb={0.5}>
                      <PhoneIcon style={{ color: '#1976d2', marginRight: '6px', fontSize: '16px' }} />
                      <Typography variant="caption" style={{ color: '#666', fontSize: '11px' }}>
                        Số điện thoại
                      </Typography>
                    </Box>
                    <TextField
                      fullWidth
                      variant="outlined"
                      size="small"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      required
                      InputProps={{
                        style: {
                          borderRadius: '8px',
                          backgroundColor: '#f5f5f5',
                          fontSize: '12px'
                        }
                      }}
                    />
                  </Box>
                )}

                <Box mb={1.5}>
                  <Typography variant="caption" style={{ color: 'red', textAlign: 'center', fontSize: '10px' }}>
                    {isLogin ? (loginMessage || '') : (registerMessage || '')}
                  </Typography>
                </Box>

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  size="small"
                  style={{
                    borderRadius: '8px',
                    padding: '6px',
                    fontWeight: 'bold',
                    textTransform: 'none',
                    fontSize: '12px'
                  }}
                  startIcon={<PlayArrowIcon style={{ fontSize: '16px' }} />}
                >
                  {isLogin ? 'Đăng nhập' : 'Đăng ký'}
                </Button>
                <Button
                  variant="text"
                  color="primary"
                  fullWidth
                  size="small"
                  onClick={() => setIsLogin(!isLogin)}
                  style={{ marginTop: '6px', fontSize: '10px' }}
                >
                  {isLogin ? 'Chưa có tài khoản? Đăng ký' : 'Đã có tài khoản? Đăng nhập'}
                </Button>
              </form>
            )}

            {currentLevel === 3 && (
              <>
                <Tiendao />
              </>
            )}
          </Paper>
        </div>
      )}
    </>
  );
};

export default Menu;
