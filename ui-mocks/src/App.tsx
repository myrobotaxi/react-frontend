import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout.tsx';
import { SignIn } from './pages/SignIn.tsx';
import { SignUp } from './pages/SignUp.tsx';
import { Home } from './pages/Home.tsx';
import { HomeEmpty } from './pages/HomeEmpty.tsx';
import { DriveHistory } from './pages/DriveHistory.tsx';
import { DriveSummary } from './pages/DriveSummary.tsx';
import { Invites } from './pages/Invites.tsx';
import { Settings } from './pages/Settings.tsx';
import { SharedViewer } from './pages/SharedViewer.tsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          {/* Auth screens — no bottom nav */}
          <Route path="/" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Main app screens — bottom nav visible */}
          <Route path="/home" element={<Home />} />
          <Route path="/home/empty" element={<HomeEmpty />} />
          <Route path="/drives" element={<DriveHistory />} />
          <Route path="/drives/:driveId" element={<DriveSummary />} />
          <Route path="/invites" element={<Invites />} />
          <Route path="/settings" element={<Settings />} />

          {/* Anonymous viewer — no bottom nav */}
          <Route path="/shared/:token" element={<SharedViewer />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
