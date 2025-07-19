# -*- coding: utf-8 -*-

from PySide6.QtCore import (
    QCoreApplication,
    QDate,
    QDateTime,
    QLocale,
    QMetaObject,
    QObject,
    QPoint,
    QRect,
    QSize,
    QTime,
    QUrl,
    Qt,
)
from PySide6.QtGui import (
    QBrush,
    QColor,
    QConicalGradient,
    QCursor,
    QFont,
    QFontDatabase,
    QGradient,
    QIcon,
    QImage,
    QKeySequence,
    QLinearGradient,
    QPainter,
    QPalette,
    QPixmap,
    QRadialGradient,
    QTransform,
)
from PySide6.QtWidgets import (
    QApplication,
    QFrame,
    QHBoxLayout,
    QLabel,
    QSizePolicy,
    QSplitter,
    QVBoxLayout,
    QWidget,
)

from rsi.gui.components.simple_graph_splitter import SimpleGraphSplitter
from rsi.gui.top_bar.top_bar import TopBar


class Ui_MainWidget(object):
    def setupUi(self, MainWidget):
        if not MainWidget.objectName():
            MainWidget.setObjectName("MainWidget")
        MainWidget.setWindowModality(Qt.NonModal)
        MainWidget.resize(1130, 721)
        sizePolicy = QSizePolicy(
            QSizePolicy.Policy.Preferred, QSizePolicy.Policy.Preferred
        )
        sizePolicy.setHorizontalStretch(0)
        sizePolicy.setVerticalStretch(0)
        sizePolicy.setHeightForWidth(MainWidget.sizePolicy().hasHeightForWidth())
        MainWidget.setSizePolicy(sizePolicy)
        font = QFont()
        font.setStyleStrategy(QFont.PreferAntialias)
        MainWidget.setFont(font)
        MainWidget.setStyleSheet("")
        self.verticalLayout = QVBoxLayout(MainWidget)
        self.verticalLayout.setSpacing(0)
        self.verticalLayout.setObjectName("verticalLayout")
        self.verticalLayout.setContentsMargins(0, 0, 0, 0)
        self.verticalLayout_4 = QVBoxLayout()
        self.verticalLayout_4.setSpacing(0)
        self.verticalLayout_4.setObjectName("verticalLayout_4")
        self.verticalLayout_4.setContentsMargins(-1, 0, -1, -1)
        self.frame = QFrame(MainWidget)
        self.frame.setObjectName("frame")
        sizePolicy.setHeightForWidth(self.frame.sizePolicy().hasHeightForWidth())
        self.frame.setSizePolicy(sizePolicy)
        self.frame.setMinimumSize(QSize(0, 47))
        self.frame.setMaximumSize(QSize(16777215, 47))
        self.frame.setFrameShape(QFrame.NoFrame)
        self.frame.setFrameShadow(QFrame.Raised)
        self.verticalLayout_8 = QVBoxLayout(self.frame)
        self.verticalLayout_8.setSpacing(0)
        self.verticalLayout_8.setObjectName("verticalLayout_8")
        self.verticalLayout_8.setContentsMargins(0, 0, 0, 0)
        self.verticalLayout_10 = QVBoxLayout()
        self.verticalLayout_10.setSpacing(0)
        self.verticalLayout_10.setObjectName("verticalLayout_10")
        self.frame_3 = QFrame(self.frame)
        self.frame_3.setObjectName("frame_3")
        self.frame_3.setMinimumSize(QSize(0, 2))
        self.frame_3.setMaximumSize(QSize(16777215, 2))
        self.frame_3.setStyleSheet("background-color: #474747;")
        self.frame_3.setFrameShape(QFrame.NoFrame)

        self.verticalLayout_10.addWidget(self.frame_3)

        self.horizontalLayout_2 = QHBoxLayout()
        self.horizontalLayout_2.setSpacing(0)
        self.horizontalLayout_2.setObjectName("horizontalLayout_2")
        self.frame_6 = QFrame(self.frame)
        self.frame_6.setObjectName("frame_6")
        self.frame_6.setMinimumSize(QSize(2, 0))
        self.frame_6.setMaximumSize(QSize(2, 45))
        self.frame_6.setStyleSheet("background-color: #474747;")
        self.frame_6.setFrameShape(QFrame.NoFrame)

        self.horizontalLayout_2.addWidget(self.frame_6)

        self.topbar = TopBar(self.frame)
        self.topbar.setObjectName("topbar")
        self.topbar.setMinimumSize(QSize(0, 45))
        self.topbar.setMaximumSize(QSize(16777215, 45))
        self.topbar.setFrameShape(QFrame.NoFrame)

        self.horizontalLayout_2.addWidget(self.topbar)

        self.frame_10 = QFrame(self.frame)
        self.frame_10.setObjectName("frame_10")
        self.frame_10.setMinimumSize(QSize(2, 0))
        self.frame_10.setMaximumSize(QSize(2, 45))
        self.frame_10.setLayoutDirection(Qt.LeftToRight)
        self.frame_10.setStyleSheet("background-color: #474747;")
        self.frame_10.setFrameShape(QFrame.NoFrame)

        self.horizontalLayout_2.addWidget(self.frame_10)

        self.verticalLayout_10.addLayout(self.horizontalLayout_2)

        self.verticalLayout_8.addLayout(self.verticalLayout_10)

        self.verticalLayout_4.addWidget(self.frame)

        self.frame_2 = QFrame(MainWidget)
        self.frame_2.setObjectName("frame_2")
        self.frame_2.setMinimumSize(QSize(0, 2))
        self.frame_2.setMaximumSize(QSize(16777215, 2))
        self.frame_2.setStyleSheet("background-color: #474747;")
        self.frame_2.setFrameShape(QFrame.NoFrame)

        self.verticalLayout_4.addWidget(self.frame_2)

        self.horizontalLayout = QHBoxLayout()
        self.horizontalLayout.setSpacing(0)
        self.horizontalLayout.setObjectName("horizontalLayout")
        self.frame_8 = QFrame(MainWidget)
        self.frame_8.setObjectName("frame_8")
        self.frame_8.setMinimumSize(QSize(2, 0))
        self.frame_8.setMaximumSize(QSize(2, 16777215))
        self.frame_8.setStyleSheet("background-color: #474747;")
        self.frame_8.setFrameShape(QFrame.NoFrame)

        self.horizontalLayout.addWidget(self.frame_8)


        self.frame_4 = QFrame(MainWidget)
        self.frame_4.setObjectName("frame_4")
        self.frame_4.setMinimumSize(QSize(2, 0))
        self.frame_4.setMaximumSize(QSize(2, 16777215))
        self.frame_4.setStyleSheet("background-color: #474747;")
        self.frame_4.setFrameShape(QFrame.NoFrame)

        self.horizontalLayout.addWidget(self.frame_4)

        self.chartview = QFrame(MainWidget)
        self.chartview.setObjectName("chartview")
        sizePolicy.setHeightForWidth(self.chartview.sizePolicy().hasHeightForWidth())
        self.chartview.setSizePolicy(sizePolicy)
        self.chartview.setMinimumSize(QSize(1000, 0))
        self.chartview.setStyleSheet("")
        self.chartview.setFrameShape(QFrame.NoFrame)
        self.horizontalLayout_3 = QHBoxLayout(self.chartview)
        self.horizontalLayout_3.setSpacing(0)
        self.horizontalLayout_3.setObjectName("horizontalLayout_3")
        self.horizontalLayout_3.setContentsMargins(0, 0, 0, 0)
        self.chartframe = QFrame(self.chartview)
        self.chartframe.setObjectName("chartframe")
        sizePolicy.setHeightForWidth(self.chartframe.sizePolicy().hasHeightForWidth())
        self.chartframe.setSizePolicy(sizePolicy)
        self.chartframe.setMinimumSize(QSize(800, 0))
        self.chartframe.setStyleSheet("")
        self.chartframe.setFrameShape(QFrame.NoFrame)
        self.verticalLayout_9 = QVBoxLayout(self.chartframe)
        self.verticalLayout_9.setSpacing(0)
        self.verticalLayout_9.setObjectName("verticalLayout_9")
        self.verticalLayout_9.setContentsMargins(0, 0, 0, 0)
        self.splitter = QSplitter(self.chartframe)
        self.splitter.setObjectName("splitter")
        sizePolicy.setHeightForWidth(self.splitter.sizePolicy().hasHeightForWidth())
        self.splitter.setSizePolicy(sizePolicy)
        self.splitter.setOrientation(Qt.Vertical)
        self.chartbox_splitter = SimpleGraphSplitter(self.splitter)
        self.chartbox_splitter.setObjectName("chartbox_splitter")
        sizePolicy1 = QSizePolicy(
            QSizePolicy.Policy.Preferred, QSizePolicy.Policy.Expanding
        )
        sizePolicy1.setHorizontalStretch(0)
        sizePolicy1.setVerticalStretch(0)
        sizePolicy1.setHeightForWidth(
            self.chartbox_splitter.sizePolicy().hasHeightForWidth()
        )
        self.chartbox_splitter.setSizePolicy(sizePolicy1)
        self.chartbox_splitter.setMinimumSize(QSize(800, 0))
        self.splitter.addWidget(self.chartbox_splitter)
        
        # Thêm label hiển thị giá trị RSI
        self.rsiLabel = QLabel(self.chartframe)
        self.rsiLabel.setObjectName("rsiLabel")
        self.rsiLabel.setText("RSI Monitor")
        self.rsiLabel.setStyleSheet("color: #FFD700; font-size: 18px; font-weight: bold;")
        self.rsiLabel.setAlignment(Qt.AlignCenter)
        self.verticalLayout_9.addWidget(self.rsiLabel)

        self.horizontalLayout_3.addWidget(self.chartframe)

        self.rightview = QFrame(self.chartview)
        self.rightview.setObjectName("rightview")
        sizePolicy.setHeightForWidth(self.rightview.sizePolicy().hasHeightForWidth())
        self.rightview.setSizePolicy(sizePolicy)
        self.rightview.setMaximumSize(QSize(0, 16777215))
        self.rightview.setFont(font)
        self.rightview.setStyleSheet("")
        self.rightview.setFrameShape(QFrame.NoFrame)

        self.horizontalLayout_3.addWidget(self.rightview)

        self.frame_9 = QFrame(self.chartview)
        self.frame_9.setObjectName("frame_9")
        self.frame_9.setMinimumSize(QSize(2, 0))
        self.frame_9.setMaximumSize(QSize(2, 16777215))
        self.frame_9.setStyleSheet("background-color: #474747;")
        self.frame_9.setFrameShape(QFrame.NoFrame)

        self.horizontalLayout_3.addWidget(self.frame_9)

        self.horizontalLayout.addWidget(self.chartview)

        self.frame_7 = QFrame(MainWidget)
        self.frame_7.setObjectName("frame_7")
        self.frame_7.setMinimumSize(QSize(2, 0))
        self.frame_7.setMaximumSize(QSize(2, 16777215))
        self.frame_7.setStyleSheet("background-color: #474747;")
        self.frame_7.setFrameShape(QFrame.NoFrame)

        self.horizontalLayout.addWidget(self.frame_7)

        self.verticalLayout_4.addLayout(self.horizontalLayout)

        self.frame_5 = QFrame(MainWidget)
        self.frame_5.setObjectName("frame_5")
        self.frame_5.setMinimumSize(QSize(0, 2))
        self.frame_5.setMaximumSize(QSize(16777215, 2))
        self.frame_5.setStyleSheet("background-color: #474747;")
        self.frame_5.setFrameShape(QFrame.NoFrame)

        self.verticalLayout_4.addWidget(self.frame_5)

        self.verticalLayout.addLayout(self.verticalLayout_4)

        self.retranslateUi(MainWidget)

        QMetaObject.connectSlotsByName(MainWidget)

    # setupUi

    def retranslateUi(self, MainWidget):
        MainWidget.setWindowTitle(
            QCoreApplication.translate("MainWidget", "Frame", None)
        )

    # retranslateUi
