import multiprocessing
import sys
import os
import asyncio
import warnings
from PySide6.QtCore import QCoreApplication, Qt
from PySide6.QtGui import QCloseEvent
from PySide6.QtWidgets import QApplication
from rsi.gui.qfluentwidgets.common.style_sheet import setTheme, Theme
from rsi.gui.qfluentwidgets.components.dialog_box import MessageBox
from rsi.gui.views.fluentwindow import WindowBase
from rsi.appmanager.setting.config import cfg
from qasync import QEventLoop


class MainWindow(WindowBase):
    """Main application window for RSI Monitor"""
    
    def __init__(self):
        self.isMicaEnabled = False
        super().__init__()

    def closeEvent(self, event: QCloseEvent) -> None:
        """Handle window close event with confirmation dialog and synchronous cleanup"""
        quit_msg = QCoreApplication.translate(
            "MainWindow", 
            "To close window click button OK", 
            None
        )
        msg_box = MessageBox("Quit Application?", quit_msg, self.window())
        response = msg_box.exec()

        if response:
            # 1. Cleanup async tasks and connections
            self.cleanup_all_resources()

            # 2. Call parent's close_window if exists
            if hasattr(self, 'close_window'):
                try:
                    asyncio.run(self.close_window())
                except Exception as e:
                    print(f"Error during close_window cleanup: {e}")

            # 3. Shutdown thread pools
            self.shutdown_thread_pools()

            # 4. Close event loop
            self.close_event_loop()

            # 5. Accept close event
            event.accept()

            # 6. Force quit application
            QApplication.quit()
        else:
            event.ignore()

    def cleanup_all_resources(self):
        """Cleanup all resources before closing"""
        # Cancel all running async tasks
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # Cancel all pending tasks
                pending = asyncio.all_tasks(loop)
                for task in pending:
                    task.cancel()

                # Wait for tasks to complete cancellation
                if pending:
                    loop.run_until_complete(asyncio.gather(*pending, return_exceptions=True))
        except Exception as e:
            print(f"Error cancelling async tasks: {e}")

    def shutdown_thread_pools(self):
        """Shutdown all thread pools"""
        # Add your thread pool shutdown code here
        # Example:
        # if hasattr(self, 'thread_pool'):
        #     self.thread_pool.shutdown(wait=True)
        pass

    def close_event_loop(self):
        """Close asyncio event loop"""
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                loop.stop()
            if not loop.is_closed():
                loop.close()
        except Exception as e:
            print(f"Error closing event loop: {e}")

def setup_application_info():
    """Setup application information and metadata"""
    return {
        "version": "1.0.0",
        "name": "RSI Monitor"
    }


def configure_dpi_scaling():
    """Configure DPI scaling based on user settings"""
    dpi_scale = cfg.get(cfg.dpiScale)
    if dpi_scale != "Auto":
        os.environ["QT_ENABLE_HIGHDPI_SCALING"] = "0"
        os.environ["QT_SCALE_FACTOR"] = str(dpi_scale)


def create_application(app_info):
    """Create and configure Qt application"""
    app = QApplication(sys.argv + ['--no-sandbox'])
    app.setAttribute(Qt.AA_DontCreateNativeWidgetSiblings)
    app.setStyle("Fusion")
    app.setApplicationVersion(app_info["version"])
    app.setApplicationName(app_info["name"])
    app.setApplicationDisplayName(f"{app_info['name']} (v{app_info['version']})")
    return app


def create_main_window(app_info):
    """Create and configure main window"""
    window = MainWindow()
    window.setWindowTitle(app_info["name"])
    return window


def setup_async_event_loop():
    """Setup async event loop based on platform"""
    platform = sys.platform
    
    if platform in ("darwin", "linux"):
        try:
            import uvloop
            asyncio.set_event_loop_policy(uvloop.EventLoopPolicy())
        except ImportError:
            pass
    else:
        # Windows specific setup
        try:
            import winloop
            winloop.install()
        except ImportError:
            asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())


def main():
    """Main application entry point"""
    app_info = setup_application_info()
    configure_dpi_scaling()
    setTheme(Theme.DARK, True, True)
    app = create_application(app_info)
    window = create_main_window(app_info)
    window.show()

    # Force exit when app closes
    app.aboutToQuit.connect(lambda: os._exit(0))
    
    sys.exit(app.exec())


if __name__ == '__main__':
    # Suppress warnings
    warnings.simplefilter(action='ignore', category=FutureWarning)
    
    # Setup multiprocessing
    multiprocessing.freeze_support()
    
    # Setup async event loop
    #setup_async_event_loop()
    
    # Run main application
    main()
    
    