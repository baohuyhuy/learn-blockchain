# Hệ Thống Giám Sát Giao Dịch Solana

Hệ thống giám sát giao dịch real-time cho blockchain Solana, được phát triển bằng Python.

## Cấu Trúc Dự Án

```
├── data_structures.py          # Cấu trúc dữ liệu cho giao dịch
├── step1_websocket_logs.py     # Sử dụng WebSocket của Solana để nhận logs
├── step2_transaction_details.py # Lấy chi tiết giao dịch qua HTTP RPC (API của Solana)
├── wallet_monitor.py           # Kết hợp WebSocket và HTTP để giám sát ví
├── main.py                     # Hàm chính để chạy ứng dụng
├── requirements.txt            # Các thư viện Python cần thiết
├── README.md                  
```

## Các Thành Phần

### 1. `data_structures.py`
- Chứa dataclass `TransactionDetails`
- Định dạng có cấu trúc cho dữ liệu giao dịch đã được parse

### 2. `step1_websocket_logs.py`
- Lớp `SolanaLogsSubscriber`
- WebSocket client để nhận logs Solana real-time
- Xử lý subscription cho logs của ví cụ thể hoặc tất cả logs

### 3. `step2_transaction_details.py`
- Lớp `SolanaTransactionDetailsFetcher`  
- HTTP client để lấy thông tin chi tiết giao dịch
- Parse dữ liệu giao dịch thô thành định dạng có cấu trúc

### 4. `wallet_monitor.py`
- Lớp `SolanaWalletMonitor`
- Kết hợp WebSocket logs + HTTP details fetching
- Chức năng giám sát chính

### 5. `main.py`
- Điểm khởi chạy ứng dụng
- Các hàm demo và giao diện người dùng
- Lựa chọn network và cấu hình

## Sơ Đồ Luồng Chi Tiết

### 🔄 **Workflow Tổng Quan**

```
┌─────────────────────────────────────────────────────────────────┐
│                    SOLANA WALLET MONITOR                        │
│                     (wallet_monitor.py)                         │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
        ┌───────────────────────────────────────────────────────┐
        │              KHỞI TẠO HỆ THỐNG                        │
        │  • Chọn network (devnet/testnet/mainnet)              │
        │  • Khởi tạo WebSocket Subscriber (Step 1)             │
        │  • Khởi tạo Transaction Fetcher (Step 2)              │
        └───────────────────────────────────────────────────────┘
                                │
                                ▼
        ┌───────────────────────────────────────────────────────┐
        │                 BẮt ĐẦU GIÁM SÁT                      │
        │  • Kết nối WebSocket tới Solana RPC                   │
        │  • Đăng ký logs cho wallet cụ thể                     │
        │  • Bắt đầu vòng lặp chờ transaction                   │
        └───────────────────────────────────────────────────────┘
                                │
                                ▼
                    ┌─────────────────────┐
                    │   CHỜ TRANSACTION   │
                    │   (WebSocket Logs)  │
                    └─────────────────────┘
                                │
                                ▼
        ┌───────────────────────────────────────────────────────┐
        │              NHẬN ĐƯỢC TRANSACTION                    │
        │  WebSocket nhận được log chứa signature               │
        └───────────────────────────────────────────────────────┘
                                │
                                ▼
        ┌───────────────────────────────────────────────────────┐
        │            TRÍCH XUẤT SIGNATURE                       │
        │  • Parse log message                                  │
        │  • Lấy transaction signature                          │
        │  • Validate signature format                          │
        └───────────────────────────────────────────────────────┘
                                │
                                ▼
        ┌───────────────────────────────────────────────────────┐
        │         LẤY CHI TIẾT TRANSACTION (HTTP)               │
        │  • Gọi getTransaction API                             │
        │  • Retry logic với rate limiting                      │
        │  • Xử lý timeout và error                             │
        └───────────────────────────────────────────────────────┘
                                │
                                ▼
        ┌───────────────────────────────────────────────────────┐
        │              PARSE DỮ LIỆU                            │
        │  • Tính toán balance changes                          │
        │  • Xác định sender/receiver                           │
        │  • Phân loại transaction type                         │
        │  • Tạo TransactionDetails object                      │
        └───────────────────────────────────────────────────────┘
                                │
                                ▼
        ┌───────────────────────────────────────────────────────┐
        │            HIỂN THỊ THÔNG TIN                         │
        │  • Format và in transaction details                   │
        │  • Cập nhật thống kê                                  │
        └───────────────────────────────────────────────────────┘
                                │
                                ▼
                    ┌─────────────────────┐
                    │  ĐẠT MAX TX?        │
                    │     (Kiểm tra)      │
                    └─────────────────────┘
                           │         │
                         Chưa      Rồi
                           │         │
                           ▼         ▼
            ┌─────────────────────┐  ┌──────────────────┐
            │   TIẾP TỤC GIÁM SÁT │  │  KẾT THÚC VÀ     │
            │  (Quay lại chờ)     │  │ HIỂN THỊ THỐNG KÊ│
            └─────────────────────┘  └──────────────────┘
                     │                         │
                     └─────────────────────────┘
```

### **Chi Tiết Từng Bước**

