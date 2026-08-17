// ANIM OS BOOT SYSTEM

const intro = document.getElementById("intro");
const loading = document.getElementById("loading");
const main = document.getElementById("main");

const bar = document.getElementById("bar");
const status = document.getElementById("status");

let bootStarted = false;

function enterAnimOS(event){
    if(event){
        event.preventDefault();
        event.stopPropagation();
    }

    // Prevent duplicate triggers from touch + click firing together.
    if(bootStarted) return;
    bootStarted = true;

    intro.style.display = "none";
    loading.style.display = "flex";

    startBoot();
}

// Support normal taps/clicks AND mobile touch/pointer events.
if(intro){
    intro.style.pointerEvents = "auto";
    intro.addEventListener("pointerup", enterAnimOS, { passive: false });
    intro.addEventListener("click", enterAnimOS, { passive: false });
}

function startBoot(){

    let progress = 0;

    const messages = [
        "Loading Modules...",
        "Checking Identity...",
        "Initializing Profile...",
        "Connecting Social Systems...",
        "Launching Anim OS..."
    ];

    const interval = setInterval(()=>{

        progress += 20;

        if(bar) bar.style.width = progress + "%";
        if(status) status.innerHTML = messages[(progress / 20) - 1];

        if(progress >= 100){

            clearInterval(interval);

            setTimeout(()=>{
                loading.style.display = "none";
                main.style.display = "flex";
                startGreeting();
            },700);
        }

    },600);
}

// TIME GREETING
function startGreeting(){

    const greeting = document.getElementById("greeting");
    if(!greeting) return;

    let hour = new Date().getHours();

    if(hour < 12){
        greeting.innerHTML="Good Morning ☀️";
    } else if(hour < 18){
        greeting.innerHTML="Good Afternoon 🌤️";
    } else{
        greeting.innerHTML="Good Evening 🌙";
    }
}

// SHARE BUTTON
const shareBtn = document.getElementById("shareBtn");

if(shareBtn){
    shareBtn.addEventListener("click",()=>{
        if(navigator.share){
            navigator.share({
                title:"Anim Katwal | Digital Identity",
                text:"Check out Anim OS",
                url:window.location.href
            });
        } else{
            alert("Share not supported");
        }
    });
}

// COPY PHONE
const copyBtn = document.getElementById("copyBtn");

if(copyBtn){
    copyBtn.addEventListener("click",()=>{
        navigator.clipboard.writeText("9700068507");
        copyBtn.innerHTML="✅ Copied!";
        setTimeout(()=>{
            copyBtn.innerHTML="📋 Copy Phone";
        },2000);
    });
}

// SAVE CONTACT
const saveBtn = document.getElementById("saveBtn");

if(saveBtn){
    saveBtn.addEventListener("click",()=>{
        const contact =
`BEGIN:VCARD
VERSION:3.0
FN:Anim Katwal
TEL:9700068507
TEL:9712036065
EMAIL:katwalanim6@gmail.com
END:VCARD`;

        const blob = new Blob([contact], {type:"text/vcard"});
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href=url;
        link.download="Anim_Katwal.vcf";
        link.click();
        URL.revokeObjectURL(url);
    });
}

// =======================
// AI ANIM CHAT
// =======================
const chatBox = document.getElementById("chat-box");
const input = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");

function addMessage(text, sender) {
    if(!chatBox) return;
    const message = document.createElement("div");
    message.classList.add("message", sender);
    message.innerText = text;
    chatBox.appendChild(message);
    chatBox.scrollTop = chatBox.scrollHeight;
}

async function aiReply(message) {
    try {
        const response = await fetch("https://anim-core.onrender.com/chat", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({message: message})
        });

        if (!response.ok) throw new Error("Server error");

        const data = await response.json();
        return data.reply || "🤖 I couldn't generate a response.";

    } catch (error) {
        console.error("AI Error:", error);
        return "⚠️ AI Anim is temporarily unavailable. Please try again.";
    }
}

function sendMessage(){
    if(!input) return;

    const text = input.value.trim();
    if(text==="") return;

    addMessage(text,"user");
    input.value="";

    setTimeout(async ()=>{
        const reply = await aiReply(text);
        addMessage(reply, "ai");
    },700);
}

if(sendBtn) sendBtn.addEventListener("click",sendMessage);

if(input){
    input.addEventListener("keypress",function(e){
        if(e.key==="Enter") sendMessage();
    });
}

// Welcome message
addMessage("🤖 Hello! I'm AI Anim. Ask me anything about Anim Katwal.","ai");
