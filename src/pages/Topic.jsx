import { ref, push, onValue, remove } from "firebase/database";
import { db } from "../firebase";
import { useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { Send, Trash2, MessageSquare, Loader2, ArrowLeft, Shield, Clock, User, Menu, X } from "lucide-react";

export default function Topic() {
  const { id } = useParams();
  const [topic, setTopic] = useState(null);
  const [comments, setComments] = useState({});
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const commentsEndRef = useRef(null);
  const textareaRef = useRef(null);

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

  // Auto-scroll vers le bas quand de nouveaux commentaires arrivent
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

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
        // Réinitialiser la hauteur du textarea
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
        // Scroll vers le bas
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header fixé en haut */}
      <header className="border-b border-blue-900/30 bg-black/50 backdrop-blur-sm sticky top-0 z-20 flex-shrink-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Bouton retour */}
            <a 
              href="/" 
              className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-blue-600 rounded-lg flex items-center justify-center transition-all flex-shrink-0"
              aria-label="Retour à l'accueil"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            </a>

            {/* Logo et titre */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-lg flex items-center justify-center pl-1 flex-shrink-0">
                <img src="/talk-zone.svg" alt="Logo Talk Zone" className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-white truncate">
                  {topic?.title || id || "Chargement..."}
                </h1>
                <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-500 flex-wrap">
                  <span>{commentsArray.length} commentaire{commentsArray.length !== 1 ? 's' : ''}</span>
                  {topic?.category && (
                    <>
                      <span className="hidden sm:inline">•</span>
                      <span className="px-2 py-0.5 bg-blue-600/10 text-blue-400 rounded text-xs">
                        {topic.category}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Badge Admin - desktop */}
            {isAdmin && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-blue-600/10 border border-blue-600/30 rounded-lg">
                <Shield className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-blue-400 font-medium">Admin</span>
              </div>
            )}

            {/* Bouton menu mobile pour admin */}
            {isAdmin && (
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="sm:hidden w-9 h-9 bg-gray-900 border border-gray-800 rounded-lg flex items-center justify-center"
                aria-label="Menu admin"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5 text-gray-400" />
                ) : (
                  <Menu className="w-5 h-5 text-gray-400" />
                )}
              </button>
            )}
          </div>

          {/* Menu mobile admin */}
          {isMobileMenuOpen && isAdmin && (
            <div className="mt-3 sm:hidden bg-gray-900 border border-gray-800 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-blue-400 font-medium">Mode Administrateur</span>
              </div>
              <p className="text-xs text-gray-500">
                Vous pouvez supprimer les commentaires en cliquant sur le bouton qui apparaît au survol.
              </p>
            </div>
          )}
        </div>
      </header>

      {/* Main Content - zone de scroll */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-32 sm:pb-40">
          {/* Topic Description */}
          {topic?.description && (
            <div className="mb-6 sm:mb-8 bg-gray-900/50 border border-gray-800 rounded-xl p-4 sm:p-6">
              <p className="text-gray-300 leading-relaxed text-sm sm:text-base">{topic.description}</p>
            </div>
          )}

          {/* Comments Section */}
          <div className="mb-8">
            {loading ? (
              <div className="flex items-center justify-center py-16 sm:py-20">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            ) : commentsArray.length === 0 ? (
              <div className="text-center py-16 sm:py-20 bg-gray-900/50 rounded-xl border border-gray-800">
                <MessageSquare className="w-10 h-10 sm:w-12 sm:h-12 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500 text-sm sm:text-base">Aucun commentaire pour le moment</p>
                <p className="text-gray-600 text-xs sm:text-sm mt-1">Soyez le premier à commenter !</p>
              </div>
            ) : (
              <div className="space-y-3">
                {commentsArray.map(([cid, comment]) => (
                  <div
                    key={cid}
                    className="group bg-gray-900 border border-gray-800 rounded-lg p-3 sm:p-4 hover:border-gray-700 transition-all"
                  >
                    {/* Header du commentaire */}
                    <div className="flex items-start sm:items-center justify-between mb-3">
                      <div className="flex items-start sm:items-center gap-2 flex-1 min-w-0">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0">
                          <User className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs sm:text-sm font-medium text-gray-300 truncate">
                              {comment.userName || "Utilisateur"}
                            </span>
                            {isAdmin && (
                              <button
                                onClick={() => handleDelete(cid)}
                                className="sm:hidden flex items-center gap-1 px-2 py-1 bg-red-600/10 hover:bg-red-600/20 border border-red-600/30 hover:border-red-600/50 text-red-400 rounded text-xs font-medium transition-all"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          {comment.timestamp && (
                            <div className="flex items-center gap-1 text-xs text-gray-600 mt-0.5">
                              <Clock className="w-3 h-3 hidden sm:block" />
                              <span className="text-xs">{formatTimestamp(comment.timestamp)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(cid)}
                          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-red-600/10 hover:bg-red-600/20 border border-red-600/30 hover:border-red-600/50 text-red-400 rounded-lg text-sm font-medium transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Supprimer
                        </button>
                      )}
                    </div>

                    {/* Texte du commentaire */}
                    <p className="text-gray-200 leading-relaxed text-sm sm:text-base pl-0 sm:pl-10 mt-2 sm:mt-0">
                      {comment.text}
                    </p>
                  </div>
                ))}
                {/* Référence pour le scroll automatique */}
                <div ref={commentsEndRef} />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Input Fixé en Bas - Style Chat moderne */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-black/95 backdrop-blur-md border-t border-gray-800">
        <div className="max-w-4xl mx-auto p-4">
          {/* Indicateur de focus clavier (mobile) */}
          <div className="hidden mb-2 items-center justify-center">
            <div className="w-12 h-1 bg-gray-700 rounded-full"></div>
          </div>
          
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Écrivez votre commentaire..."
                className="w-full bg-gray-900 border border-gray-700 rounded-xl sm:rounded-2xl px-4 py-3 pr-12 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none h-12 min-h-[48px] max-h-40 text-sm sm:text-base"
                rows={1}
                disabled={sending}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
                }}
              />
              
              {/* Indicateur de caractères (optionnel) */}
              {text.length > 0 && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${text.length > 500 ? 'bg-red-500' : 'bg-green-500'}`}></div>
                    <span className="text-xs text-gray-500">{text.length}/1000</span>
                  </div>
                </div>
              )}
            </div>
            
            <button
              onClick={send}
              disabled={!text.trim() || sending}
              className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-800 disabled:to-gray-800 disabled:text-gray-600 text-white rounded-xl flex items-center justify-center transition-all disabled:cursor-not-allowed flex-shrink-0 shadow-lg"
              aria-label="Envoyer le message"
            >
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          
          {/* Instructions */}
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-gray-500 hidden sm:block">
              Appuyez sur <kbd className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-gray-400 mx-1">Entrée</kbd> pour envoyer
            </p>
            <p className="text-xs text-gray-500 sm:hidden">
              <kbd className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-gray-400">Entrée</kbd> pour envoyer
            </p>
            
            <div className="flex items-center gap-2">
              {sending && (
                <div className="flex items-center gap-1 text-xs text-blue-500">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Envoi...</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Gradient overlay pour le dégradé en bas */}
        <div className="absolute bottom-full left-0 right-0 h-8 bg-gradient-to-t from-black/50 to-transparent pointer-events-none"></div>
      </div>
    </div>
  );
}