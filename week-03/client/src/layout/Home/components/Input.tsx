import { useState } from 'react';
import ArrowRightOutlinedIcon from '@mui/icons-material/ArrowRightOutlined';
import PauseOutlinedIcon from '@mui/icons-material/PauseOutlined';

const Input = () => {
    const [text, setText] = useState('');
    const [isMonitoring, setIsMonitoring] = useState(false);

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setText(e.target.value);
    };

    const toggleMonitoring = () => {
        setIsMonitoring(!isMonitoring);
    };

    return (
        <div className="flex flex-col gap-4 mb-20">
            <textarea
                className="p-2 rounded-md min-h-[150px] w-[50vw] bg-zinc-900 text-white border border-zinc-700 opacity-75"
                value={text}
                onChange={handleTextChange}
                placeholder="Enter text to monitor..."
            />
            
            <div className="flex items-center gap-2 ml-auto mr-0">
                <button
                    onClick={toggleMonitoring}
                    className={`px-4 py-2 rounded-md cursor-pointer ${
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
    )
}

export default Input