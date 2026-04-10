// Elements
const mainInput = document.getElementById('main-input');
const out1 = document.getElementById('output-1');
const out2 = document.getElementById('output-2');
const loader = document.getElementById('loader');
const switchBtn = document.getElementById('switch-mode-btn');
const modeText = document.getElementById('mode-text');
const inputLabel = document.getElementById('input-label');
const out1Label = document.getElementById('output-1-label');
const out2Label = document.getElementById('output-2-label');
const clearBtn = document.getElementById('clear-btn');
const copyBtns = document.querySelectorAll('.copy-btn');
const ttsBtn = document.getElementById('tts-btn');

// Modal Elements
const helpModal = document.getElementById('help-modal');
const helpBtn = document.getElementById('help-btn');
const closeModalBtn = document.getElementById('close-modal-btn');

let isReverseMode = false; // False = Singlish to Sinhala, True = English to Sinhala

// --- 1. MODAL LOGIC ---
helpBtn.addEventListener('click', () => helpModal.classList.remove('hidden'));
closeModalBtn.addEventListener('click', () => helpModal.classList.add('hidden'));
window.addEventListener('click', (e) => { if (e.target === helpModal) helpModal.classList.add('hidden'); });

// --- 2. MODE SWITCHER ---
switchBtn.addEventListener('click', () => {
    isReverseMode = !isReverseMode;
    mainInput.value = "";
    out1.innerText = "Results will appear here...";
    out2.innerText = "Results will appear here...";
    
    if (isReverseMode) {
        modeText.innerText = "English to Sinhala Mode";
        inputLabel.innerHTML = '<i class="fa-solid fa-keyboard"></i> English Input';
        out1Label.innerText = "සිංහල (Sinhala)";
        out2Label.innerText = "Original Text";
        mainInput.placeholder = "Type in English (e.g. How are you?)";
    } else {
        modeText.innerText = "Singlish to Sinhala & English";
        inputLabel.innerHTML = '<i class="fa-solid fa-keyboard"></i> Singlish Input';
        out1Label.innerText = "සිංහල (Sinhala)";
        out2Label.innerText = "English Translation";
        mainInput.placeholder = "Type here (e.g. Oya kohomada?)";
    }
});

// --- 3. TRANSLITERATION MAPPING ---
const vowels = {'a':'අ','aa':'ආ','ae':'ඇ','aae':'ඈ','i':'ඉ','ii':'ඊ','u':'උ','uu':'ඌ','e':'එ','ee':'ඒ','ai':'ඓ','o':'ඔ','oo':'ඕ','au':'ඖ'};
const consonants = {'k':'ක','g':'ග','gh':'ඝ','ch':'ච','j':'ජ','jh':'ඣ','t':'ට','d':'ඩ','th':'ත','dh':'ද','n':'න','p':'ප','b':'බ','bh':'භ','m':'ම','y':'ය','r':'ර','l':'ල','v':'ව','w':'ව','s':'ස','sh':'ෂ','h':'හ','f':'ෆ','gn':'ඥ'};
const modifiers = {'a':'','aa':'ා','ae':'ැ','aae':'ෑ','i':'ි','ii':'ී','u':'ු','uu':'ූ','e':'ෙ','ee':'ේ','ai':'ෛ','o':'ො','oo':'ෝ','au':'ෞ'};

function singlishToSinhala(text) {
    let output = ""; let i = 0;
    while (i < text.length) {
        let matchFound = false;
        let dual = text.substr(i, 2).toLowerCase(); let single = text.substr(i, 1).toLowerCase();

        if (i === 0 || text[i-1] === " " || text[i-1] === "\n") {
            if (vowels[dual]) { output += vowels[dual]; i += 2; matchFound = true; }
            else if (vowels[single]) { output += vowels[single]; i += 1; matchFound = true; }
        }
        if (matchFound) continue;

        let char = consonants[dual] ? dual : (consonants[single] ? single : null);
        if (char) {
            let sChar = consonants[char]; i += char.length;
            let nDual = text.substr(i, 2).toLowerCase(); let nSingle = text.substr(i, 1).toLowerCase();
            if (modifiers[nDual]) { output += sChar + modifiers[nDual]; i += 2; }
            else if (modifiers[nSingle] !== undefined) { output += sChar + modifiers[nSingle]; i += 1; }
            else { output += sChar + "්"; }
        } else { output += text[i]; i++; }
    }
    return output;
}

// --- 4. TRANSLATION API ---
async function handleTranslation(text) {
    if (!text.trim()) {
        out2.innerText = isReverseMode ? "Original text here..." : "English translation here...";
        return;
    }
    loader.classList.remove('hidden');
    out2.classList.add('processing');

    let sl = isReverseMode ? "en" : "si";
    let tl = isReverseMode ? "si" : "en";
    let query = isReverseMode ? text : out1.innerText;

    try {
        const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURI(query)}`);
        const data = await res.json();
        const result = data[0][0][0];
        out2.innerText = result;
        
        // Save to History
        saveToHistory(isReverseMode ? result : out1.innerText, isReverseMode ? text : result);
    } catch (e) {
        out2.innerText = "Translation Error...";
    } finally {
        loader.classList.add('hidden');
        out2.classList.remove('processing');
    }
}

// --- 5. EVENT LISTENERS ---
mainInput.addEventListener('input', () => {
    if (!isReverseMode) {
        out1.innerText = singlishToSinhala(mainInput.value) || "පරිවර්තනය මෙතන පෙන්වයි...";
    } else {
        out1.innerText = "Processing English...";
    }
    
    clearTimeout(window.t);
    window.t = setTimeout(() => handleTranslation(mainInput.value), 1000);
});

clearBtn.addEventListener('click', () => { 
    mainInput.value = ""; 
    out1.innerText = "පරිවර්තනය මෙතන පෙන්වයි..."; 
    out2.innerText = "Results will appear here..."; 
});

copyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const target = document.getElementById(btn.dataset.target).innerText;
        navigator.clipboard.writeText(target);
        const icon = btn.querySelector('i');
        icon.className = 'fa-solid fa-check';
        setTimeout(() => icon.className = 'fa-solid fa-copy', 2000);
    });
});

ttsBtn.addEventListener('click', () => {
    let textToSpeak = isReverseMode ? mainInput.value : out2.innerText;
    if (textToSpeak && !textToSpeak.includes("...")) {
        const speech = new SpeechSynthesisUtterance(textToSpeak);
        speech.lang = 'en-US'; 
        ttsBtn.style.color = "var(--primary-color)";
        window.speechSynthesis.speak(speech);
        speech.onend = () => ttsBtn.style.color = "#888";
    }
});

// --- 6. HISTORY LOGIC ---
let history = JSON.parse(localStorage.getItem('singli_history')) || [];
function saveToHistory(si, en) {
    if(!si || si.includes("...") || en.includes("...")) return;
    if(history[0] && history[0].si === si) return; // Prevent duplicates
    history.unshift({si, en}); 
    history = history.slice(0, 5);
    localStorage.setItem('singli_history', JSON.stringify(history));
    renderHistory();
}

function renderHistory() {
    const list = document.getElementById('history-list');
    if (history.length === 0) {
        list.innerHTML = '<p class="empty-msg">No recent history</p>';
        return;
    }
    list.innerHTML = history.map(i => `<div class="history-item"><span class="si-text">${i.si}</span><span class="en-text">${i.en}</span></div>`).join('');
}

document.getElementById('clear-history-btn').addEventListener('click', () => {
    if (confirm("Clear all recent history?")) {
        history = [];
        localStorage.removeItem('singli_history');
        renderHistory();
    }
});

// Init
renderHistory();