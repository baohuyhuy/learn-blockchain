"""
Data structures for Solana transaction monitoring
"""
from dataclasses import dataclass
from typing import Optional, Dict, List, Any

@dataclass 
class TransactionDetails:
    """
    Structured data class để chứa thông tin giao dịch đã parse
    """
    signature: str # signature của giao dịch lấy từ logs
    timestamp: str # thời gian giao dịch (UTC)
    slot: int # slot của giao dịch 
    fee_sol: float # phí giao dịch tính bằng SOL
    status: str  # "SUCCESS" hoặc "FAILED" cho biết trạng thái giao dịch
    
    # thông tin ví và tài khoản liên quan
    account_keys: List[str] # danh sách các account keys liên quan đến giao dịch
    from_account: Optional[str] # ví gửi tiền (nếu có) 
    to_account: Optional[str] # ví nhận tiền (nếu có)
    
    # Thông tin chuyển SOL
    # nếu giao dịch là chuyển SOL, sẽ có thông tin này
    sol_transfer_amount: float # số lượng SOL được chuyển (nếu có)
    balance_changes: List[Dict[str, Any]] # danh sách các thay đổi số dư của các tài khoản liên quan
    
    # Loại giao dịch và các chương trình liên quan
    transaction_type: str  # "SOL_TRANSFER", "TOKEN_TRANSFER", "CONTRACT_CALL" 
    program_ids: List[str] # danh sách các chương trình được gọi trong giao dịch
    
    # Thông tin về dữ liệu giao dịch gốc
    raw_transaction_data: Dict[str, Any]