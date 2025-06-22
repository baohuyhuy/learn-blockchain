import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./layout/Header/Header";
import Home from "./layout/Home/Home";
import Monitor from "./layout/Monitor/Monitor";
import './style.css';

function App() {
  return (
	<Router>
		<div className="relative bg-black overflow-hidden">
			<div className="absolute top-25 -translate-y-1/2 left-1/2 -translate-x-1/2 w-[120%] aspect-square 
                bg-[radial-gradient(circle,rgba(255,255,255,0.15)_0%,transparent_80%)] z-10" style={{ pointerEvents: 'none' }} 
            />
			<Header />
			<Routes>
				<Route path="/" element={<Home />} />
				<Route path="/monitor" element={<Monitor />} />
			</Routes>
		</div>

	</Router>
  );
}

export default App;