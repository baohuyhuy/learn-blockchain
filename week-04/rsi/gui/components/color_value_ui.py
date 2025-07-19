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
from PySide6.QtWidgets import QApplication, QHBoxLayout, QSizePolicy, QWidget

from rsi.gui.components._pushbutton import Color_Picker_Button
from rsi.gui.qfluentwidgets import CardWidget, TitleLabel


class Ui_color_value(object):
    def setupUi(self, color_value):
        if not color_value.objectName():
            color_value.setObjectName("color_value")
        color_value.resize(269, 35)
        color_value.setMinimumSize(QSize(0, 35))
        color_value.setMaximumSize(QSize(16777215, 35))
        self.horizontalLayout = QHBoxLayout(color_value)
        self.horizontalLayout.setSpacing(5)
        self.horizontalLayout.setObjectName("horizontalLayout")
        self.horizontalLayout.setContentsMargins(5, 1, 5, 1)
        self.tittle = TitleLabel(color_value)
        self.tittle.setObjectName("tittle")
        self.tittle.setMinimumSize(QSize(0, 33))
        self.tittle.setMaximumSize(QSize(16777215, 33))
        font = QFont()
        font.setFamilies(["Segoe UI"])
        font.setPointSize(13)
        font.setBold(False)
        self.tittle.setFont(font)

        self.horizontalLayout.addWidget(self.tittle)

        self.value = Color_Picker_Button(color_value)
        self.value.setObjectName("value")

        self.horizontalLayout.addWidget(self.value)

        self.retranslateUi(color_value)

        QMetaObject.connectSlotsByName(color_value)

    # setupUi

    def retranslateUi(self, color_value):
        color_value.setWindowTitle(
            QCoreApplication.translate("color_value", "Form", None)
        )
        self.tittle.setText(
            QCoreApplication.translate("color_value", "Title label", None)
        )
        self.value.setText("")

    # retranslateUi
