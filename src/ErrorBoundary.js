import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <div style={{
          padding: '20px',
          margin: '20px',
          border: '1px solid #ff6b6b',
          borderRadius: '8px',
          backgroundColor: '#fff5f5'
        }}>
          <h2 style={{ color: '#c92a2a', marginTop: 0 }}>Đã xảy ra lỗi</h2>
          <p style={{ color: '#868e96' }}>
            Ứng dụng gặp lỗi không mong muốn. Vui lòng refresh trang để thử lại.
          </p>
          <details style={{ marginTop: '10px', color: '#495057' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Chi tiết lỗi</summary>
            <pre style={{
              marginTop: '10px',
              padding: '10px',
              backgroundColor: '#f8f9fa',
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '12px'
            }}>
              {this.state.error && this.state.error.toString()}
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </pre>
          </details>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '15px',
              padding: '10px 20px',
              backgroundColor: '#228be6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Refresh Trang
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

