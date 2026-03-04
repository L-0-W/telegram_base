import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Register from './pages/Register';

function App() {
    return (
        <Router>
            <div className="min-h-screen bg-[#09090b] text-foreground antialiased selection:bg-primary/30">
                <Routes>
                    <Route path="/register" element={<Register />} />
                    <Route path="/" element={<Navigate to="/register" replace />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
