from typing import TYPE_CHECKING

from rsi.gui.qfluentwidgets.common import FluentIcon as FIF, CryptoIcon as CI
from rsi.gui.qfluentwidgets.components import VerticalSeparator

from rsi.gui.top_bar.interval import *
from rsi.gui.top_bar.symbol import *
from rsi.gui.top_bar.exchange import *

if TYPE_CHECKING:
    from views.mainlayout import MainWidget

from .topbar_ui import Ui_Frame as TopFrame

from PySide6.QtCore import Signal
from PySide6.QtWidgets import QFrame, QSizePolicy


class TopBar(QFrame, TopFrame):
    sig_change_symbol = Signal(tuple)
    sig_change_inteval = Signal(tuple)

    def __init__(self, parent=None):
        super().__init__(parent)
        self._parent: MainWidget = parent.parent()
        self.setupUi(self)
        self.setFixedHeight(40)
        # self.profile = AvatarButton(self._parent)
        self.exchange = CR_EXCHANGE(self.sig_change_symbol, self._parent)
        self.symbol = SymbolButton(
            self.sig_change_symbol, CI.BTC, "BTCUSDT", self._parent
        )
        self.interval = IntervalButton(self._parent, self.sig_change_inteval)

        # self.LayoutButton = LayoutButton(self._parent)
        # self.LayoutButton = DonateBtn("Sponsor",self._parent)

        # self.left_layout.setSpacing(1)
        # self.left_layout.addWidget(self.profile)
        # self.left_layout.addWidget(VerticalSeparator(self))
        self.left_layout.addWidget(self.exchange)
        self.left_layout.addWidget(VerticalSeparator(self))
        self.left_layout.addWidget(self.symbol)
        self.left_layout.addWidget(VerticalSeparator(self))
        self.left_layout.addWidget(self.interval)
        # self.left_layout.addWidget(self.candle)
        # self.left_layout.addWidget(VerticalSeparator(self))
        # self.right_layout.addWidget(self.LayoutButton)

        # self.left_layout.setSpacing(10)

        self._parent.mouse_clicked_signal.connect(self.symbol.delete)

        # self.setSizePolicy(QSizePolicy.Preferred,QSizePolicy.Preferred)

        # _w = self.width()
        # _interval_w = self.interval.width()
        # _interval_with_btn = self.interval._w

        # print(_w,_interval_w,_interval_with_btn)

        # self._parent._parent

        # self.resize(_w-_interval_w+_interval_with_btn, 45)

    def setup_symbol_menu(self):
        self.symbol.setup_menu()

    def get_current_symbol(self):
        if hasattr(self.symbol, 'get_current_symbol'):
            return self.symbol.get_current_symbol()
        return getattr(self.symbol, 'current_symbol', None)

    def get_current_interval(self):
        if hasattr(self.interval, 'get_current_interval'):
            return self.interval.get_current_interval()
        return getattr(self.interval, 'current_interval', None)

    def get_current_exchange(self):
        if hasattr(self.exchange, 'get_current_exchange'):
            return self.exchange.get_current_exchange()
        return getattr(self.exchange, 'current_exchange', None)

   
