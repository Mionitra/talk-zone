import { ref, push, remove, onValue, update } from "firebase/database";
import { db, auth } from "../firebase";
import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { 
  LogOut, 
  Plus, 
  Trash2, 
  Edit2, 
  MessageSquare, 
  Shield,
  BarChart3,
  Clock,
  Users,
  X,
  Check,
  Loader2
} from "lucide-react";

export default function Admin() {
  const [topics, setTopics] = useState({});
  const [allComments, setAllComments] = useState({});
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("topics"); // "topics" ou "stats"

  useEffect(() => {
    onValue(ref(db, "topics"), snap => setTopics(snap.val() || {}));
    onValue(ref(db, "comments"), snap => setAllComments(snap.val() || {}));
  }, []);

  async function addTopic() {
    if (!title.trim()) return;
    setLoading(true);
    
    try {
      await push(ref(db, "topics"), { 
        title,
        description: description || "",
        category: category || "Général",
        createdAt: Date.now()
      });
      setTitle("");
      setDescription("");
      setCategory("");
    } catch (err) {
      console.error("Erreur lors de l'ajout:", err);
    } finally {
      setLoading(false);
    }
  }

  function startEdit(id, topic) {
    setEditingId(id);
    setEditTitle(topic.title);
    setEditDescription(topic.description || "");
    setEditCategory(topic.category || "");
  }

  async function saveEdit(id) {
    if (!editTitle.trim()) return;
    
    try {
      await update(ref(db, `topics/${id}`), {
        title: editTitle,
        description: editDescription,
        category: editCategory || "Général",
        updatedAt: Date.now()
      });
      setEditingId(null);
    } catch (err) {
      console.error("Erreur lors de la modification:", err);
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setEditTitle("");
    setEditDescription("");
    setEditCategory("");
  }

  async function deleteTopic(id) {
    if (!window.confirm("Supprimer ce topic et tous ses commentaires ?")) return;
    
    try {
      await remove(ref(db, `topics/${id}`));
      await remove(ref(db, `comments/${id}`));
    } catch (err) {
      console.error("Erreur lors de la suppression:", err);
    }
  }

  // Statistiques
  const topicsArray = Object.entries(topics);
  const totalTopics = topicsArray.length;
  const totalComments = Object.values(allComments).reduce((sum, topicComments) => {
    return sum + Object.keys(topicComments || {}).length;
  }, 0);

  const topicsWithCommentCount = topicsArray.map(([id, topic]) => ({
    id,
    ...topic,
    commentCount: Object.keys(allComments[id] || {}).length
  })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  function formatDate(timestamp) {
    if (!timestamp) return "Date inconnue";
    return new Date(timestamp).toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-blue-900/30 bg-black/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Administration</h1>
                <p className="text-sm text-gray-500">Gestion des topics et statistiques</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Vue selector */}
              <div className="flex bg-gray-900 border border-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setView("topics")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    view === "topics" 
                      ? "bg-blue-600 text-white" 
                      : "text-gray-400 hover:text-gray-300"
                  }`}
                >
                  Topics
                </button>
                <button
                  onClick={() => setView("stats")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    view === "stats" 
                      ? "bg-blue-600 text-white" 
                      : "text-gray-400 hover:text-gray-300"
                  }`}
                >
                  Statistiques
                </button>
              </div>

              <button
                onClick={() => signOut(auth)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-red-600/50 text-gray-300 hover:text-red-400 rounded-lg transition-all"
              >
                <LogOut className="w-4 h-4" />
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {view === "topics" ? (
          <>
            {/* Formulaire d'ajout */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-500" />
                Créer un nouveau topic
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Titre du topic *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Discussion sur React"
                    className="w-full bg-black border border-gray-800 rounded-lg px-4 py-3 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Décrivez brièvement le sujet..."
                    rows={3}
                    className="w-full bg-black border border-gray-800 rounded-lg px-4 py-3 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Catégorie
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Ex: Développement, Design..."
                    className="w-full bg-black border border-gray-800 rounded-lg px-4 py-3 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
                  />
                </div>

                <button
                  onClick={addTopic}
                  disabled={!title.trim() || loading}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 disabled:text-gray-600 text-white font-medium rounded-lg transition-all disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Création...
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      Créer le topic
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Liste des topics */}
            <div>
              <h2 className="text-lg font-semibold text-white mb-4">
                Topics existants ({totalTopics})
              </h2>

              {topicsWithCommentCount.length === 0 ? (
                <div className="text-center py-20 bg-gray-900/50 rounded-xl border border-gray-800">
                  <MessageSquare className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-500">Aucun topic créé</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {topicsWithCommentCount.map(({ id, title, description, category, commentCount, createdAt }) => (
                    <div
                      key={id}
                      className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-all"
                    >
                      {editingId === id ? (
                        // Mode édition
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full bg-black border border-gray-800 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                          />
                          <textarea
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            rows={2}
                            className="w-full bg-black border border-gray-800 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 resize-none"
                          />
                          <input
                            type="text"
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value)}
                            placeholder="Catégorie"
                            className="w-full bg-black border border-gray-800 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveEdit(id)}
                              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all"
                            >
                              <Check className="w-4 h-4" />
                              Enregistrer
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-medium transition-all"
                            >
                              <X className="w-4 h-4" />
                              Annuler
                            </button>
                          </div>
                        </div>
                      ) : (
                        // Mode affichage
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-white truncate">
                                {title}
                              </h3>
                              {category && (
                                <span className="px-2 py-1 bg-blue-600/10 text-blue-400 text-xs rounded-md whitespace-nowrap">
                                  {category}
                                </span>
                              )}
                            </div>
                            {description && (
                              <p className="text-gray-400 text-sm mb-3 line-clamp-2">{description}</p>
                            )}
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <MessageSquare className="w-4 h-4" />
                                <span>{commentCount} commentaire{commentCount !== 1 ? 's' : ''}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>{formatDate(createdAt)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => startEdit(id, { title, description, category })}
                              className="p-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-blue-600/50 text-gray-400 hover:text-blue-400 rounded-lg transition-all"
                              title="Modifier"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteTopic(id)}
                              className="p-2 bg-gray-800 hover:bg-red-600/20 border border-gray-700 hover:border-red-600/50 text-gray-400 hover:text-red-400 rounded-lg transition-all"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          // Vue Statistiques
          <div className="space-y-6">
            {/* Cartes statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-400 text-sm">Total Topics</span>
                  <MessageSquare className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-3xl font-bold text-white">{totalTopics}</p>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-400 text-sm">Total Commentaires</span>
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-3xl font-bold text-white">{totalComments}</p>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-400 text-sm">Moyenne / Topic</span>
                  <BarChart3 className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-3xl font-bold text-white">
                  {totalTopics > 0 ? (totalComments / totalTopics).toFixed(1) : 0}
                </p>
              </div>
            </div>

            {/* Topics les plus actifs */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-500" />
                Topics les plus actifs
              </h2>
              
              <div className="space-y-3">
                {topicsWithCommentCount
                  .sort((a, b) => b.commentCount - a.commentCount)
                  .slice(0, 5)
                  .map(({ id, title, commentCount, category }) => (
                    <div key={id} className="flex items-center justify-between p-3 bg-black rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-200 font-medium truncate">{title}</p>
                        {category && (
                          <span className="text-xs text-gray-500">{category}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <MessageSquare className="w-4 h-4 text-gray-500" />
                        <span className="text-lg font-semibold text-blue-500">{commentCount}</span>
                      </div>
                    </div>
                  ))}

                {topicsWithCommentCount.length === 0 && (
                  <p className="text-center text-gray-500 py-8">Aucune donnée disponible</p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}