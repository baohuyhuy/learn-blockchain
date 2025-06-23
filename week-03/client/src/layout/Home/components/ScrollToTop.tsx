import { useEffect, useRef } from 'react';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';

const ScrollToTop = () => {
    const buttonRef = useRef<HTMLDivElement>(null);
    const handleScroll = () => {
        if (buttonRef.current) {
            buttonRef.current.style.transform = window.scrollY > 300 ? 'translateY(0)' : 'translateY(50%)';
            buttonRef.current.style.opacity = window.scrollY > 300 ? '1' : '0';
        }
    };
    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);
    useEffect(() => {
        handleScroll(); // Initial check on mount
    }, []);

    return (
        <div className="fixed bottom-6 right-6 z-10" ref={buttonRef} style={{ transform: 'translateY(50%)', opacity: 0, transition: 'transform 0.3s ease, opacity 0.3s ease' }}>
            <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="bg-zinc-400 h-14 w-14 text-black p-2 rounded-full shadow-lg hover:bg-zinc-200 transition-colors duration-300 ease"
            >
                <ArrowUpwardIcon className="text-3xl" />
            </button>
        </div>
    )
}

export default ScrollToTop