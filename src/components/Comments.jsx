import { ref, onValue } from "firebase/database";
import { db } from "../firebase";
import { useEffect, useState } from "react";

function Comments({ topicId }) {
  const [comments, setComments] = useState([]);

  useEffect(() => {
    const commentsRef = ref(db, `topics/${topicId}/comments`);

    onValue(commentsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.values(data);
        setComments(list);
      } else {
        setComments([]);
      }
    });
  }, [topicId]);

  return (
    <div>
      {comments.map((c, i) => (
        <p key={i}>{c.text}</p>
      ))}
    </div>
  );
}

export default Comments;
