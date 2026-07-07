import React, { useState } from 'react';
import './tiendao.css';
import imageList from '../../Image/ImageList';
import background from '../../Image/background.png';
const Tiendao = () => {
  const [result, setResult] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(null);

  const handleGetResult = () => {
    const sides = ['Giữa', 'Trái', 'Phải'];
    const percentage = Math.floor(Math.random() * (95 - 70 + 1)) + 70;
    const idx = Math.floor(Math.random() * 3);
    setSelectedIndex(idx);
    setResult(`${sides[idx]} (${percentage}%)`);
  };

  return (
    <div className="tiendao-container neo-panel">
     <img src = {background} alt="background" className="tiendao-background" />
      <div className="tiendao-title">Tiền Đạo Bóng Đá - MG</div>
        {result && <div className="tiendao-result">Kết quả: {result}</div>}
        {selectedIndex !== null && (
          <img className="tiendao-image" src={imageList[selectedIndex]} alt="Tiendao" />
        )}
      <button className="tiendao-btn" onClick={handleGetResult}>Lấy kết quả</button>

    </div>
  );
};

export default Tiendao;