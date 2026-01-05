import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { Link } from "react-router-dom";
import { MessageSquare, ArrowRight, Sparkles } from "lucide-react";
import { db } from "../firebase";

export default function Home() {
  const [topics, setTopics] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const topicsRef = ref(db, "topics");

    const unsubscribe = onValue(
      topicsRef,
      (snapshot) => {
        const data = snapshot.val();
        setTopics(data ?? {});
        setLoading(false);
      },
      (error) => {
        console.error("Firebase error:", error);
        setLoading(false);
      }
    );

    onValue(ref(db, "topics"), (snap) => {
      console.log("Firebase data:", snap.val());
    });

    // cleanup important (React 18 / StrictMode)
    return () => unsubscribe();
  }, []);

  const topicsArray = Object.entries(topics);

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-blue-900/30 bg-black/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Topics</h1>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        {loading ? (
          <div className="text-center py-20 text-gray-500">
            Chargement des topics...
          </div>
        ) : topicsArray.length === 0 ? (
          <div className="text-center py-20">
            <MessageSquare className="w-16 h-16 text-blue-500/30 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              Aucun topic disponible pour le moment
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topicsArray.map(([id, topic]) => (
              <Link
                key={id}
                to={`/topic/${id}`}
                className="group relative bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-blue-600 transition-all duration-300 hover:shadow-lg hover:shadow-blue-600/20"
              >
                {/* Icon */}
                <div className="w-12 h-12 bg-blue-600/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-600/20 transition-colors">
                  <MessageSquare className="w-6 h-6 text-blue-500" />
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
                  {topic.title ?? "Sans titre"}
                </h3>

                {/* Description */}
                {topic.description && (
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {topic.description}
                  </p>
                )}

                {/* Arrow */}
                <div className="flex items-center text-blue-500 text-sm font-medium">
                  <span className="group-hover:mr-2 transition-all">
                    Voir le topic
                  </span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 rounded-xl bg-blue-600/0 group-hover:bg-blue-600/5 transition-colors pointer-events-none" />
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
