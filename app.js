// Open IndexedDB database
const dbRequest = indexedDB.open("VALIS_DB", 1);
let db;

dbRequest.onupgradeneeded = (event) => {
  db = event.target.result;
  db.createObjectStore("posts", { autoIncrement: true });
};

dbRequest.onsuccess = (event) => {
  db = event.target.result;
  loadPosts();
};

// Handle post submission
document.getElementById("submitPost").addEventListener("click", () => {
  const content = document.getElementById("postInput").value;
  if (content) {
    savePost(content);
    document.getElementById("postInput").value = "";
  }
});

// Save a post to IndexedDB
function savePost(content) {
  const tx = db.transaction("posts", "readwrite");
  const store = tx.objectStore("posts");
  const post = { content, timestamp: Date.now() };
  store.add(post);
  tx.oncomplete = loadPosts;
}

// Load and display posts
function loadPosts() {
  const tx = db.transaction("posts", "readonly");
  const store = tx.objectStore("posts");
  const request = store.getAll();
  request.onsuccess = () => {
    const posts = request.result;
    const postList = document.getElementById("postList");
    postList.innerHTML = posts
      .map((post) => `<p>${post.content} <small>(${new Date(post.timestamp).toLocaleString()})</small></p>`)
      .join("");
  };
}