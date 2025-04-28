import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Suspense, lazy } from 'react';
import './App.css';

// Lazy load components for better performance
const Home = lazy(() => import('./pages/Home'));
const EditorPage = lazy(() => import('./pages/EditorPage'));

// Toast configuration
const toasterConfig = {
    position: "top-right",
    toastOptions: {
        success: {
            theme: {
                primary: '#4aed88',
            },
        },
    },
};

// Loading fallback component
const LoadingFallback = () => (
    <div className="loading-container">
        Loading...
    </div>
);

function App() {
    return (
        <>
            <Toaster {...toasterConfig} />
            
            <BrowserRouter>
                <Suspense fallback={<LoadingFallback />}>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/editor/:roomId" element={<EditorPage />} />
                    </Routes>
                </Suspense>
            </BrowserRouter>
        </>
    );
}

export default App;
