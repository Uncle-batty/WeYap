import { CONFIG } from "../../Scripts/config.js";

const supabaseUrl = CONFIG.supabaseUrl;
const supabaseKey = CONFIG.supabaseKey;
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

const usersList = document.getElementById("usersList");
const logoutBtn = document.getElementById("logoutBtn");
const message = document.getElementById("message");

let currentUser = null;

async function init() {

    const { data: { session } } = await supabaseClient.auth.getSession();

    if (!session) {
        window.location.href = "../../index.html";
        return;
    }

    currentUser = session.user;

    loadUsers();
}

init();



/* ===============================
   LOAD USERS
================================ */

async function loadUsers() {

    const { data, error } = await supabaseClient
        .from("users")
        .select("id, username, email")
        .neq("id", currentUser.id); // exclude yourself

    if (error) {
        console.error("Error fetching users:", error);
        showMessage("Error fetching users.");
        return;
    }

    if (!data || data.length === 0) {
        showMessage("No users available to chat with.");
        return;
    }

    usersList.innerHTML = "";

    data.forEach(user => renderUser(user));
}



/* ===============================
   RENDER USER (Chat Item Style)
================================ */

function renderUser(user) {

    const username = user.username || user.email || "Unknown";

    const item = document.createElement("div");
    item.classList.add("user-item");

    // Avatar letter
    const letter = username.charAt(0).toUpperCase();

    item.innerHTML = `
        <div class="avatar">${letter}</div>

        <div class="user-info">
            <div class="user-name">${username}</div>
            <div class="last-message">Tap to start chatting...</div>
        </div>

        <div class="timestamp">Now</div>
    `;

    item.addEventListener("click", () => {
        window.location.href = `chat.html?receiverId=${user.id}`;
    });

    usersList.appendChild(item);
}



/* ===============================
   MESSAGE DISPLAY
================================ */

function showMessage(text) {

    if (!message) return;

    message.innerHTML = `
        <div class="error">${text}</div>
    `;
}



/* ===============================
   LOGOUT
================================ */

logoutBtn.addEventListener("click", async () => {
    await supabaseClient.auth.signOut();
    window.location.href = "../../index.html";
});
