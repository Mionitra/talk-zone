import { ref, push, remove, onValue, update, set } from "firebase/database";
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
  Loader2,
  CheckCircle,
  AlertTriangle,
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
  const [view, setView] = useState("pending");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const topicsRef = ref(db, "topics");
    const commentsRef = ref(db, "comments");

    const unsubscribeTopics = onValue(topicsRef, (snap) => {
      setTopics(snap.val() || {});
    });

    const unsubscribeComments = onValue(commentsRef, (snap) => {
      setAllComments(snap.val() || {});
    });

    return () => {
      unsubscribeTopics();
      unsubscribeComments();
    };
  }, []);

  async function addTopic() {
    if (!title.trim()) {
      setError("Le titre est obligatoire");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const topicsRef = ref(db, "topics");
      const newTopicRef = push(topicsRef);

      await set(newTopicRef, {
        title: title.trim(),
        description: description.trim() || "",
        category: category.trim() || "Général",
        status: "published",
        createdAt: Date.now(),
      });

      setTitle("");
      setDescription("");
      setCategory("");
      setSuccess("Topic créé avec succès !");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Erreur lors de l'ajout:", err);
      setError(`Erreur: ${err.message}`);
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
    if (!editTitle.trim()) {
      setError("Le titre est obligatoire");
      return;
    }

    setError("");

    try {
      await update(ref(db, `topics/${id}`), {
        title: editTitle.trim(),
        description: editDescription.trim(),
        category: editCategory.trim() || "Général",
        updatedAt: Date.now(),
      });

      setEditingId(null);
      setSuccess("Topic modifié avec succès !");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Erreur lors de la modification:", err);
      setError(`Erreur: ${err.message}`);
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
      setSuccess("Topic supprimé avec succès !");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Erreur lors de la suppression:", err);
      setError(`Erreur: ${err.message}`);
    }
  }

  async function approveTopic(id) {
    if (!window.confirm("Approuver ce topic ? Il sera visible par tous."))
      return;

    try {
      await update(ref(db, `topics/${id}`), {
        status: "published",
        approvedAt: Date.now(),
      });
      setSuccess("Topic approuvé avec succès !");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Erreur lors de l'approbation:", err);
      setError(`Erreur: ${err.message}`);
    }
  }

  async function rejectTopic(id) {
    if (!window.confirm("Rejeter ce topic ? Il sera supprimé définitivement."))
      return;

    try {
      await remove(ref(db, `topics/${id}`));
      await remove(ref(db, `comments/${id}`));
      setSuccess("Topic rejeté avec succès !");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Erreur lors du rejet:", err);
      setError(`Erreur: ${err.message}`);
    }
  }

  const topicsArray = Object.entries(topics);
  const pendingTopics = topicsArray
    .filter(([, topic]) => topic.status === "pending")
    .map(([id, topic]) => ({ id, ...topic }))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  const publishedTopics = topicsArray
    .filter(([, topic]) => topic.status === "published")
    .map(([id, topic]) => ({
      id,
      ...topic,
      commentCount: Object.keys(allComments[id] || {}).length,
    }))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  const totalTopics = publishedTopics.length;
  const totalPending = pendingTopics.length;
  const totalComments = Object.values(allComments).reduce((sum, topicComments) => {
    return sum + Object.keys(topicComments || {}).length;
  }, 0);

  function formatDate(timestamp) {
    if (!timestamp) return "Date inconnue";
    return new Date(timestamp).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="min-h-screen bg-black">
      <header className="border-b border-blue-900/30 bg-black/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Administration</h1>
                <p className="text-sm text-gray-500">
                  Gestion des topics et statistiques
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex bg-gray-900 border border-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setView("pending")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    view === "pending"
                      ? "bg-blue-600 text-white"
                      : "text-gray-400 hover:text-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    En attente {totalPending > 0 && `(${totalPending})`}
                  </div>
                </button>
                <button
                  onClick={() => setView("topics")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    view === "topics"
                      ? "bg-blue-600 text-white"
                      : "text-gray-400 hover:text-gray-300"
                  }`}
                >
                  Topics publiés
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
        {/* Messages de feedback */}
        {error && (
          <div className="mb-6 bg-red-600/10 border border-red-600/30 rounded-xl p-4">
            <p className="text-red-400 text-center font-medium">❌ {error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-600/10 border border-green-600/30 rounded-xl p-4">
            <p className="text-green-400 text-center font-medium">✅ {success}</p>
          </div>
        )}

        {/* Vue En attente */}
        {view === "pending" && (
          <div className="space-y-6">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                Topics en attente d'approbation ({pendingTopics.length})
              </h2>

              {pendingTopics.length === 0 ? (
                <div className="text-center py-20">
                  <CheckCircle className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-500">Aucun topic en attente</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingTopics.map(({ id, title, description, category, createdAt }) => (
                    <div
                      key={id}
                      className="bg-black border border-yellow-900/50 rounded-xl p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-white truncate">
                              {title}
                            </h3>
                            <span className="px-2 py-1 bg-yellow-600/10 text-yellow-400 text-xs rounded-md whitespace-nowrap">
                              En attente
                            </span>
                          </div>
                          {description && (
                            <p className="text-gray-400 text-sm mb-3">
                              {description}
                            </p>
                          )}
                          {category && (
                            <p className="text-gray-500 text-sm mb-2">
                              Catégorie: {category}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>Soumis le {formatDate(createdAt)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => approveTopic(id)}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-all"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approuver
                          </button>
                          <button
                            onClick={() => rejectTopic(id)}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-600/50 text-red-400 rounded-lg text-sm font-medium transition-all"
                          >
                            <X className="w-4 h-4" />
                            Rejeter
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Vue Topics */}
        {view === "topics" && (
          <>
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

            <div>
              <h2 className="text-lg font-semibold text-white mb-4">
                Topics publiés ({publishedTopics.length})
              </h2>
              {publishedTopics.length === 0 ? (
                <div className="text-center py-20 bg-gray-900/50 rounded-xl border border-gray-800">
                  <MessageSquare className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-500">Aucun topic publié</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {publishedTopics.map(
                    ({ id, title, description, category, commentCount, createdAt }) => (
                      <div
                        key={id}
                        className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-all"
                      >
                        {editingId === id ? (
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
                                <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                                  {description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                  <MessageSquare className="w-4 h-4" />
                                  <span>
                                    {commentCount} commentaire
                                    {commentCount !== 1 ? "s" : ""}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  <span>{formatDate(createdAt)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  startEdit(id, { title, description, category })
                                }
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
                    )
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* Vue Statistiques */}
        {view === "stats" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-400 text-sm">Topics publiés</span>
                  <MessageSquare className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-3xl font-bold text-white">{totalTopics}</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-400 text-sm">En attente</span>
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                </div>
                <p className="text-3xl font-bold text-white">{totalPending}</p>
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

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-500" />
                Topics les plus actifs
              </h2>
              <div className="space-y-3">
                {publishedTopics
                  .sort((a, b) => b.commentCount - a.commentCount)
                  .slice(0, 5)
                  .map(({ id, title, commentCount, category }) => (
                    <div
                      key={id}
                      className="flex items-center justify-between p-3 bg-black rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-200 font-medium truncate">{title}</p>
                        {category && (
                          <span className="text-xs text-gray-500">{category}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <MessageSquare className="w-4 h-4 text-gray-500" />
                        <span className="text-lg font-semibold text-blue-500">
                          {commentCount}
                        </span>
                      </div>
                    </div>
                  ))}
                {publishedTopics.length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    Aucune donnée disponible
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}