

const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

const loginBtn = document.getElementById("loginBtn");
const togglePassword = document.getElementById("togglePassword");
const message = document.getElementById("message");

togglePassword.addEventListener("click", () => {
    const passwordInput = document.getElementById("password");

    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        togglePassword.textContent = "Hide";
    } else {
        passwordInput.type = "password";
        togglePassword.textContent = "Show";
    }
});

loginBtn.addEventListener("click", async () => {

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    message.innerHTML = "";

    if (!username || !password) {
        message.innerHTML = "<div class='error'>Please fill in all fields.</div>";
        return;
    }

    try {

        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: username,
            password: password,
        });

        if (error) {
            message.innerHTML = `<div class='error'>${error.message}</div>`;
            return;
        }

        message.innerHTML = "<div class='success'>Login successful! Redirecting...</div>";

        setTimeout(() => {
            window.location.href = "../User/Chats.html";
        }, 1500);

    } catch (err) {
        message.innerHTML = "<div class='error'>Something went wrong.</div>";
    }
});
