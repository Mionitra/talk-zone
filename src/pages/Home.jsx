import { useEffect, useState } from "react";
import { ref, onValue, push, set } from "firebase/database";
import { Link } from "react-router-dom";
import { MessageSquare, ArrowRight, Eye, Loader2 } from "lucide-react";
import { db } from "../firebase";

export default function Home() {
  const [topics, setTopics] = useState({});
  const [loading, setLoading] = useState(true);
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [newTopicDescription, setNewTopicDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showView, setShowView] = useState("view");
  const [error, setError] = useState("");

  useEffect(() => {
    const topicsRef = ref(db, "topics");
    const unsubscribe = onValue(
      topicsRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const publishedTopics = {};
          Object.entries(data).forEach(([id, topic]) => {
            if (topic.status === "published") {
              publishedTopics[id] = topic;
            }
          });
          setTopics(publishedTopics);
        } else {
          setTopics({});
        }
        setLoading(false);
      },
      (error) => {
        console.error("Erreur de lecture Firebase:", error);
        setError("Erreur de chargement des topics");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleSubmitTopic = async (e) => {
    e.preventDefault();
    
    if (!newTopicTitle.trim()) {
      setError("Le titre est obligatoire");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const topicsRef = ref(db, "topics");
      const newTopicRef = push(topicsRef);
      
      const topicData = {
        title: newTopicTitle.trim(),
        description: newTopicDescription.trim() || "",
        status: "pending",
        createdAt: Date.now(),
        category: "Général"
      };

      await set(newTopicRef, topicData);

      // Réinitialiser le formulaire
      setNewTopicTitle("");
      setNewTopicDescription("");
      setShowSuccess(true);
      setShowView("view");

      // Masquer le message de succès après 5 secondes
      setTimeout(() => setShowSuccess(false), 5000);
    } catch (error) {
      console.error("Erreur lors de la soumission:", error);
      setError(`Erreur: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const topicsArray = Object.entries(topics).sort(
    ([, a], [, b]) => (b.createdAt || 0) - (a.createdAt || 0)
  );

  return (
    <div className="min-h-screen bg-black">
      <header className="border-b border-blue-900/30 bg-black/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">TalkZone</h1>
              <p className="text-sm text-gray-500">Partagez vos idées avec la communauté</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Switch entre les vues */}
        <div className="flex gap-3 mb-8 bg-gray-900 border border-gray-800 rounded-xl p-2">
          <button
            onClick={() => setShowView("add")}
            className={`flex-1 py-3 rounded-lg font-medium transition-all ${
              showView === "add"
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            Proposer un topic
          </button>
          <button
            onClick={() => setShowView("view")}
            className={`flex-1 py-3 rounded-lg font-medium transition-all ${
              showView === "view"
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Eye className="w-4 h-4" />
              Voir les topics
            </div>
          </button>
        </div>

        {/* Message de succès */}
        {showSuccess && (
          <div className="mb-6 bg-green-600/10 border border-green-600/30 rounded-xl p-4">
            <p className="text-green-400 text-center font-medium">
              ✅ Votre topic a été soumis avec succès ! Il sera publié après validation par un admin.
            </p>
          </div>
        )}

        {/* Message d'erreur */}
        {error && (
          <div className="mb-6 bg-red-600/10 border border-red-600/30 rounded-xl p-4">
            <p className="text-red-400 text-center font-medium">
              ❌ {error}
            </p>
          </div>
        )}

        {/* Vue d'ajout de topic */}
        {showView === "add" && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">
                Proposer un nouveau topic
              </h2>

              <form onSubmit={handleSubmitTopic} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Titre du topic *
                  </label>
                  <input
                    type="text"
                    value={newTopicTitle}
                    onChange={(e) => setNewTopicTitle(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Les meilleures pratiques en React"
                    maxLength={100}
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Description (optionnelle)
                  </label>
                  <textarea
                    value={newTopicDescription}
                    onChange={(e) => setNewTopicDescription(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[120px] resize-none"
                    placeholder="Décrivez brièvement le sujet de discussion..."
                    maxLength={300}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="bg-blue-900/10 border border-blue-800/20 rounded-lg p-4">
                  <p className="text-blue-400 text-sm text-center">
                    ℹ️ Votre topic sera vérifié par un administrateur avant d'être publié
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !newTopicTitle.trim()}
                  className={`w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                    isSubmitting || !newTopicTitle.trim()
                      ? "bg-gray-800 text-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Soumission en cours...
                    </>
                  ) : (
                    "Soumettre le topic"
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Vue des topics publiés */}
        {showView === "view" && (
          <div>
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-white mb-2">
                Topics publiés
              </h2>
              <p className="text-gray-400">
                {topicsArray.length} topic{topicsArray.length !== 1 ? "s" : ""} disponible
                {topicsArray.length !== 1 ? "s" : ""}
              </p>
            </div>

            {loading ? (
              <div className="text-center py-20">
                <Loader2 className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
                <p className="text-gray-500 text-lg">Chargement des topics...</p>
              </div>
            ) : topicsArray.length === 0 ? (
              <div className="text-center py-20">
                <MessageSquare className="w-16 h-16 text-blue-500/30 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-4">
                  Aucun topic publié pour le moment
                </p>
                <button
                  onClick={() => setShowView("add")}
                  className="text-blue-500 hover:text-blue-400 font-medium"
                >
                  Proposer le premier topic →
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {topicsArray.map(([id, topic]) => (
                  <Link
                    key={id}
                    to={`/topic/${id}`}
                    className="group relative bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-blue-600 transition-all duration-300 hover:shadow-lg hover:shadow-blue-600/20"
                  >
                    <div className="w-12 h-12 bg-blue-600/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-600/20 transition-colors">
                      <MessageSquare className="w-6 h-6 text-blue-500" />
                    </div>

                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors line-clamp-2">
                      {topic.title || "Sans titre"}
                    </h3>

                    {topic.description && (
                      <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                        {topic.description}
                      </p>
                    )}

                    <div className="flex items-center text-blue-500 text-sm font-medium">
                      <span className="group-hover:mr-2 transition-all">
                        Voir le topic
                      </span>
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    <div className="absolute inset-0 rounded-xl bg-blue-600/0 group-hover:bg-blue-600/5 transition-colors pointer-events-none" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}