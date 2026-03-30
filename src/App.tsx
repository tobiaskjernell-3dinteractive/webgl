import UnityWindow from "./components/UnityWindow"
import MemoryMonitor from "./components/MemoryMonitor/MemoryMonitor"

function App() {

  return (
    <>
      <div className="min-h-screen w-screen bg-gray-600 flex flex-col items-center justify-center">
        <UnityWindow />
        <MemoryMonitor />
      </div>
    </>
  )
}

export default App
