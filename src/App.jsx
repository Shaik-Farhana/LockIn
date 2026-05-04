import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import StarryBg from './components/StarryBg'
import TopNav from './components/TopNav'
import Home from './pages/Home'
import TopicPicker from './pages/TopicPicker'
import StudyMode from './pages/StudyMode'
import SpeakMode from './pages/SpeakMode'
import SessionComplete from './pages/SessionComplete'
import Progress from './pages/Progress'

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="relative min-h-screen">
          <StarryBg />
          <TopNav />
          <main className="relative z-10">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/topics" element={<TopicPicker />} />
              <Route path="/study" element={<StudyMode />} />
              <Route path="/speak" element={<SpeakMode />} />
              <Route path="/session-complete" element={<SessionComplete />} />
              <Route path="/progress" element={<Progress />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AppProvider>
  )
}
