import sys
from PySide6.QtWidgets import QWidget, QVBoxLayout, QHBoxLayout, QLabel
from PySide6.QtCore import Qt, QTimer, Signal, QEvent
from PySide6.QtGui import QPainter, QPen, QColor, QFont
import random

class RSIChartArea(QWidget):
    """Chart area for drawing RSI line"""
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.rsi_widget = parent
        self.setMinimumHeight(400)
    
    def paintEvent(self, event):
        """Draw RSI line chart"""
        if not self.rsi_widget:
            return
            
        painter = QPainter(self)
        painter.setRenderHint(QPainter.Antialiasing)
        
        # Get widget dimensions
        width = self.width()
        height = self.height()
        
        # Chart area (leave margins)
        margin = 50
        chart_width = width - 2 * margin
        chart_height = height - 50
        chart_y = 25
        
        # Draw background
        painter.fillRect(margin, chart_y, chart_width, chart_height, QColor(40, 40, 40))
        
        # Draw RSI levels
        pen = QPen(QColor(80, 80, 80), 1)
        painter.setPen(pen)
        
        # 70 level (overbought)
        y_70 = chart_y + chart_height - (70 * chart_height / 100)
        painter.drawLine(margin, y_70, margin + chart_width, y_70)
        painter.drawText(margin + 5, y_70 - 5, "70")
        
        # 50 level (middle)
        y_50 = chart_y + chart_height - (50 * chart_height / 100)
        painter.drawLine(margin, y_50, margin + chart_width, y_50)
        painter.drawText(margin + 5, y_50 - 5, "50")
        
        # 30 level (oversold)
        y_30 = chart_y + chart_height - (30 * chart_height / 100)
        painter.drawLine(margin, y_30, margin + chart_width, y_30)
        painter.drawText(margin + 5, y_30 - 5, "30")
        
        # Draw RSI line
        rsi_values = self.rsi_widget.rsi_values
        if len(rsi_values) > 1:
            pen = QPen(QColor(255, 165, 0), 2)  # Orange color
            painter.setPen(pen)
            
            max_points = self.rsi_widget.max_points
            points_to_draw = min(len(rsi_values), max_points)
            x_step = chart_width / (points_to_draw - 1) if points_to_draw > 1 else 0
            
            for i in range(1, points_to_draw):
                x1 = margin + (i - 1) * x_step
                y1 = chart_y + chart_height - (rsi_values[len(rsi_values) - points_to_draw + i - 1] * chart_height / 100)
                x2 = margin + i * x_step
                y2 = chart_y + chart_height - (rsi_values[len(rsi_values) - points_to_draw + i] * chart_height / 100)
                
                painter.drawLine(x1, y1, x2, y2)

