// --- 55GHADA STUDIOS: BÖRTE MESSENGER ---
const io = require('socket.io-client');

// Railway'e deploy ettikten sonra buraya kendi URL'ini yaz
// Örnek: "https://borte-messenger-server-production.up.railway.app"
const SERVER_URL = "https://BURAYA_RAILWAY_URL_YAZ";

const socket = io(SERVER_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000,
    timeout: 20000
});

let friends = JSON.parse(localStorage.getItem('bm_friends') || "[]");

// 1. BAĞLANTI DURUMU
socket.on('connect', () => {
    console.log("✅ Sunucuya bağlandı:", socket.id);
    const dbStatus = document.getElementById('db-status');
    if (dbStatus) {
        dbStatus.innerText = "Bulut: AKTİF ✓";
        dbStatus.style.color = "#22c55e";
    }
    const savedID = localStorage.getItem('borte_id');
    if (savedID) socket.emit('join_node', savedID);
});

socket.on('connect_error', (err) => {
    console.error("❌ Bağlantı hatası:", err.message);
    const dbStatus = document.getElementById('db-status');
    if (dbStatus) {
        dbStatus.innerText = "Bulut: BAĞLANIYOR...";
        dbStatus.style.color = "#f59e0b";
    }
});

socket.on('disconnect', (reason) => {
    console.log("🔌 Bağlantı kesildi:", reason);
    const dbStatus = document.getElementById('db-status');
    if (dbStatus) {
        dbStatus.innerText = "Bulut: KESİLDİ";
        dbStatus.style.color = "#ef4444";
    }
});

// 2. MESAJ ALMA
socket.on('receive_msg', (data) => {
    // Kendi mesajımızı tekrar gösterme
    const myID = localStorage.getItem('borte_id');
    if (data.sender === myID) return;

    const d = document.createElement('div');
    d.className = 'msg received';
    d.innerHTML = `<span class="sender-name">${data.sender}</span><br>${data.content}`;
    const chatFlow = document.getElementById('chatFlow');
    if (chatFlow) {
        chatFlow.appendChild(d);
        chatFlow.scrollTop = chatFlow.scrollHeight;
    }
});

// 3. EKRAN GEÇİŞ FONKSİYONU
function showApp(id) {
    const loginScreen = document.getElementById('login-screen');
    const mainApp = document.getElementById('main-app');

    if (loginScreen && mainApp) {
        loginScreen.style.display = 'none';
        mainApp.style.display = 'flex';
        document.getElementById('display-id').innerText = id;
        socket.emit('join_node', id);
    }
}

// 4. KAYIT
function register() {
    const nickInput = document.getElementById('nickInput');
    const nick = nickInput ? nickInput.value.trim() : '';

    if (!nick) {
        alert("Lütfen bir isim yaz!");
        return;
    }

    // Sadece harf, rakam ve alt çizgi kabul et
    if (!/^[a-zA-Z0-9_ğüşıöçĞÜŞİÖÇ]+$/.test(nick)) {
        alert("İsimde sadece harf ve rakam kullanabilirsin!");
        return;
    }

    const fullID = nick + "#" + Math.floor(1000 + Math.random() * 9000);
    localStorage.setItem('borte_id', fullID);
    showApp(fullID);
}

// 5. MESAJ GÖNDERME
function send() {
    const inp = document.getElementById('msgInput');
    const content = inp ? inp.value.trim() : '';
    const sender = localStorage.getItem('borte_id');
    const titleElem = document.getElementById('active-chat-title');
    const activeChat = titleElem ? titleElem.dataset.chatId : null;

    if (!content || !sender || !activeChat) return;

    socket.emit('send_msg', {
        nodeTag: activeChat,
        sender: sender,
        content: content
    });

    const d = document.createElement('div');
    d.className = 'msg sent';
    d.innerText = content;
    const chatFlow = document.getElementById('chatFlow');
    if (chatFlow) {
        chatFlow.appendChild(d);
        chatFlow.scrollTop = chatFlow.scrollHeight;
    }
    inp.value = '';
}

// 6. ARKADAŞ LİSTESİ
function renderFriends() {
    const container = document.getElementById('friend-list-container');
    if (!container) return;

    container.innerHTML = '';

    if (friends.length === 0) {
        container.innerHTML = '<div style="padding:20px;color:#444;font-size:12px;text-align:center;">Henüz arkadaş yok.<br>+ EKLE butonuna bas!</div>';
        return;
    }

    friends.forEach((f, index) => {
        const card = document.createElement('div');
        card.className = 'friend-card';
        card.innerHTML = `<span>${f}</span><button class="del-btn" onclick="removeFriend(event, ${index})">×</button>`;
        card.onclick = (e) => {
            if (e.target.classList.contains('del-btn')) return;
            const title = document.getElementById('active-chat-title');
            if (title) {
                title.innerText = "Sohbet: " + f;
                title.dataset.chatId = f;
            }
            // Aktif arkadaşı vurgula
            document.querySelectorAll('.friend-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            // Chat ekranını temizle
            const chatFlow = document.getElementById('chatFlow');
            if (chatFlow) chatFlow.innerHTML = '';
        };
        container.appendChild(card);
    });
}

function executeAdd() {
    const idInput = document.getElementById('friendIDInput');
    const id = idInput ? idInput.value.trim() : '';
    const myID = localStorage.getItem('borte_id');

    if (!id.includes('#')) {
        alert("Nick#1234 formatında gir!");
        return;
    }
    if (id === myID) {
        alert("Kendini ekleyemezsin!");
        return;
    }
    if (friends.includes(id)) {
        alert("Bu kişi zaten listende!");
        closeModal();
        return;
    }

    friends.push(id);
    localStorage.setItem('bm_friends', JSON.stringify(friends));
    renderFriends();
    closeModal();
    if (idInput) idInput.value = '';
}

function removeFriend(event, index) {
    event.stopPropagation();
    if (confirm("Arkadaşı listeden çıkarmak istiyor musun?")) {
        friends.splice(index, 1);
        localStorage.setItem('bm_friends', JSON.stringify(friends));
        renderFriends();
    }
}

function openAddModal() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.style.display = 'flex';
}

function closeModal() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.style.display = 'none';
}

// SAYFA YÜKLENDİĞİNDE
window.onload = () => {
    const savedID = localStorage.getItem('borte_id');
    if (savedID) showApp(savedID);
    renderFriends();
};

// Enter tuşuyla arkadaş ekleme
document.addEventListener('keydown', (e) => {
    const overlay = document.getElementById('modal-overlay');
    if (overlay && overlay.style.display === 'flex' && e.key === 'Enter') {
        executeAdd();
    }
});

// Fonksiyonları dışarıya aç
window.register = register;
window.send = send;
window.openAddModal = openAddModal;
window.closeModal = closeModal;
window.executeAdd = executeAdd;
window.removeFriend = removeFriend;
