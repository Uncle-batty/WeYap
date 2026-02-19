
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// Get receiver ID from query string
const urlParams = new URLSearchParams(window.location.search);
const RECEIVER_ID = urlParams.get("receiverId");

if (!RECEIVER_ID) {
    alert("No receiver specified!");
    window.location.href = "users.html";
}


const messagesDiv = document.getElementById("messages");
const sendBtn = document.getElementById("sendBtn");
const messageInput = document.getElementById("messageInput");
const logoutBtn = document.getElementById("logoutBtn");

let currentUser = null;


async function init() {

    const { data: { session } } = await supabaseClient.auth.getSession();

    if (!session) {
        window.location.href = "../../index.html";
        return;
    }

    currentUser = session.user;

    loadMessages();
    setupRealtime();
}


init();



async function loadMessages() {
    const { data, error } = await supabaseClient
        .from("Chats")
        .select("*")
        .or(
            `and(sent_User_Id.eq.${currentUser.id},to_User_Id.eq.${RECEIVER_ID}),` +
            `and(sent_User_Id.eq.${RECEIVER_ID},to_User_Id.eq.${currentUser.id})`
        )
        .order("created_at", { ascending: true });

    if (error) {
        console.error(error);
        return;
    }

    messagesDiv.innerHTML = "";
    data.forEach(msg => renderMessage(msg));
}




function renderMessage(msg) {
    const div = document.createElement("div");
    div.classList.add("Chats");

    if (msg.sent_User_Id === currentUser.id) {
        div.classList.add("sent");
    } else {
        div.classList.add("received");
    }

    div.textContent = msg.Message;
    messagesDiv.appendChild(div);

    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}



sendBtn.addEventListener("click", async () => {

    const text = messageInput.value.trim();
    if (!text) return;

    const { error } = await supabaseClient
        .from("Chats")
        .insert([
            {
                Message: text,
                to_User_Id: RECEIVER_ID
            }
        ]);

    if (error) {
        console.error(error);
        return;
    }

    messageInput.value = "";
});



function setupRealtime() {
    supabaseClient
        .channel("realtime-messages")
        .on(
            "postgres_changes",
            {
                event: "INSERT",
                schema: "public",
                table: "Chats"
            },
            (payload) => {
                const newMessage = payload.new;

                const isBetweenUsers =
                    (newMessage.sent_User_Id === currentUser.id &&
                     newMessage.to_User_Id === RECEIVER_ID) ||
                    (newMessage.sent_User_Id === RECEIVER_ID &&
                     newMessage.to_User_Id === currentUser.id);

                if (isBetweenUsers) {
                    renderMessage(newMessage);
                }
            }
        )
        .subscribe();
}




logoutBtn.addEventListener("click", async () => {
    await supabaseClient.auth.signOut();
    window.location.href = "../../index.html";
});