class RSIWidget(QWidget):
    """Simple RSI monitoring widget"""
    
    # Signals to maintain compatibility with the main app
    sig_change_tab_infor = Signal(tuple)
    mouse_clicked_on_chart = Signal(QEvent)
    sig_show_process = Signal(bool)
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self._parent = parent
        self.setMinimumSize(800, 600)
        self.setStyleSheet("background-color: #1e1e1e; color: white;")
        
        # RSI data
        self.rsi_values = []
        self.max_points = 100
        self.current_rsi = 50.0
        
        # Exchange info for display only
        self.exchange_name = "binanceusdm"
        self.symbol = "BTC/USDT"
        self.interval = "1m"
        
        # Timer for updating RSI
        self.timer = QTimer()
        self.timer.timeout.connect(self.update_rsi)
        self.timer.start(1000)  # Update every second
        
        # Initialize with some sample data
        for i in range(50):
            self.rsi_values.append(random.uniform(30, 70))
        
        self.setupUI()
    
    def setupUI(self):
        layout = QVBoxLayout()
        
        # Title
        title = QLabel("RSI-14 Monitor")
        title.setAlignment(Qt.AlignCenter)
        title.setStyleSheet("font-size: 24px; font-weight: bold; margin: 10px;")
        layout.addWidget(title)
        
        # Current RSI value
        self.rsi_label = QLabel(f"RSI monitoring: {self.current_rsi:.2f}")
        self.rsi_label.setAlignment(Qt.AlignCenter)
        self.rsi_label.setStyleSheet("font-size: 18px; margin: 10px;")
        layout.addWidget(self.rsi_label)
        
        # RSI chart area
        self.chart_area = RSIChartArea(self)
        layout.addWidget(self.chart_area)
        
        self.setLayout(layout)
    
    def update_rsi(self):
        """Update RSI value with simulated data"""
        # Simple random walk for RSI
        change = random.uniform(-2, 2)
        self.current_rsi = max(0, min(100, self.current_rsi + change))
        
        # Add to history
        self.rsi_values.append(self.current_rsi)
        if len(self.rsi_values) > self.max_points:
            self.rsi_values.pop(0)
        
        # Update label
        self.rsi_label.setText(f"RSI monitoring: {self.current_rsi:.2f}")
        
        # Color based on RSI level
        if self.current_rsi > 70:
            self.rsi_label.setStyleSheet("font-size: 18px; margin: 10px; color: #ff4444;")
        elif self.current_rsi < 30:
            self.rsi_label.setStyleSheet("font-size: 18px; margin: 10px; color: #44ff44;")
        else:
            self.rsi_label.setStyleSheet("font-size: 18px; margin: 10px; color: white;")
        
        # Update chart area
        self.chart_area.update()
    
    def mousePressEvent(self, event):
        """Handle mouse clicks"""
        self.mouse_clicked_on_chart.emit(event)
        super().mousePressEvent(event)
    
    # Compatibility methods for the main app
    def setup_chart(self, parent, exchange, symbol, interval):
        """Setup RSI with display info only"""
        self._parent = parent
        self.exchange_name = exchange
        self.symbol = symbol
        self.interval = interval
        
        # Emit signal to update tab info
        self.sig_change_tab_infor.emit((symbol, interval))
        
        # Emit process signal
        self.sig_show_process.emit(False)
    
    def on_reset_exchange(self, data):
        """Handle exchange/symbol change"""
        try:
            if isinstance(data, tuple) and len(data) >= 3:
                self.exchange_name = data[2]
                self.symbol = data[1]
            elif isinstance(data, dict):
                self.exchange_name = data.get('exchange', 'binanceusdm')
                self.symbol = data.get('symbol', 'BTC/USDT')
            
            # Update display info
            self.sig_change_tab_infor.emit((self.symbol, self.interval))
            
        except Exception as e:
            print(f"Error resetting exchange: {e}")
    
    def on_change_inteval(self, data):
        """Handle interval change"""
        try:
            if isinstance(data, dict):
                self.interval = data.get('interval', '1m')
            else:
                self.interval = str(data)
            
            # Update display info
            self.sig_change_tab_infor.emit((self.symbol, self.interval))
            
        except Exception as e:
            print(f"Error changing interval: {e}")
    
    def update_rsi_simulated(self):
        """Simulated RSI update"""
        # Generate new RSI value (simulated)
        trend = random.choice([-1, 0, 1])
        change = random.uniform(-2, 2) + trend * 0.5
        self.current_rsi = max(0, min(100, self.current_rsi + change))
        
        # Add to values array
        self.rsi_values.append(self.current_rsi)
        if len(self.rsi_values) > self.max_points:
            self.rsi_values.pop(0)
        
        # Update UI
        self.rsi_label.setText(f"RSI monitoring: {self.current_rsi:.2f}")
        self.chart_area.update()
    
    def update_rsi(self):
        """Update RSI with simulated data"""
        self.update_rsi_simulated()
    
    def closeEvent(self, event):
        """Clean up when closing"""
        super().closeEvent(event)
