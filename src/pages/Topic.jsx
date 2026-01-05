import { ref, push, onValue, remove } from "firebase/database";
import { db } from "../firebase";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { Send, Trash2, MessageSquare, Loader2, ArrowLeft, Shield, Clock, User } from "lucide-react";

export default function Topic() {
  const { id } = useParams();
  const [topic, setTopic] = useState(null);
  const [comments, setComments] = useState({});
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user && user.accessToken) {
        user.getIdTokenResult().then((idTokenResult) => {
          setIsAdmin(!!idTokenResult.claims.admin);
        });
      } else {
        setIsAdmin(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Charger les infos du topic
  useEffect(() => {
    if (!id) return;
    
    const topicRef = ref(db, `topics/${id}`);
    const unsubscribe = onValue(topicRef, (snapshot) => {
      setTopic(snapshot.val());
    });

    return () => unsubscribe();
  }, [id]);

  // Charger les commentaires
  useEffect(() => {
    if (!id) {
      console.error("ID du topic non défini !");
      return;
    }

    console.log("Chargement des commentaires pour le topic :", id);
    const commentsRef = ref(db, `comments/${id}`);

    const unsubscribe = onValue(
      commentsRef,
      (snapshot) => {
        const data = snapshot.val();
        console.log("Données reçues depuis Firebase :", data);
        setComments(data || {});
        setLoading(false);
      },
      (error) => {
        console.error("Erreur lors de la lecture des commentaires :", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [id]);

  function send() {
    if (!text.trim() || sending) return;

    setSending(true);
    const commentRef = ref(db, `comments/${id}`);
    console.log("Envoi du commentaire :", text);

    const commentData = {
      text,
      timestamp: Date.now(),
      userId: currentUser?.uid || "anonymous",
      userEmail: currentUser?.email || "Anonyme",
      userName: currentUser?.displayName || currentUser?.email?.split('@')[0] || "Anonyme"
    };

    push(commentRef, commentData)
      .then(() => {
        console.log("Commentaire ajouté avec succès !");
        setText("");
        setSending(false);
      })
      .catch((err) => {
        console.error("Erreur lors de l'ajout du commentaire :", err);
        setSending(false);
      });
  }

  function handleDelete(commentId) {
    if (!window.confirm("Supprimer ce commentaire ?")) return;

    remove(ref(db, `comments/${id}/${commentId}`))
      .then(() => console.log("Commentaire supprimé"))
      .catch((err) => console.error("Erreur lors de la suppression :", err));
  }

  function formatTimestamp(timestamp) {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }

  const commentsArray = Object.entries(comments).sort((a, b) => {
    const timeA = a[1].timestamp || 0;
    const timeB = b[1].timestamp || 0;
    return timeB - timeA; // Plus récent en premier
  });

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-blue-900/30 bg-black/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <a 
              href="/" 
              className="w-10 h-10 bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-blue-600 rounded-lg flex items-center justify-center transition-all"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </a>
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-white truncate">
                  {topic?.title || id || "Chargement..."}
                </h1>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span>{commentsArray.length} commentaire{commentsArray.length !== 1 ? 's' : ''}</span>
                  {topic?.category && (
                    <>
                      <span>•</span>
                      <span className="px-2 py-0.5 bg-blue-600/10 text-blue-400 rounded">
                        {topic.category}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            {isAdmin && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-600/10 border border-blue-600/30 rounded-lg">
                <Shield className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-blue-400 font-medium">Admin</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Topic Description */}
        {topic?.description && (
          <div className="mb-8 bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <p className="text-gray-300 leading-relaxed">{topic.description}</p>
          </div>
        )}

        {/* Comments Section */}
        <div className="mb-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : commentsArray.length === 0 ? (
            <div className="text-center py-20 bg-gray-900/50 rounded-xl border border-gray-800">
              <MessageSquare className="w-12 h-12 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500">Aucun commentaire pour le moment</p>
              <p className="text-gray-600 text-sm mt-1">Soyez le premier à commenter !</p>
            </div>
          ) : (
            <div className="space-y-3">
              {commentsArray.map(([cid, comment]) => (
                <div
                  key={cid}
                  className="group bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-all"
                >
                  {/* Header du commentaire */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-600/20 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-300">
                          {comment.userName || "Utilisateur"}
                        </span>
                        {comment.timestamp && (
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <Clock className="w-3 h-3" />
                            {formatTimestamp(comment.timestamp)}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(cid)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/10 hover:bg-red-600/20 border border-red-600/30 hover:border-red-600/50 text-red-400 rounded-lg text-sm font-medium transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Supprimer
                      </button>
                    )}
                  </div>

                  {/* Texte du commentaire */}
                  <p className="text-gray-200 leading-relaxed pl-10">{comment.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Comment Input */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <label className="block text-sm font-medium text-gray-400 mb-3">
            Ajouter un commentaire
          </label>
          
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) {
                send();
              }
            }}
            placeholder="Partagez votre avis..."
            className="w-full bg-black border border-gray-800 rounded-lg px-4 py-3 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all resize-none"
            rows={4}
            disabled={sending}
          />
          
          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-gray-600">
              Appuyez sur <kbd className="px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-gray-400">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-gray-400">Entrée</kbd> pour envoyer
            </p>
            
            <button
              onClick={send}
              disabled={!text.trim() || sending}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-lg font-medium transition-all disabled:cursor-not-allowed"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Envoyer
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}