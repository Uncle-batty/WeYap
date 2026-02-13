const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

const usersList = document.getElementById("usersList");
const logoutBtn = document.getElementById("logoutBtn");
const message = document.getElementById("message"); // Make sure you have a <div id="message"></div> in your HTML

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

async function loadUsers() {
    // Query your public.users table
    const { data, error } = await supabaseClient
        .from("users")
        .select("id, username, email")
        .neq("id", currentUser.id); // exclude yourself

    if (error) {
        console.error("Error fetching users:", error);
        message.innerHTML = "<div class='error'>Error fetching users.</div>";
        return;
    }

    if (!data || data.length === 0) {
        message.innerHTML = "<div class='error'>No users available to chat with.</div>";
        return;
    }

    usersList.innerHTML = "";

    data.forEach(user => {
        const btn = document.createElement("button");
        const username = user.username || user.email;
        btn.textContent = username;

        btn.addEventListener("click", () => {
            // navigate to chat page with query string
            window.location.href = `chat.html?receiverId=${user.id}`;
        });

        usersList.appendChild(btn);
    });
}

logoutBtn.addEventListener("click", async () => {
    await supabaseClient.auth.signOut();
    window.location.href = "../../index.html";
});
