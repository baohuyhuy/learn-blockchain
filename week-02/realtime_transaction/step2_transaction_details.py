"""
Step 2: HTTP client để lấy chi tiết giao dịch từ signature
"""
import asyncio
import aiohttp
import time
from datetime import datetime, timezone
from typing import Optional, Dict, List, Any

from data_structures import TransactionDetails

class SolanaTransactionDetailsFetcher:
    """
    Step 2: HTTP client để lấy chi tiết giao dịch từ signature
    """
    
    # Tạo một dictionary để lưu các endpoint RPC cho từng mạng
    def __init__(self, network="devnet"):
        self.network_endpoints = {
            "testnet": "https://api.testnet.solana.com",
            "mainnet": "https://api.mainnet-beta.solana.com",
            "devnet": "https://api.devnet.solana.com",
            "local": "http://localhost:8899"
        }
        
        if network not in self.network_endpoints:
            raise ValueError(f"Network phải là: {list(self.network_endpoints.keys())}")
        
        self.network = network
        self.rpc_url = self.network_endpoints[network]
        
        # các thông số cấu hình
        self.request_timeout = 30 # thời gian (tính bằng giây) timeout cho mỗi request
        self.max_retries = 3 # số lần thử lại nếu gặp lỗi
        self.rate_limit_delay = 0.1 # thời gian (tính bằng giây) delay giữa các request để tránh rate limit
        self.last_request_time = 0 # thời điểm của request cuối cùng
        
        # các biến để theo dõi thống kê
        self.request_counter = 0 # đếm số lượng request đã gửi
        self.successful_requests = 0 # đếm số lượng request thành công
        self.failed_requests = 0 # đếm số lượng request thất bại
        
        print(f"STEP 2: TRANSACTION DETAILS FETCHER INITIALIZED")
        print(f"→ Network: {network}")
        print(f"→ RPC URL: {self.rpc_url}")
    
    # Phương thức riêng để áp dụng rate limiting
    async def _apply_rate_limiting(self):
        """
        Áp dụng rate limiting
        """
        current_time = time.time()
        time_since_last = current_time - self.last_request_time
        
        if time_since_last < self.rate_limit_delay:
            sleep_time = self.rate_limit_delay - time_since_last
            await asyncio.sleep(sleep_time)
        
        self.last_request_time = time.time()
    
    # Phương thức riêng để xây dựng JSON-RPC request cho getTransaction
    def _build_get_transaction_request(self, signature: str) -> Dict[str, Any]:
        """
        Xây dựng JSON-RPC request cho getTransaction
        """
        self.request_counter += 1
        
        return {
            "jsonrpc": "2.0",
            "id": self.request_counter,
            "method": "getTransaction",
            "params": [
                signature,
                {
                    "encoding": "json",
                    "maxSupportedTransactionVersion": 0,
                    "commitment": "finalized"
                }
            ]
        }
    
    # Phương thức chính để thực hiện HTTP request đến Solana RPC
    async def _make_http_request(self, signature: str, attempt: int = 1) -> Optional[Dict[str, Any]]:
        """
        Core method: Thực hiện HTTP request đến Solana RPC
        """
        print(f"\nHTTP REQUEST - Attempt {attempt}/{self.max_retries + 1}")
        print("-" * 40)
        print(f"Signature: {signature}")
        
        # Apply rate limiting
        await self._apply_rate_limiting()
        
        # Build request
        request_data = self._build_get_transaction_request(signature)
        
        start_time = time.time()
        
        try:
            timeout = aiohttp.ClientTimeout(total=self.request_timeout)
            
            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.post(
                    self.rpc_url,
                    json=request_data,
                    headers={
                        "Content-Type": "application/json",
                        "User-Agent": "SolanaWalletMonitor/2.0"
                    }
                ) as response:
                    
                    response_time_ms = (time.time() - start_time) * 1000
                    
                    print(f"→ HTTP Status: {response.status}")
                    print(f"→ Response time: {response_time_ms:.2f}ms")
                    
                    if response.status == 200:
                        response_json = await response.json()
                        
                        if "error" in response_json:
                            error_info = response_json["error"]
                            error_code = error_info.get("code", "Unknown")
                            error_message = error_info.get("message", "Unknown error")
                            
                            print(f"RPC Error {error_code}: {error_message}")
                            
                            if error_code in [-32602, -32603] and attempt <= self.max_retries:
                                print(f"→ Retryable error, waiting 2s...")
                                await asyncio.sleep(2)
                                return await self._make_http_request(signature, attempt + 1)
                            
                            self.failed_requests += 1
                            return None
                        
                        result = response_json.get("result")
                        
                        if result is None:
                            print("Transaction không tìm thấy (có thể chưa finalized)")
                            
                            if attempt <= self.max_retries:
                                print(f"→ Retry sau 3 giây...")
                                await asyncio.sleep(3)
                                return await self._make_http_request(signature, attempt + 1)
                            
                            self.failed_requests += 1
                            return None
                        
                        print("Transaction data retrieved successfully!")
                        self.successful_requests += 1
                        return result
                    
                    elif response.status == 429:  # Too Many Requests
                        print("Rate limit hit!")
                        
                        if attempt <= self.max_retries:
                            wait_time = 5 * attempt
                            print(f"→ Waiting {wait_time}s before retry...")
                            await asyncio.sleep(wait_time)
                            return await self._make_http_request(signature, attempt + 1)
                        
                        print("Max retries exceeded for rate limiting")
                        self.failed_requests += 1
                        return None
                    
                    else:
                        print(f"HTTP Error {response.status}: {response.reason}")
                        self.failed_requests += 1
                        return None
                        
        except asyncio.TimeoutError:
            print(f"Request timeout sau {self.request_timeout}s")
            
            if attempt <= self.max_retries:
                print(f"Retry sau timeout...")
                return await self._make_http_request(signature, attempt + 1)
            
            self.failed_requests += 1
            return None
            
        except Exception as e:
            print(f"Network error: {str(e)}")
            
            if attempt <= self.max_retries:
                print(f"→ Retry sau network error...")
                await asyncio.sleep(1)
                return await self._make_http_request(signature, attempt + 1)
            
            self.failed_requests += 1
            return None
    
    # Phương thức riêng để parse dữ liệu giao dịch từ JSON response
    def _parse_transaction_data(self, tx_data: Dict[str, Any], signature: str) -> Optional[TransactionDetails]:
        """
        Parse raw transaction data thành structured format
        """
        print(f"\nPARSING TRANSACTION DATA")
        print("-" * 30)
        
        try:
            # Extract basic transaction info
            slot = tx_data.get("slot", 0)
            block_time = tx_data.get("blockTime")
            
            # Transaction message và account keys
            transaction = tx_data.get("transaction", {})
            message = transaction.get("message", {})
            account_keys = message.get("accountKeys", [])
            instructions = message.get("instructions", [])
            
            # Transaction metadata
            meta = tx_data.get("meta", {})
            fee = meta.get("fee", 0)
            pre_balances = meta.get("preBalances", [])
            post_balances = meta.get("postBalances", [])
            err = meta.get("err")
            
            # Convert timestamp
            if block_time:
                dt = datetime.fromtimestamp(block_time, tz=timezone.utc)
                timestamp_str = dt.strftime("%Y-%m-%d %H:%M:%S UTC")
            else:
                timestamp_str = "Unknown"
            
            # Determine transaction status
            status = "SUCCESS" if err is None else "FAILED"
            
            # Calculate balance changes
            balance_changes = []
            sol_transfer_amount = 0.0
            from_account = None
            to_account = None
            
            for i, account in enumerate(account_keys):
                if i < len(pre_balances) and i < len(post_balances):
                    pre_balance = pre_balances[i] / 1e9
                    post_balance = post_balances[i] / 1e9
                    change = post_balance - pre_balance
                    
                    balance_changes.append({
                        "account": account,
                        "pre_balance": pre_balance,
                        "post_balance": post_balance,
                        "change": change
                    })
                    
                    # Identify sender and receiver
                    if change < -0.000001:  # Significant negative change = sender
                        from_account = account
                        sol_transfer_amount = abs(change) - (fee / 1e9)
                    elif change > 0.000001:  # Significant positive change = receiver
                        to_account = account
            
            # Xác định loại giao dịch và chương trình liên quan
            program_ids = []
            transaction_type = "UNKNOWN"
            
            system_program = "11111111111111111111111111111111"
            token_program = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
            
            if system_program in account_keys:
                program_ids.append(system_program)
                if sol_transfer_amount > 0:
                    transaction_type = "SOL_TRANSFER"
                else:
                    transaction_type = "SYSTEM_OPERATION"
            
            if token_program in account_keys:
                program_ids.append(token_program)
                transaction_type = "TOKEN_TRANSFER"
            
            if not program_ids:
                transaction_type = "CONTRACT_CALL"
            
            # Create TransactionDetails object
            details = TransactionDetails(
                signature=signature,
                timestamp=timestamp_str,
                slot=slot,
                fee_sol=fee / 1e9,
                status=status,
                account_keys=account_keys,
                from_account=from_account,
                to_account=to_account,
                sol_transfer_amount=sol_transfer_amount,
                balance_changes=balance_changes,
                transaction_type=transaction_type,
                program_ids=program_ids,
                raw_transaction_data=tx_data
            )
            
            # Print parsed summary
            print("Transaction parsed successfully!")
            print(f"Type: {transaction_type}")
            print(f"Status: {status}")
            print(f"Fee: {fee / 1e9:.9f} SOL")
            if from_account and to_account and sol_transfer_amount > 0:
                print(f"Transfer: {sol_transfer_amount:.9f} SOL")
                print(f"From: {from_account[:20]}...")
                print(f"To: {to_account[:20]}...")
            
            return details
            
        except Exception as e:
            print(f"Error parsing transaction: {e}")
            return None
    
    async def get_transaction_details(self, signature: str) -> Optional[TransactionDetails]:
        """
        Main method: Lấy và parse chi tiết transaction từ signature
        """
        print(f"\nSTEP 2: LẤY CHI TIẾT GIAO DỊCH TỪ SIGNATURE")
        print("=" * 50)
        print(f"Input signature: {signature}")
        
        # Make HTTP request to get raw data
        raw_data = await self._make_http_request(signature)
        
        if raw_data is None:
            print("Failed to fetch transaction data")
            return None
        
        # Parse raw data into structured format
        parsed_details = self._parse_transaction_data(raw_data, signature)
        
        if parsed_details is None:
            print("Failed to parse transaction data")
            return None
        
        print("Step 2 completed successfully!")
        return parsed_details
    
    def print_statistics(self):
        """
        In thống kê về performance
        """
        total_requests = self.successful_requests + self.failed_requests
        success_rate = (self.successful_requests / total_requests * 100) if total_requests > 0 else 0
        
        print(f"\nTRANSACTION FETCHER STATISTICS")
        print("=" * 35)
        print(f"Total requests: {total_requests}")
        print(f"Successful: {self.successful_requests}")
        print(f"Failed: {self.failed_requests}")
        print(f"Success rate: {success_rate:.1f}%")
        print(f"Network: {self.network}")
