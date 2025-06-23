import { useState } from 'react';
import ArrowRightOutlinedIcon from '@mui/icons-material/ArrowRightOutlined';
import PauseOutlinedIcon from '@mui/icons-material/PauseOutlined';

interface InputProps {
    onStartMonitoring: (tokens: string[]) => void;
    onStopMonitoring: () => void;
}

const Input = ({ onStartMonitoring, onStopMonitoring }: InputProps) => {
    const [text, setText] = useState('');
    const [isMonitoring, setIsMonitoring] = useState(false);

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setText(e.target.value);
    };

    const toggleMonitoring = () => {
        if (isMonitoring) {
            onStopMonitoring();
        } else {
            const tokens = text
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0);

            if (tokens.length === 0) {
                alert('Please enter token mint addresses (one per line)');
                return;
            }
            onStartMonitoring(tokens);
        }
        setIsMonitoring(!isMonitoring);
    };

    return (
        <div className="flex flex-col gap-4 mb-20">
            <textarea
                className="p-2 rounded-md min-h-[150px] min-w-[50vw] bg-zinc-900 text-white border border-zinc-700 opacity-75"
                value={text}
                onChange={handleTextChange}
                placeholder="Enter token mint addresses (one per line)..."
                disabled={isMonitoring}
            />
            
            <div className="flex items-center gap-2 ml-auto mr-0">
                <button
                    onClick={toggleMonitoring}
                    className={`px-4 py-2 rounded-md cursor-pointer flex items-center gap-2 ${
                        isMonitoring 
                            ? 'bg-zinc-800' 
                            : 'bg-zinc-200'
                    } text-white transition-colors`}
                >
                    {isMonitoring ? (
                        <PauseOutlinedIcon style={{ color: 'white' }} />
                    ) : (
                        <ArrowRightOutlinedIcon style={{ color: 'black' }} />
                    )}
                    <span style={{ color: isMonitoring ? 'white' : 'black', pointerEvents: 'none' }}>
                        {isMonitoring ? 'Stop monitoring' : 'Start monitoring'}
                    </span>
                </button>
            </div>
        </div>
    );
};

export default Input;