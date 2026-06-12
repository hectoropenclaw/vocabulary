import { SynonymQuiz } from "@/components/SynonymQuiz";
import { NotificationToggle } from "@/components/NotificationToggle";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto px-4 py-6 gap-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Vocabulary</h1>
          <p className="text-xs text-gray-500">Synonym practice</p>
        </div>
        <span className="text-2xl">📚</span>
      </header>

      {/* Notification toggle */}
      <NotificationToggle />

      {/* Quiz */}
      <SynonymQuiz />
    </div>
  );
}
