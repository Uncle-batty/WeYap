import { CONFIG } from "../../Scripts/config.js";

const supabaseUrl = CONFIG.supabaseUrl;
const supabaseKey = CONFIG.supabaseKey;
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// ===== Get receiver ID =====

const urlParams = new URLSearchParams(window.location.search);
const RECEIVER_ID = urlParams.get("receiverId");

if (!RECEIVER_ID) {
    alert("No receiver specified!");
    window.location.href = "users.html";
}


// ===== Elements =====

const messagesDiv = document.getElementById("messages");
const sendBtn = document.getElementById("sendBtn");
const messageInput = document.getElementById("messageInput");
const logoutBtn = document.getElementById("logoutBtn");
const backBtn = document.getElementById("backBtn");
const chatUserName = document.getElementById("chatUserName");
const emojiBtn = document.getElementById("emojiBtn");

let currentUser = null;


// ============================
// INIT
// ============================

async function init() {

    const { data: { session } } = await supabaseClient.auth.getSession();

    if (!session) {
        window.location.href = "../../index.html";
        return;
    }

    currentUser = session.user;

    await loadReceiverName();
    await loadMessages();
    setupRealtime();
}

init();


// ============================
// LOAD RECEIVER NAME
// ============================

async function loadReceiverName() {

    const { data, error } = await supabaseClient
        .from("users")
        .select("username, email")
        .eq("id", RECEIVER_ID)
        .single();

    if (!error && data) {
        chatUserName.textContent =
            data.username || data.email || "User";
    }
}


// ============================
// LOAD MESSAGES
// ============================

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


// ============================
// RENDER MESSAGE
// ============================

function renderMessage(msg) {

    const div = document.createElement("div");
    div.classList.add("message");

    if (msg.sent_User_Id === currentUser.id) {
        div.classList.add("sent");
    } else {
        div.classList.add("received");
    }

    if (msg.message_type === "audio") {

        const audio = document.createElement("audio");
        audio.controls = true;
        audio.src = msg.audio_url;

        div.appendChild(audio);

    } else {

        div.textContent = msg.Message;
    }

    messagesDiv.appendChild(div);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}


// ============================
// SEND MESSAGE
// ============================

async function sendMessage() {

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
}

sendBtn.addEventListener("click", sendMessage);


// ============================
// ENTER KEY SEND
// ============================

messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        sendMessage();
    }
});


// ============================
// EMOJI PICKER
// ============================

emojiBtn.addEventListener("click", () => {

    const picker = document.createElement("emoji-picker");

    picker.addEventListener("emoji-click", event => {
        messageInput.value += event.detail.unicode;
    });

    document.body.appendChild(picker);

    picker.style.position = "fixed";
    picker.style.bottom = "80px";
    picker.style.right = "20px";
});


// ============================
// REALTIME
// ============================

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
            payload => {

                const msg = payload.new;

                const isBetweenUsers =
                    (msg.sent_User_Id === currentUser.id &&
                     msg.to_User_Id === RECEIVER_ID) ||
                    (msg.sent_User_Id === RECEIVER_ID &&
                     msg.to_User_Id === currentUser.id);

                if (isBetweenUsers) {
                    renderMessage(msg);
                }
            }
        )
        .subscribe();
}
// ============================
// Voice note recording
// ============================
const recordBtn = document.getElementById("recordBtn");

let mediaRecorder;
let audioChunks = [];
let isRecording = false;

recordBtn.addEventListener("click", async () => {

    if (!isRecording) {

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.start();
        isRecording = true;
        recordBtn.textContent = "⏹️";

        audioChunks = [];

        mediaRecorder.ondataavailable = e => {
            audioChunks.push(e.data);
        };

    } else {

        mediaRecorder.stop();
        isRecording = false;
        recordBtn.textContent = "🎤";

        mediaRecorder.onstop = async () => {

            const audioBlob = new Blob(audioChunks, { type: "audio/webm" });

            await uploadVoiceNote(audioBlob);
        };
    }
});

async function uploadVoiceNote(audioBlob) {

    const fileName = `${currentUser.id}_${Date.now()}.webm`;

    const { data, error } = await supabaseClient
        .storage
        .from("voice-notes")
        .upload(fileName, audioBlob);

    if (error) {
        console.error(error);
        return;
    }

    const { data: urlData } = supabaseClient
        .storage
        .from("voice-notes")
        .getPublicUrl(fileName);

    const audioUrl = urlData.publicUrl;

    // Insert into Chats table
    await supabaseClient
        .from("Chats")
        .insert([{
            message_type: "audio",
            audio_url: audioUrl,
            to_User_Id: RECEIVER_ID
        }]);
}
// ============================
// NAVIGATION
// ============================

backBtn.addEventListener("click", () => {
    window.location.href = "../Chats.html";
});

logoutBtn.addEventListener("click", async () => {
    await supabaseClient.auth.signOut();
    window.location.href = "../../index.html";
});
