import { Layout } from "@/components/Layout"
import { SessionsSidebar } from "@/components/SessionsSidebar"
import { SessionView } from "@/components/SessionView"

function App() {
  return (
    <Layout sidebar={<SessionsSidebar />}>
      <SessionView />
    </Layout>
  )
}

export default App 