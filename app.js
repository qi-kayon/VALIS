// Declare db globally
let db;

// Open IndexedDB database
const dbRequest = indexedDB.open("VALIS_DB", 3);

dbRequest.onupgradeneeded = (event) => {
  db = event.target.result;
  if (event.oldVersion < 1) {
    const store = db.createObjectStore("posts", { autoIncrement: true });
    store.createIndex("by_timestamp", "timestamp");
  } else if (event.oldVersion < 2) {
    const store = db.transaction.objectStore("posts");
    store.createIndex("by_timestamp", "timestamp");
  }
};

dbRequest.onsuccess = (event) => {
  db = event.target.result;
  loadPosts();
};

dbRequest.onerror = (event) => {
  console.error("Database error:", event.target.errorCode);
};

// Handle post submission
document.getElementById("submitPost").addEventListener("click", () => {
  const content = document.getElementById("postInput").value.trim();
  if (content) {
    savePost(content);
    document.getElementById("postInput").value = "";
  }
});

// Save a post to IndexedDB
function savePost(content) {
  const tx = db.transaction("posts", "readwrite");
  const store = tx.objectStore("posts");
  const post = { content, timestamp: Date.now(), favorited: false };
  const request = store.add(post);
  request.onerror = (event) => {
    console.error("Error saving post:", event.target.error);
  };
  tx.oncomplete = () => {
    loadPosts();
  };
}

// Load and display posts
function loadPosts() {
  const tx = db.transaction("posts", "readonly"); // Changed to readonly
  const store = tx.objectStore("posts");
  const index = store.index("by_timestamp");
  const request = index.openCursor(null, "prev");
  const postsHtml = [];

  request.onsuccess = (event) => {
    const cursor = event.target.result;
    if (cursor) {
      const post = cursor.value;
      const postId = cursor.key;
      postsHtml.push(`
        <p class="post${post.favorited ? ' favorited' : ''}" data-id="${postId}">
          ${post.content} <small>(${new Date(post.timestamp).toLocaleString()})</small>
          <span class="post-actions">
            <span class="caret">v</span>
            <span class="dropdown">
              <span class="favorite-action">Favorite</span>
              <span class="delete-action">Delete</span>
            </span>
          </span>
        </p>
      `);
      cursor.continue();
    } else {
      const postList = document.getElementById("postList");
      postList.innerHTML = postsHtml.join("");

      // Add event listeners for caret and actions
      document.querySelectorAll('.post-actions').forEach(action => {
        const caret = action.querySelector('.caret');
        const dropdown = action.querySelector('.dropdown');

        caret.addEventListener('click', () => {
          console.log('Caret clicked');
          document.querySelectorAll('.post-actions.active').forEach(other => {
            if (other !== action) other.classList.remove('active');
          });
          action.classList.toggle('active');
        });

        action.querySelector('.favorite-action').addEventListener('click', () => {
          console.log('Favorite clicked');
          const postElement = action.closest('.post');
          const postId = parseInt(postElement.dataset.id);
          toggleFavorite(postId, postElement);
          action.classList.remove('active');
        });

        action.querySelector('.delete-action').addEventListener('click', () => {
          console.log('Delete clicked');
          const postElement = action.closest('.post');
          const postId = parseInt(postElement.dataset.id);
          deletePost(postId);
          action.classList.remove('active');
        });
      });
    }
  };
  request.onerror = (event) => {
    console.error("Error loading posts:", event.target.error);
  };
}

// Toggle favorite status
function toggleFavorite(postId, postElement) {
  const tx = db.transaction("posts", "readwrite");
  const store = tx.objectStore("posts");
  const request = store.get(postId);

  request.onsuccess = () => {
    const post = request.result;
    if (post) {
      post.favorited = !post.favorited;
      const updateRequest = store.put(post, postId);
      updateRequest.onsuccess = () => {
        console.log('Post favorited status updated in database');
        postElement.classList.toggle('favorited');
      };
      updateRequest.onerror = (event) => {
        console.error("Error updating post:", event.target.error);
      };
    }
  };
  request.onerror = (event) => {
    console.error("Error fetching post:", event.target.error);
  };
}

// Delete a post
function deletePost(postId) {
  const tx = db.transaction("posts", "readwrite");
  const store = tx.objectStore("posts");
  const request = store.delete(postId);

  request.onsuccess = () => {
    console.log('Post deleted from database');
    loadPosts(); // Refresh the UI
  };
  request.onerror = (event) => {
    console.error("Error deleting post:", event.target.error);
  };
}