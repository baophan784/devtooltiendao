import React, { useState, useEffect, useRef } from 'react';
import { Box, TextField, Button, Typography, Paper, Grid, IconButton, Divider } from '@mui/material';
import { collection, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import MinimizeIcon from '@mui/icons-material/Minimize';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import PhoneIcon from '@mui/icons-material/Phone';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { motion } from 'framer-motion';
import Menu from './Menu';
import './App.css';

// Protect String.prototype.link from being called on null/undefined
// This prevents the error "String.prototype.link called on null or undefined"
if (typeof String.prototype.link === 'function') {
  const originalLink = String.prototype.link;
  String.prototype.link = function(url) {
    // If 'this' is null or undefined, return empty string instead of throwing error
    if (this == null || this === undefined) {
      console.warn('String.prototype.link called on null/undefined, returning empty string');
      return '';
    }
    try {
      return originalLink.call(this, url);
    } catch (e) {
      console.warn('Error calling String.prototype.link:', e);
      return '';
    }
  };
}

function App() {
  const [analyzingResult, setAnalyzingResult] = useState('');
  const [username, setUsername] = useState('');
  const [contact, setContact] = useState('');
  const [type, setType] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [result, setResult] = useState('');
  const [countdown, setCountdown] = useState(10);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const avatarRef = useRef(null);
  const resultRef = useRef(null);
  const [touchStartTime, setTouchStartTime] = useState(0);
  const [touchStartPosition, setTouchStartPosition] = useState({ x: 0, y: 0 });
  const iframeRef = useRef(null);
  const [iframeSrc, setIframeSrc] = useState("https://tipslot.win/");



  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Kiểm tra xem username đã tồn tại chưa
      const userDoc = await getDoc(doc(db, 'users', username));
      
      if (!userDoc.exists()) {
        // Nếu tài khoản chưa tồn tại, thêm mới
        await setDoc(doc(db, 'users', username), {
          username,
          contact,
          type: 0,
          timestamp: new Date()
        });
      } else {
        // Nếu tài khoản đã tồn tại, lấy giá trị type từ Firebase
        const userType = userDoc.data()?.type;
        // Defensive check: ensure type is never null or undefined
        setType(typeof userType === 'number' ? userType : 0);
      }
      
      setIsSubmitted(true);
    } catch (error) {
      console.error('Error: ', error);
    }
  };

  const handleMouseDown = (e) => {
    const targetRef = e.target.closest('.minimized-avatar') ? avatarRef : resultRef;
    if (e.target === targetRef.current || 
        (e.target.closest('.draggable-area') && !e.target.closest('.minimize-button')) ||
        e.target.closest('.minimized-avatar')) {
      e.preventDefault();
      setIsDragging(true);
      const rect = targetRef.current.getBoundingClientRect();
      const clientX = e.clientX || e.touches[0].clientX;
      const clientY = e.clientY || e.touches[0].clientY;
      setDragOffset({
        x: clientX - rect.left,
        y: clientY - rect.top
      });

      // Lưu thời gian và vị trí bắt đầu chạm cho mobile
      if (e.touches) {
        setTouchStartTime(Date.now());
        setTouchStartPosition({
          x: e.touches[0].clientX,
          y: e.touches[0].clientY
        });
      }
    }
  };

  const handleTouchEnd = (e) => {
    const touchEndTime = Date.now();
    const touchDuration = touchEndTime - touchStartTime;
    
    // Nếu thời gian chạm ngắn (dưới 200ms) và không di chuyển nhiều (dưới 10px) thì coi là click
    if (touchDuration < 200 && e.changedTouches) {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const moveDistance = Math.sqrt(
        Math.pow(touchEndX - touchStartPosition.x, 2) +
        Math.pow(touchEndY - touchStartPosition.y, 2)
      );
      
      if (moveDistance < 10) {
        setIsMinimized(false);
      }
    }
    
    setIsDragging(false);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const clientX = e.clientX || e.touches[0].clientX;
    const clientY = e.clientY || e.touches[0].clientY;
    setPosition({
      x: clientX - dragOffset.x,
      y: clientY - dragOffset.y
    });
  };

  const handleMouseUp = (e) => {
    if (isDragging) {
      e.preventDefault();
    }
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleMouseMove);
      window.addEventListener('touchend', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const handleIframeLoad = () => {
    // Prevent iframe from polluting global scope
    // Protect critical prototypes from being modified
    try {
      // Lock String.prototype to prevent modification
      const stringProto = String.prototype;
      if (stringProto && !stringProto.hasOwnProperty('_locked')) {
        try {
          Object.defineProperty(stringProto, '_locked', {
            value: true,
            writable: false,
            configurable: false
          });
        } catch (e) {
          // Ignore if already locked
        }
      }
    } catch (e) {
      console.warn('Could not protect String.prototype:', e);
    }

    // Override window.open sau khi iframe load xong - an toàn hơn
    try {
      // Kiểm tra và override window.open
      if (typeof window !== 'undefined' && typeof window.open === 'function') {
        const originalWindowOpen = window.open.bind(window);
        
        window.open = function(url, target, features) {
          try {
            if (url && typeof url === 'string' && url !== 'about:blank' && url !== '_blank') {
              console.log('🔍 Window.open được gọi từ iframe context:', url);
              
              let finalUrl = url;
              // Convert relative URL nếu cần
              if (!url.startsWith('http://') && !url.startsWith('https://')) {
                try {
                  const currentSrc = new URL(iframeSrc);
                  finalUrl = new URL(url, currentSrc.origin).href;
                } catch (e) {
                  // Không thể convert
                }
              }
              
              // Load trong iframe - defensive check
              if (finalUrl && finalUrl !== 'about:blank' && typeof finalUrl === 'string') {
                setIframeSrc(finalUrl);
              }
              return null; // Chặn mở tab mới
            }
            return null;
          } catch (error) {
            console.error('⚠️ Lỗi trong window.open override:', error);
            return null;
          }
        };
        
        console.log('✅ Đã override window.open trong handleIframeLoad');
      }
    } catch (e) {
      console.warn('⚠️ Không thể override window.open trong handleIframeLoad:', e);
    }
    
    try {
      const iframe = iframeRef.current;
      
      // Thử override window.open trong iframe context sau khi load
      try {
        const iframeWindow = iframe?.contentWindow;
        const iframeDocument = iframe?.contentDocument;
        
        if (iframeWindow && iframeDocument) {
          // Inject script để override window.open trong iframe
          const script = iframeDocument.createElement('script');
          script.textContent = `
            (function() {
              const originalOpen = window.open;
              window.open = function(url, target, features) {
                // Gửi message về parent window
                if (window.parent && window.parent !== window) {
                  window.parent.postMessage({
                    type: 'navigate',
                    url: url || '',
                    target: target || '',
                    features: features || ''
                  }, '*');
                }
                // Không mở tab mới
                return null;
              };
              
              // Override tất cả links có target="_blank"
              document.addEventListener('click', function(e) {
                const link = e.target.closest('a[target="_blank"], a[href^="http"]');
                if (link && link.href) {
                  e.preventDefault();
                  e.stopPropagation();
                  if (window.parent && window.parent !== window) {
                    window.parent.postMessage({
                      type: 'navigate',
                      url: link.href
                    }, '*');
                  }
                  return false;
                }
              }, true);
            })();
          `;
          iframeDocument.head.appendChild(script);
          
          // Cũng thử override trực tiếp (nếu có thể)
          const originalOpen = iframeWindow.open;
          if (originalOpen && typeof originalOpen === 'function') {
            iframeWindow.open = function(url, target, features) {
              // Defensive check: ensure url is a valid string
              if (url && typeof url === 'string' && url.trim() !== '') {
                setIframeSrc(url);
              }
              return null;
            };
          }
        }
      } catch (e) {
        // Không thể truy cập iframe window do CORS - điều này là bình thường
        console.warn("Không thể inject script vào iframe (CORS).", e);
      }
      
      // Thử set target="_self" cho tất cả links
      try {
        const links = iframe?.contentDocument?.querySelectorAll("a");
        if (links) {
          links.forEach(link => {
            link.setAttribute("target", "_self");
            // Thêm event listener để intercept clicks
            link.addEventListener('click', function(e) {
              if (this.href && typeof this.href === 'string' && (this.target === '_blank' || !this.target)) {
                e.preventDefault();
                setIframeSrc(this.href);
                return false;
              }
            }, true);
          });
        }
      } catch (e) {
        // CORS
      }
    } catch (e) {
      console.warn("Không thể chỉnh sửa iframe (CORS).");
    }
  };

  // CHỈ xử lý postMessage từ iframe - KHÔNG override window.open ở đây
  useEffect(() => {
    // Lắng nghe postMessage từ iframe (nếu website hỗ trợ)
    const handleMessage = (event) => {
        console.log('📨 Nhận postMessage:', event.origin, event.data);
      
      // Kiểm tra origin - chấp nhận từ iframe hoặc các domain liên quan
      try {
        const iframeUrl = new URL(iframeSrc);
        const isFromIframe = event.origin === iframeUrl.origin || 
                            event.origin.endsWith('.' + iframeUrl.hostname) ||
                            event.origin.includes(iframeUrl.hostname) ||
                            event.origin.includes('fly88u.cc') ||
                            event.origin.includes('fly88') ||
                            !event.origin || // Cho phép message không có origin (local files)
                            event.origin === window.location.origin; // Cho phép từ cùng origin
        
        // Nếu là từ iframe hoặc bất kỳ domain nào
        if (isFromIframe || event.data?.type === 'navigate' || event.data?.type === 'EVENT_UPDATE_LOBBY_DOMAIN') {
          console.log('✅ Nhận message từ iframe, xử lý...');
          
          // Hàm helper để tìm URL trong payload
          const findUrlInData = (data) => {
            if (!data) return null;
            
            // Kiểm tra các trường hợp phổ biến
            if (typeof data === 'string' && (data.startsWith('http://') || data.startsWith('https://'))) {
              return data;
            }
            if (data.url) return data.url;
            if (data.href) return data.href;
            if (data.link) return data.link;
            if (data.domain && data.domain.startsWith('http')) return data.domain;
            
            // Tìm trong payload
            if (data.payload) {
              if (typeof data.payload === 'string' && data.payload.startsWith('http')) {
                return data.payload;
              }
              if (data.payload.url) return data.payload.url;
              if (data.payload.href) return data.payload.href;
              if (data.payload.domain && data.payload.domain.startsWith('http')) {
                return data.payload.domain;
              }
              // Tìm bất kỳ field nào chứa URL
              for (const key in data.payload) {
                const value = data.payload[key];
                if (typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'))) {
                  return value;
                }
              }
            }
            
            // Tìm trong toàn bộ object
            const dataStr = JSON.stringify(data);
            const urlMatch = dataStr.match(/https?:\/\/[^\s"']+/);
            if (urlMatch) {
              return urlMatch[0];
            }
            
            return null;
          };
          
          // Xử lý bridge messages - trả lời để tránh timeout
          if (event.data?.type === 'EVENT_UPDATE_LOBBY_DOMAIN' || event.data?.uuid) {
            console.log('🌉 Bridge message detected:', event.data);
            
            // Tìm URL trong bridge message để load vào iframe
            const foundUrl = findUrlInData(event.data);
            if (foundUrl && typeof foundUrl === 'string' && foundUrl.trim() !== '') {
              console.log('🎮 Tìm thấy URL game trong bridge message:', foundUrl);
              setIframeSrc(foundUrl);
            }
            
            // Xử lý EVENT_UPDATE_LOBBY_DOMAIN - có thể cần cung cấp domain
            if (event.data?.type === 'EVENT_UPDATE_LOBBY_DOMAIN') {
              try {
                const iframeWindow = iframeRef.current?.contentWindow;
                if (iframeWindow) {
                  // Lấy domain hiện tại từ iframeSrc
                  const currentDomain = new URL(iframeSrc).origin;
                  
                  // Trả lời với domain hiện tại
                  const response = {
                    uuid: event.data.uuid,
                    type: event.data.type,
                    status: 1,
                    payload: {
                      success: true,
                      domain: currentDomain,
                      message: 'Domain updated successfully'
                    }
                  };
                  
                  iframeWindow.postMessage(response, event.origin || '*');
                  console.log('✅ Đã trả lời bridge message với domain:', currentDomain);
                }
              } catch (e) {
                console.warn('⚠️ Không thể trả lời bridge message:', e);
                // Fallback: trả lời đơn giản
                try {
                  const iframeWindow = iframeRef.current?.contentWindow;
                  if (iframeWindow) {
                    iframeWindow.postMessage({
                      uuid: event.data.uuid,
                      type: event.data.type,
                      status: 1,
                      payload: { success: true }
                    }, event.origin || '*');
                  }
                } catch (e2) {
                  console.warn('⚠️ Fallback response cũng thất bại:', e2);
                }
              }
            }
            // Xử lý các bridge messages khác
            else if (event.data?.uuid) {
              try {
                const iframeWindow = iframeRef.current?.contentWindow;
                if (iframeWindow) {
                  iframeWindow.postMessage({
                    uuid: event.data.uuid,
                    type: event.data.type || 'RESPONSE',
                    status: 1,
                    payload: { success: true, ...event.data.payload }
                  }, event.origin || '*');
                  console.log('✅ Đã trả lời bridge message (generic)');
                }
              } catch (e) {
                console.warn('⚠️ Không thể trả lời bridge message:', e);
              }
            }
          }
          
          // Xử lý các message từ iframe
          if (event.data) {
            let urlToLoad = null;
            
            // Ưu tiên: Tìm URL trong bất kỳ đâu trong data
            urlToLoad = findUrlInData(event.data);
            
            // Nếu không tìm thấy, thử các cách khác
            if (!urlToLoad) {
              // Nếu có type navigate, load URL mới
              if (event.data.type === 'navigate' && event.data.url) {
                urlToLoad = event.data.url;
                console.log('📍 Navigate từ postMessage:', urlToLoad);
              }
              // Nếu data là object có url property
              else if (event.data.url) {
                urlToLoad = event.data.url;
                console.log('📍 URL từ data object:', urlToLoad);
              }
            }
            
            // Load URL nếu có - defensive check
            if (urlToLoad && typeof urlToLoad === 'string' && urlToLoad.trim() !== '') {
              console.log('✅ Đang load URL từ postMessage vào iframe:', urlToLoad);
              setIframeSrc(urlToLoad);
            }
          }
        } else {
          console.log('⚠️ Message từ origin không khớp:', event.origin);
        }
      } catch (e) {
        // Nếu có lỗi parse, vẫn thử xử lý message
        console.warn('⚠️ Lỗi xử lý message, thử xử lý trực tiếp:', e);
        if (event.data?.url || (typeof event.data === 'string' && event.data.startsWith('http'))) {
          const urlToLoad = event.data?.url || event.data;
          // Defensive check: ensure urlToLoad is a valid string
          if (urlToLoad && typeof urlToLoad === 'string' && urlToLoad.trim() !== '') {
            console.log('✅ Load URL từ message (fallback):', urlToLoad);
            setIframeSrc(urlToLoad);
          }
        }
      }
    };

      window.addEventListener('message', handleMessage);

    // Cleanup
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [iframeSrc]);

  return (
    <div style={{ 
      width: '100%', 
      height: '100vh',
      overflow: 'hidden',
      position: 'fixed'
    }}>
      <iframe
        ref={iframeRef}
        src={iframeSrc}
        onLoad={handleIframeLoad}
        style={{ 
          width: '100%', 
          height: '100%', 
          border: 'none',
          overflow: 'hidden',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
          touchAction: 'none',
          WebkitTouchCallout: 'none',
          WebkitUserDrag: 'none',
          WebkitTapHighlightColor: 'transparent',
          WebkitTextSizeAdjust: 'none',
          textSizeAdjust: 'none',
          fontSizeAdjust: 'none',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale'
        }}
        title="F168 Frame"
        scrolling="no"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation allow-modals"
      />
      
      <Menu
        avatarRef={avatarRef}
        resultRef={resultRef}
        position={position}
        isDragging={isDragging}
        handleMouseDown={handleMouseDown}
        handleTouchEnd={handleTouchEnd}
        isMinimized={isMinimized}
        setIsMinimized={setIsMinimized}
        isSubmitted={isSubmitted}
        handleSubmit={handleSubmit}
        username={username}
        setUsername={setUsername}
        contact={contact}
        setContact={setContact}
        result={result}
        type={type}
        setIsSubmitted={setIsSubmitted}
      />
    </div>
  );
}

export default App;
