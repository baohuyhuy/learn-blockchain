from typing import TYPE_CHECKING
from .mainwidget_ui import Ui_MainWidget
from rsi.gui.components import CircularProgress
from rsi.gui.qfluentwidgets.common import FluentStyleSheet
from PySide6.QtWidgets import QFrame, QWidget, QHBoxLayout, QSizePolicy
from rsi.gui.components.card_monitor_widget import CardMonitorWidget
from PySide6.QtCore import Signal, Qt, QEvent, QTime
from rsi.gui.qfluentwidgets.common.icon import *
from rsi.appmanager.setting import AppConfig
from rsi.controls.main import calculate_rsi_wilder
from rsi.controls.manager import ExchangeManager
import asyncio
from rsi.controls.monitor import RSIMonitor

if TYPE_CHECKING:
    from .fluentwindow import WindowBase


class MainWidget(QWidget, Ui_MainWidget):
    mouse_clicked_signal = Signal(QEvent)

    def __init__(
        self, parent, tabItem, name, current_ex, current_symbol, curent_interval
    ):
        super().__init__(parent)
        self._parent: WindowBase = parent
        self.setObjectName(name)
        self.setupUi(self)

        self.maxExtend = 250
        self.tabItem = tabItem

        self.current_ex = current_ex
        self.current_symbol = current_symbol
        self.current_interval = curent_interval  # Lưu interval hiện tại


        # --- Card Monitor Section ---
        from PySide6.QtWidgets import QWidget, QSizePolicy, QScrollArea, QGridLayout
        self.card_scroll = QScrollArea()
        self.card_scroll.setWidgetResizable(True)
        self.card_scroll.setStyleSheet("QScrollArea { background: transparent; border: none; }")
        # Card height ~160, spacing ~30, 2 dòng: (2*160 + 1*30 + top/bottom margin)
        self.card_scroll.setFixedHeight(2*160 + 1*30 + 2*30)
        self.card_container = QWidget()
        self.card_container.setStyleSheet("background: transparent;")
        self.card_layout = QGridLayout(self.card_container)
        self.card_layout.setContentsMargins(30, 30, 30, 30)
        self.card_layout.setSpacing(30)
        self.card_monitors = {}  # key: unique_key, value: CardMonitorWidget
        self.card_scroll.setWidget(self.card_container)
        self.verticalLayout_9.addWidget(self.card_scroll)

        # Demo: add first card for current_symbol/current_ex/current_interval
        self.add_monitor_card(self.current_symbol, self.current_ex, {self.current_interval: '--'})

        # KHÔNG gọi asyncio.create_task ở đây để tránh lỗi event loop
        # Nếu muốn cập nhật RSI ban đầu, có thể gọi hàm sync lấy dữ liệu hoặc cập nhật khi có event loop
        # self.set_rsi_value('--')  # Hiển thị mặc định khi khởi tạo

        # Keep only essential chart signals
        self.chartbox_splitter.chart.sig_change_tab_infor.connect(
            self.change_tab_infor, Qt.ConnectionType.AutoConnection
        )
        self.chartbox_splitter.chart.mouse_clicked_on_chart.connect(
            self.mouse_clicked_signal
        )

        self.tool_name: str = None

        "signal from TopBar--------start"
        self.topbar.sig_change_symbol.connect(
            self.on_symbol_changed,
            Qt.ConnectionType.AutoConnection,
        )
        self.topbar.sig_change_inteval.connect(
            self.on_interval_changed,
            Qt.ConnectionType.AutoConnection,
        )
        "signal from TopBar-------end"


        "khởi tạo indicator menu, symbol menu trước. đang test"
        self.topbar.setup_symbol_menu()

        # Remove bottom interface for minimal RSI app
        # self.TabInterface = BottomInterface(self)
        # self.layout_bottom.addWidget(self.TabInterface)
        # self.splitter.setSizes([600, 60])

        self.press_time = None
        self.release_time = None

    def add_monitor_card(self, symbol, exchange, rsi_dict):
        unique_key = f"{symbol}({exchange})"
        if unique_key in self.card_monitors:
            # Đã có card, chỉ update giá trị
            self.card_monitors[unique_key].update_rsi(rsi_dict)
            return
        card = CardMonitorWidget(symbol, exchange, rsi_dict, unique_key)
        card.setSizePolicy(QSizePolicy.Fixed, QSizePolicy.Fixed)
        card.closeRequested.connect(self.remove_monitor_card)
        # Tính vị trí dòng/cột
        n = len(self.card_monitors)
        row = n // 5
        col = n % 5
        self.card_layout.addWidget(card, row, col)
        self.card_monitors[unique_key] = card

    def remove_monitor_card(self, unique_key):
        card = self.card_monitors.pop(unique_key, None)
        if card:
            card.setParent(None)
            card.deleteLater()

    def update_monitor_card(self, symbol, exchange, interval, value):
        unique_key = f"{symbol}({exchange})"
        if unique_key in self.card_monitors:
            card = self.card_monitors[unique_key]
            # Luôn truyền giá trị vào mốc '1m', các mốc khác giữ nguyên
            rsi_dict = card.rsi_dict.copy()
            rsi_dict['1m'] = value
            card.update_rsi(rsi_dict)

    # Nếu muốn tự động thêm card khi monitor token mới, có thể gọi add_monitor_card ở các sự kiện đổi symbol/interval



    def resizeEvent(self, e):
        super().resizeEvent(e)
        # Progress disabled for RSI monitor
        pass

    def change_tab_infor(self, data):
        symbol = data[0]
        interval = data[1]
        symbol_icon = get_symbol_icon(symbol)
        symbol_icon_path = CryptoIcon.crypto_url(symbol_icon)
        text = f"{symbol} {interval}"
        self.tabItem.setIcon(symbol_icon_path)
        self.tabItem.setText(text)

        # self.maxExtend = width

    def mousePressEvent(self, ev: QEvent):
        if Qt.MouseButton.LeftButton:
            self.press_time = QTime.currentTime()
            super().mousePressEvent(ev)

    def mouseReleaseEvent(self, ev: QEvent):
        self.is_mouse_pressed = False
        self.release_time = QTime.currentTime()
        if self.press_time:
            elapsed_time = self.press_time.msecsTo(self.release_time)
            if elapsed_time < 200:
                self.mouse_clicked_signal.emit(ev)
        super().mouseReleaseEvent(ev)

    def set_rsi_value(self, value):
        # Deprecated: Đã chuyển sang update_monitor_card
        pass

    async def update_rsi(self, symbol, interval, exchange_id):
        manager = ExchangeManager()
        ws = manager.set_ws_exchange(exchange_id, "chart1", symbol, interval, apikey="", secretkey="")
        candles = await ws.fetch_ohlcv(symbol, timeframe=interval, limit=100)
        closes = [c[4] for c in candles]
        rsi = await calculate_rsi_wilder(closes, period=14)
        self.set_rsi_value(rsi)
        # Đóng kết nối exchange để tránh lỗi unclosed client session
        if hasattr(ws, 'close'):
            await ws.close()


    def on_symbol_changed(self, args):
        # args: ("change_symbol", symbol, exchange_id, exchange_name, symbol_icon_path, echange_icon_path, _mode)
        symbol = args[1]
        exchange_id = args[2]
        # Luôn dùng self.current_interval để đảm bảo interval hợp lệ
        # Tự động thêm card nếu chưa có
        self.add_monitor_card(symbol, exchange_id, {self.current_interval: '--'})

    def on_interval_changed(self, args):
        # args: ("change_interval", interval)
        interval = args[1]
        self.current_interval = interval  # Cập nhật interval hiện tại
        symbol = self.topbar.get_current_symbol()
        exchange_id = self.topbar.get_current_exchange()
        # Tự động thêm card nếu chưa có
        self.add_monitor_card(symbol, exchange_id, {interval: '--'})
