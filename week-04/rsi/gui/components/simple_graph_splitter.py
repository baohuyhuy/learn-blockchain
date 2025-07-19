from PySide6.QtWidgets import QWidget, QVBoxLayout
from PySide6.QtCore import Signal
from ..components.rsi_widget import RSIWidget

class SimpleGraphSplitter(QWidget):
    """Simple GraphSplitter - RSI widget"""
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self._parent = parent
        self.chart = None
        self.setupUI()
    
    def setupUI(self):
        layout = QVBoxLayout()
        layout.setContentsMargins(0, 0, 0, 0)
        
        # Create RSI widget
        self.chart = RSIWidget(self)
        self.chart.setVisible(True)  # Make sure it's visible
        layout.addWidget(self.chart)
        
        self.setLayout(layout)
        print(f"SimpleGraphSplitter setup complete, chart size: {self.chart.size()}")
    
    def setup_chart(self, parent, exchange, symbol, interval):
        """Setup the chart with exchange, symbol and interval"""
        if self.chart:
            self.chart.setup_chart(parent, exchange, symbol, interval)
    
    # Compatibility methods that do nothing
    def show_hide_playbar(self):
        """Compatibility method - does nothing"""
        pass
    
    def create_indicator(self, indicator_data):
        """Compatibility method - does nothing"""
        pass

    @property
    def sig_show_process(self):
        """Return the chart's sig_show_process signal"""
        if self.chart and hasattr(self.chart, 'sig_show_process'):
            return self.chart.sig_show_process
        return None
