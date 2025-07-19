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

from rsi.gui.qfluentwidgets import CardWidget, IconWidget, TitleLabel
from rsi.gui.qfluentwidgets import resource as resource_rc


class Ui_Form(object):
    def setupUi(self, Form):
        if not Form.objectName():
            Form.setObjectName("Form")
        Form.resize(301, 40)
        Form.setMinimumSize(QSize(200, 40))
        Form.setMaximumSize(QSize(16777215, 45))
        self.horizontalLayout = QHBoxLayout(Form)
        self.horizontalLayout.setSpacing(5)
        self.horizontalLayout.setObjectName("horizontalLayout")
        self.horizontalLayout.setContentsMargins(5, 1, 5, 1)
        self.exchange_icon = IconWidget(Form)
        self.exchange_icon.setObjectName("exchange_icon")
        self.exchange_icon.setMinimumSize(QSize(25, 25))
        self.exchange_icon.setMaximumSize(QSize(25, 25))

        self.horizontalLayout.addWidget(self.exchange_icon)

        self.TitleLabel = TitleLabel(Form)
        self.TitleLabel.setObjectName("TitleLabel")
        font = QFont()
        font.setFamilies(["Segoe UI"])
        font.setPointSize(13)
        font.setBold(False)
        self.TitleLabel.setFont(font)

        self.horizontalLayout.addWidget(self.TitleLabel)

        self.retranslateUi(Form)

        QMetaObject.connectSlotsByName(Form)

    # setupUi

    def retranslateUi(self, Form):
        Form.setWindowTitle(QCoreApplication.translate("Form", "Form", None))
        self.TitleLabel.setText(QCoreApplication.translate("Form", "Title label", None))

    # retranslateUi
