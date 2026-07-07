import React, { useState, useEffect, useCallback } from 'react';

import { db } from './firebase';
import {
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  limit,
  startAfter,
  where
} from 'firebase/firestore';

import {
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Alert,
  Snackbar,
  InputAdornment,
  Divider
} from '@mui/material';

import {
  Search as SearchIcon,
  Add as AddIcon,
  LockReset as LockResetIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  ArrowBackIos as ArrowBackIosIcon,
  ArrowForwardIos as ArrowForwardIosIcon
} from '@mui/icons-material';

import { useDebounce } from 'use-debounce';

function Admin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [users, setUsers] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm] = useDebounce(searchInput, 500); // Tăng debounce lên 500ms để giảm tải query api

  // --- TRẠNG THÁI PHÂN TRANG FIREBASE ---
  const [page, setPage] = useState(1);
  const [pageTokens, setPageTokens] = useState({}); // Lưu document cuối của mỗi trang để quay lại
  const [isLastPage, setIsLastPage] = useState(false);
  const rowsPerPage = 9;

  const [selectedUser, setSelectedUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [xuAmount, setXuAmount] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // --- HÀM TẢI DỮ LIỆU TỪ SERVER (TỐI ƯU) ---
  const fetchUsers = useCallback(async (targetPage, currentSearchTerm) => {
    try {
      const usersRef = collection(db, 'lstUsers');
      let q;

      // 1. Nếu có tìm kiếm -> Query theo điều kiện tìm kiếm
      if (currentSearchTerm) {
        q = query(
          usersRef,
          where('username', '>=', currentSearchTerm),
          where('username', '<=', currentSearchTerm + '\uf8ff'),
          limit(rowsPerPage)
        );
      } else {
        // 2. Không tìm kiếm -> Query phân trang theo thời gian
        q = query(usersRef, orderBy('timestamp', 'desc'), limit(rowsPerPage));

        // Nếu chuyển sang trang tiếp theo (targetPage > 1), bắt đầu sau mốc trang trước đó
        if (targetPage > 1 && pageTokens[targetPage - 1]) {
          q = query(
            usersRef,
            orderBy('timestamp', 'desc'),
            startAfter(pageTokens[targetPage - 1]),
            limit(rowsPerPage)
          );
        }
      }

      const snap = await getDocs(q);

      const data = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        timestamp: d.data().timestamp?.toDate?.() || new Date()
      }));

      // Đánh dấu xem trang này đã là trang cuối chưa
      setIsLastPage(data.length < rowsPerPage);

      // Lưu document cuối cùng của trang hiện tại để làm mốc cho trang sau
      if (snap.docs.length > 0) {
        setPageTokens(prev => ({
          ...prev,
          [targetPage]: snap.docs[snap.docs.length - 1]
        }));
      }

      setUsers(data);
      setPage(targetPage);
    } catch (err) {
      showSnackbar('Lỗi tải danh sách: ' + err.message, 'error');
    }
  }, [pageTokens]);

  // Kiểm tra đăng nhập ban đầu
  useEffect(() => {
    if (localStorage.getItem('isAuthenticated') === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Gọi API lần đầu hoặc khi searchTerm thay đổi
  useEffect(() => {
    if (isAuthenticated) {
      setPageTokens({}); // Reset token khi tìm kiếm mới
      fetchUsers(1, searchTerm);
    }
  }, [isAuthenticated, searchTerm]); // Không đưa fetchUsers vào đây để tránh lặp vô tận

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleLogin = () => {
    if (username === 'admin2025' && password === 'admin2025') {
      setIsAuthenticated(true);
      localStorage.setItem('isAuthenticated', 'true');
      showSnackbar('Đăng nhập thành công');
    } else {
      showSnackbar('Sai tài khoản hoặc mật khẩu', 'error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
  };

  const handlePageChange = (direction) => {
    const targetPage = direction === 'next' ? page + 1 : page - 1;
    fetchUsers(targetPage, searchTerm);
  };

  const openDialog = (user, type) => {
    setSelectedUser(user);
    setDialogType(type);
    setDialogOpen(true);
    setXuAmount('');
    setNewPassword('');
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedUser(null);
  };

  const handleXuUpdate = async () => {
    const value = parseInt(xuAmount);
    if (isNaN(value)) return;

    try {
      const ref = doc(db, 'lstUsers', selectedUser.id);
      const newXu = Math.max(0, (selectedUser.xu || 0) + value);

      await updateDoc(ref, { xu: newXu });

      setUsers(prev =>
        prev.map(u => (u.id === selectedUser.id ? { ...u, xu: newXu } : u))
      );

      showSnackbar('Cập nhật xu thành công');
      closeDialog();
    } catch (err) {
      showSnackbar('Lỗi: ' + err.message, 'error');
    }
  };

  const handlePasswordReset = async () => {
    if (newPassword.length < 6) {
      showSnackbar('Mật khẩu tối thiểu 6 ký tự', 'error');
      return;
    }

    try {
      await updateDoc(doc(db, 'lstUsers', selectedUser.id), {
        pass: newPassword
      });

      showSnackbar('Đã đặt lại mật khẩu');
      closeDialog();
    } catch (err) {
      showSnackbar('Lỗi: ' + err.message, 'error');
    }
  };

  const handleDelete = async user => {
    if (!window.confirm(`Bạn có chắc muốn xóa tài khoản ${user.username}?`)) return;

    try {
      await deleteDoc(doc(db, 'lstUsers', user.id));
      setUsers(prev => prev.filter(u => u.id !== user.id));
      showSnackbar('Đã xóa người dùng thành công');
    } catch (err) {
      showSnackbar('Lỗi xóa: ' + err.message, 'error');
    }
  };

  // --- GIAO DIỆN ĐĂNG NHẬP ---
  if (!isAuthenticated) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5' }}>
        <Card sx={{ width: 400, p: 2, boxShadow: 3 }}>
          <CardContent>
            <Typography variant="h5" textAlign="center" fontWeight="bold" gutterBottom>
              Hệ thống quản trị
            </Typography>
            <TextField
              fullWidth
              label="Username"
              margin="normal"
              onChange={e => setUsername(e.target.value)}
            />
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              margin="normal"
              onChange={e => setPassword(e.target.value)}
              InputProps={{
                endAdornment: (
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                )
              }}
            />
            <Button
              fullWidth
              variant="contained"
              sx={{ mt: 3, py: 1.5 }}
              onClick={handleLogin}
            >
              Đăng nhập
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // --- GIAO DIỆN CHÍNH ---
  return (
    <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">Quản lý người dùng</Typography>
        <Button variant="outlined" color="secondary" onClick={handleLogout}>Đăng xuất</Button>
      </Box>

      <TextField
        fullWidth
        placeholder="Tìm kiếm chính xác theo Tên tài khoản..."
        value={searchInput}
        onChange={e => setSearchInput(e.target.value)}
        sx={{ mb: 4, bgcolor: 'white' }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          )
        }}
      />

      {/* Danh sách người dùng */}
      <Grid container spacing={3}>
        {users.length === 0 ? (
          <Grid item xs={12}>
            <Typography textAlign="center" color="textSecondary">Không có dữ liệu hiển thị.</Typography>
          </Grid>
        ) : (
          users.map(user => (
            <Grid item xs={12} sm={6} md={4} key={user.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: 2 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" noWrap>{user.username}</Typography>
                  <Typography variant="body2" color="textSecondary">SĐT: {user.sdt || 'Chưa cập nhật'}</Typography>
                  <Typography variant="subtitle1" color="primary" fontWeight="medium" mt={1}>
                    Ví xu: 🪙 {user.xu || 0}
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  <Box display="flex" justifyContent="space-between">
                    <Button size="small" variant="outlined" onClick={() => openDialog(user, 'xu')} startIcon={<AddIcon />}>
                      Cộng/Trừ Xu
                    </Button>
                    <Button size="small" variant="outlined" color="warning" onClick={() => openDialog(user, 'password')} startIcon={<LockResetIcon />}>
                      Mật khẩu
                    </Button>
                    <IconButton color="error" onClick={() => handleDelete(user)}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* Nút phân trang kiểu Next/Prev (Khuyên dùng cho Firestore tối ưu chi phí) */}
      <Box display="flex" justifyContent="center" alignItems="center" gap={3} mt={5}>
        <Button
          variant="contained"
          disabled={page === 1}
          onClick={() => handlePageChange('prev')}
          startIcon={<ArrowBackIosIcon />}
        >
          Trang trước
        </Button>
        <Typography fontWeight="bold">Trang {page}</Typography>
        <Button
          variant="contained"
          disabled={isLastPage}
          onClick={() => handlePageChange('next')}
          endIcon={<ArrowForwardIosIcon />}
        >
          Trang sau
        </Button>
      </Box>

      {/* Dialog chung cho cả Xu và Mật khẩu */}
      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="xs">
        <DialogTitle>{dialogType === 'xu' ? 'Thay đổi số dư Xu' : 'Đặt lại mật khẩu mới'}</DialogTitle>
        <DialogContent>
          {dialogType === 'xu' ? (
            <TextField
              fullWidth
              autoFocus
              type="number"
              label="Số xu muốn thay đổi (+ / -)"
              placeholder="Ví dụ: 1000 hoặc -500"
              variant="standard"
              sx={{ mt: 1 }}
              value={xuAmount}
              onChange={e => setXuAmount(e.target.value)}
            />
          ) : (
            <TextField
              fullWidth
              autoFocus
              label="Mật khẩu mới (Tối thiểu 6 ký tự)"
              type="password"
              variant="standard"
              sx={{ mt: 1 }}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={closeDialog}>Hủy bỏ</Button>
          <Button
            onClick={dialogType === 'xu' ? handleXuUpdate : handlePasswordReset}
            variant="contained"
            color="primary"
          >
            Xác nhận
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Admin;
