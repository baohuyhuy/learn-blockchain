import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./layout/Header/Header";
import Home from "./layout/Home/Home";
import './style.css';

function App() {
  return (
	<Router>
		<Header />

		<div className="relative bg-black overflow-hidden -top-20">
			<div className="absolute top-40 -translate-y-1/2 left-1/2 -translate-x-1/2 w-[150%] h-[150%]
                bg-[radial-gradient(closest-side,rgba(255,255,255,0.5)_0%,transparent_80%)] z-10" style={{ pointerEvents: 'none' }} 
            />
			{/* <div className="absolute top-10 -translate-y-1/2 left-1/2 -translate-x-1/2 w-[80%] h-[80%]
                bg-[radial-gradient(closest-side,rgba(255,255,255,0.5)_0%,transparent_80%)] z-10" style={{ pointerEvents: 'none' }} 
            /> */}
			<Routes>
				<Route path="/" element={<Home />} />
			</Routes>
		</div>

	</Router>
  );
}

export default App;