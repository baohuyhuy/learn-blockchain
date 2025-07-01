import React, { useEffect, useRef, useState } from 'react';

const Header = () => {
    const navBarRef = useRef<HTMLElement>(null);
    const [prevPos, setPrevPos] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            if (!navBarRef.current) return; // Check if the ref is set
            
            const currentPos = window.scrollY;
            if (currentPos > prevPos) {
                navBarRef.current.style.transform = 'translateY(-150%)'; // Hide the navbar
            } else {
                navBarRef.current.style.transform = 'translateY(0)'; // Show the navbar
            }
            setPrevPos(currentPos);
        };

        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [prevPos]);

    return (
        <nav className='w-[95%] h-[70px] bg-[#30323b75] backdrop-blur-sm flex justify-between items-center px-8 py-4 sticky top-4 mx-auto border border-1 border-zinc-600 rounded-lg z-50 transition duration-250 ease-in-out' ref={navBarRef}>
            <div className='text-2xl font-bold text-white'>
                Crypto
            </div>
            <ul className='flex space-x-10'>
                <li className='text-white hover:underline cursor-pointer'>Home</li>
                <li className='text-white hover:underline cursor-pointer'>About</li>
                <li className='text-white hover:underline cursor-pointer'>Contact</li>
            </ul>
        </nav>
    )
}

export default Header