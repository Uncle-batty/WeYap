import { CONFIG } from "../../Scripts/config.js";

const supabaseUrl = CONFIG.supabaseUrl;
const supabaseKey = CONFIG.supabaseKey;
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

async function handleSignIn(username, password) {
    const {data, error} = await supabaseClient.auth.signInWithPassword({
        email: username,
        password: password,
    });

    if (error) {
        console.log("Error signing-in: ", error.message);
        // show the error wrapper on failed sign in
        document.querySelectorAll(".error-message").forEach(errElement => {
            errElement.classList.remove("hidden");
        });
        return;
    }

    console.log("User signed in:", data.user.id);
    window.location.href = "../User/Chats.html";

    }

// DOMContentLoaded event fires when 
// the HTML document has been completely parsed
document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.querySelector("#loginForm")

    loginForm.addEventListener("submit", async (event) => {
        // Prevent page refresh from trying to submit a form
        event.preventDefault();
        // Gather all inputs from form
        const formData = new FormData(loginForm);
        // Transforms kvps into a JS Object
        const formObject = Object.fromEntries(formData);
        
        await handleSignIn(formObject.username, formObject.password);
    })
})