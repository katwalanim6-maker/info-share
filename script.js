// ANIM OS BOOT SYSTEM

const intro = document.getElementById("intro");
const loading = document.getElementById("loading");
const main = document.getElementById("main");

const bar = document.getElementById("bar");
const status = document.getElementById("status");

intro.addEventListener("click", () => {

    intro.style.display = "none";
    loading.style.display = "flex";

    startBoot();

});


function startBoot(){

    let progress = 0;

    const messages = [
        "Loading Modules...",
        "Checking Identity...",
        "Initializing Profile...",
        "Connecting Social Systems...",
        "Launching Anim OS..."
    ];


    let interval = setInterval(()=>{

        progress += 20;

        bar.style.width = progress + "%";


        status.innerHTML =
        messages[(progress/20)-1];


        if(progress >= 100){

            clearInterval(interval);

            setTimeout(()=>{

                loading.style.display="none";

                main.style.display="flex";

                startGreeting();

            },700);

        }


    },600);

}



// TIME GREETING

function startGreeting(){

    const greeting =
    document.getElementById("greeting");


    let hour = new Date().getHours();


    if(hour < 12){

        greeting.innerHTML="Good Morning ☀️";

    }

    else if(hour < 18){

        greeting.innerHTML="Good Afternoon 🌤️";

    }

    else{

        greeting.innerHTML="Good Evening 🌙";

    }

}



// SHARE BUTTON

const shareBtn =
document.getElementById("shareBtn");


shareBtn.addEventListener("click",()=>{


    if(navigator.share){

        navigator.share({

            title:"Anim Katwal | Digital Identity",

            text:"Check out Anim OS",

            url:window.location.href

        });

    }

    else{

        alert("Share not supported");

    }

});



// COPY PHONE

const copyBtn =
document.getElementById("copyBtn");


copyBtn.addEventListener("click",()=>{


    navigator.clipboard.writeText("9700068507");


    copyBtn.innerHTML="✅ Copied!";


    setTimeout(()=>{

        copyBtn.innerHTML="📋 Copy Phone";

    },2000);


});



// SAVE CONTACT

const saveBtn =
document.getElementById("saveBtn");


saveBtn.addEventListener("click",()=>{


    const contact =
`BEGIN:VCARD
VERSION:3.0
FN:Anim Katwal
TEL:9700068507
TEL:9712036065
EMAIL:katwalanim6@gmail.com
END:VCARD`;


    const blob =
    new Blob([contact], {type:"text/vcard"});


    const url =
    URL.createObjectURL(blob);


    const link =
    document.createElement("a");


    link.href=url;

    link.download="Anim_Katwal.vcf";

    link.click();


});

// =======================
// AI ANIM CHAT
// =======================

const chatBox = document.getElementById("chat-box");
const input = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");

function addMessage(text, sender) {
    const message = document.createElement("div");
    message.classList.add("message", sender);
    message.innerText = text;
    chatBox.appendChild(message);

    chatBox.scrollTop = chatBox.scrollHeight;
}

function aiReply(message) {

    message = message.toLowerCase();

    if(message.includes("hello") || message.includes("hi")){
        return "👋 Hey! I'm AI Anim. Nice to meet you!";
    }

    if(message.includes("who are you")){
        return "🤖 I'm AI Anim, the digital version of Anim Katwal.";
    }

    if(message.includes("music")){
        return "🎸 Anim loves rock, metal and Nepali rock. He also plays guitar.";
    }

    if(message.includes("contact")){
        return "📱 You can contact Anim using the buttons above.";
    }

    if(message.includes("project")){
        return "💻 Anim is currently building Anim OS.";
    }

    return "🧠 That's interesting! Gemini AI will answer this properly soon.";
}

function sendMessage(){

    const text = input.value.trim();

    if(text==="") return;

    addMessage(text,"user");

    input.value="";

    setTimeout(()=>{

        addMessage(aiReply(text),"ai");

    },700);

}

sendBtn.addEventListener("click",sendMessage);

input.addEventListener("keypress",function(e){

    if(e.key==="Enter"){

        sendMessage();

    }

});

// Welcome message
addMessage("🤖 Hello! I'm AI Anim. Ask me anything about Anim Katwal.","ai");