#### Step 1: WebSocket Logs Subscriber** (`step1_websocket_logs.py`)
```
┌─────────────────────────────────────────────────────────────────┐
│                        WEBSOCKET LOGS                           │
├─────────────────────────────────────────────────────────────────┤
│ 1. Kết nối WebSocket tới Solana RPC                             │
│    ├── URL: wss://api.devnet.solana.com                         │
│    ├── Timeout: 30 giây                                         │
│    └── Auto reconnect on disconnect                             │
│                                                                 │
│ 2. Gửi logsSubscribe request                                    │
│    ├── Filter theo wallet address                               │
│    ├── Commitment level: "processed"                            │
│    └── Nhận subscription ID                                     │
│                                                                 │
│ 3. Lắng nghe logs real-time                                     │
│    ├── Parse JSON messages                                      │
│    ├── Extract signature từ logs                                │
│    └── Gửi signature tới Step 2                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Step 2: Transaction Details Fetcher** (`step2_transaction_details.py`)
```
┌─────────────────────────────────────────────────────────────────┐
│                   HTTP TRANSACTION FETCHER                      │
├─────────────────────────────────────────────────────────────────┤
│ 1. Rate Limiting & Request Management                           │
│    ├── Delay 0.1s giữa các request                              │
│    ├── Max 3 lần retry                                          │
│    └── Timeout 30s cho mỗi request                              │
│                                                                 │
│ 2. Build getTransaction Request                                 │
│    ├── Method: "getTransaction"                                 │
│    ├── Params: [signature, encoding, commitment]                │
│    └── Request ID tracking                                      │
│                                                                 │
│ 3. HTTP POST tới Solana RPC                                     │
│    ├── URL: https://api.devnet.solana.com                       │
│    ├── Headers: Content-Type, User-Agent                        │
│    └── JSON payload                                             │
│                                                                 │
│ 4. Error Handling                                               │
│    ├── HTTP 429 (Rate limit) → Retry với backoff                │
│    ├── RPC errors (-32602, -32603) → Retry                      │
│    ├── Network timeout → Retry                                  │
│    └── Transaction not found → Retry (chờ finalization)         │
│                                                                 │
│ 5. Parse Transaction Data                                       │
│    ├── Extract: slot, blockTime, fee, balances                  │
│    ├── Calculate balance changes                                │
│    ├── Identify sender/receiver                                 │
│    ├── Determine transaction type                               │
│    └── Create TransactionDetails object                         │
└─────────────────────────────────────────────────────────────────┘
```

### **Transaction Type Classification**

```
┌─────────────────────────────────────────────────────────────────┐
│                  PHÂN LOẠI TRANSACTION                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ System Program (11111...1111) trong account_keys?               │
│ ├── YES + SOL transfer > 0 → SOL_TRANSFER                       │
│ └── YES + SOL transfer = 0 → SYSTEM_OPERATION                   │
│                                                                 │
│ Token Program (TokenkegQf...) trong account_keys?               │
│ └── YES → TOKEN_TRANSFER                                        │
│                                                                 │
│ Không có program nào được nhận diện?                            │
│ └── CONTRACT_CALL                                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### **Data Structures Flow**

```
┌─────────────────────────────────────────────────────────────────┐
│                     DỮ LIỆU TRANSACTION                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Raw WebSocket Log → Signature String                            │
│         │                                                       │
│         ▼                                                       │
│ HTTP RPC Response → Raw Transaction JSON                        │
│         │                                                       │
│         ▼                                                       │
│ TransactionDetails Object:                                      │
│ ├── signature: str                                              │
│ ├── timestamp: str                                              │
│ ├── slot: int                                                   │
│ ├── fee_sol: float                                              │
│ ├── status: str (SUCCESS/FAILED)                                │
│ ├── account_keys: List[str]                                     │
│ ├── from_account: Optional[str]                                 │
│ ├── to_account: Optional[str]                                   │
│ ├── sol_transfer_amount: float                                  │
│ ├── balance_changes: List[Dict]                                 │
│ ├── transaction_type: str                                       │
│ ├── program_ids: List[str]                                      │
│ └── raw_transaction_data: Dict                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### **Performance & Error Handling**

```
┌─────────────────────────────────────────────────────────────────┐
│                   XỬ LÝ LỖI VÀ HIỆU SUẤT                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ WebSocket Errors:                                               │
│ ├── Connection lost → Auto reconnect                            │
│ ├── Invalid message → Skip và continue                          │
│ └── Subscription failed → Retry subscription                    │
│                                                                 │
│ HTTP Errors:                                                    │
│ ├── Rate limit (429) → Exponential backoff                      │
│ ├── Timeout → Retry với increased timeout                       │
│ ├── RPC error → Conditional retry                               │
│ └── Network error → Retry với delay                             │
│                                                                 │
│ Performance Tracking:                                           │
│ ├── Request counter                                             │
│ ├── Success/failure rates                                       │
│ ├── Response times                                              │
│ └── Statistics reporting                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Cài Đặt

```bash
pip install -r requirements.txt
```

## Cách Sử Dụng

### Chạy monitor chính:
```bash
python main.py
```

### Import các thành phần riêng lẻ:
```python
from wallet_monitor import SolanaWalletMonitor
from data_structures import TransactionDetails
```

## Tính Năng

- Giám sát giao dịch real-time thông qua WebSocket của Solana
- Parse chi tiết giao dịch thông qua HTTP RPC (API của Solana)
- Hỗ trợ Devnet, Testnet và Mainnet
- Logic retry tự động và rate limiting
- Phát hiện loại giao dịch (chuyển SOL, chuyển token, v.v.)
- Theo dõi thay đổi số dư
- Thống kê hiệu suất

## Hỗ Trợ Network

- **Devnet**: Mạng phát triển để thử nghiệm
- **Testnet**: Mạng thử nghiệm với test tokens  
- **Mainnet**: Mạng Solana production
