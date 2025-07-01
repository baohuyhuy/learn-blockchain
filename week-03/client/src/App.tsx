import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header/Header";
import Home from "./pages/TokenPriceMonitor/Home";
import './style.css';

function App() {
  return (
	<Router>
		<Header />

		<div className="relative bg-black overflow-hidden -top-20">
			<Routes>
				<Route path="/" element={<Home />} />
			</Routes>
		</div>

	</Router>
  );
}

export default App;