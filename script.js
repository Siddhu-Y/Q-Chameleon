// Chat Lobby Application
class ChatLobby {
    constructor() {
        this.currentUser = {
            username: 'Guest',
            id: this.generateId()
        };
        this.currentRoom = null;
        this.rooms = new Map();
        this.initializeEventListeners();
        this.loadUsername();
        this.showUsernameModal();
    }

    // Generate unique ID
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    // Generate room code
    generateRoomCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    // Initialize event listeners
    initializeEventListeners() {
        // Username modal
        document.getElementById('change-username-btn').addEventListener('click', () => {
            this.showUsernameModal();
        });

        document.getElementById('save-username-btn').addEventListener('click', () => {
            this.saveUsername();
        });

        document.getElementById('username-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.saveUsername();
            }
        });

        // Create room modal
        document.getElementById('create-room-btn').addEventListener('click', () => {
            this.showCreateRoomModal();
        });

        document.getElementById('confirm-create-room-btn').addEventListener('click', () => {
            this.createRoom();
        });

        document.getElementById('cancel-create-room-btn').addEventListener('click', () => {
            this.hideCreateRoomModal();
        });

        document.getElementById('new-room-name').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.createRoom();
            }
        });

        // Join room
        document.getElementById('join-room-btn').addEventListener('click', () => {
            this.joinRoomByCode();
        });

        document.getElementById('room-code-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.joinRoomByCode();
            }
        });

        // Chat functionality
        document.getElementById('send-message-btn').addEventListener('click', () => {
            this.sendMessage();
        });

        document.getElementById('message-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // Leave room
        document.getElementById('leave-room-btn').addEventListener('click', () => {
            this.leaveRoom();
        });

        // Copy room code
        document.getElementById('copy-room-code-btn').addEventListener('click', () => {
            this.copyRoomCode();
        });

        // Close modals on outside click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.hideAllModals();
            }
        });
    }

    // Username management
    showUsernameModal() {
        document.getElementById('username-modal').classList.add('active');
        document.getElementById('username-input').value = this.currentUser.username;
        document.getElementById('username-input').focus();
    }

    hideUsernameModal() {
        document.getElementById('username-modal').classList.remove('active');
    }

    saveUsername() {
        const username = document.getElementById('username-input').value.trim();
        if (username && username.length >= 2) {
            this.currentUser.username = username;
            document.getElementById('username-display').textContent = username;
            this.saveUsernameToStorage();
            this.hideUsernameModal();
            this.showToast('Username updated!', 'success');
        } else {
            this.showToast('Username must be at least 2 characters long', 'error');
        }
    }

    loadUsername() {
        const savedUsername = localStorage.getItem('chatLobbyUsername');
        if (savedUsername) {
            this.currentUser.username = savedUsername;
            document.getElementById('username-display').textContent = savedUsername;
        }
    }

    saveUsernameToStorage() {
        localStorage.setItem('chatLobbyUsername', this.currentUser.username);
    }

    // Room creation
    showCreateRoomModal() {
        document.getElementById('create-room-modal').classList.add('active');
        document.getElementById('new-room-name').value = '';
        document.getElementById('new-room-name').focus();
    }

    hideCreateRoomModal() {
        document.getElementById('create-room-modal').classList.remove('active');
    }

    createRoom() {
        const roomName = document.getElementById('new-room-name').value.trim();
        if (!roomName) {
            this.showToast('Please enter a room name', 'error');
            return;
        }

        const privacy = document.querySelector('input[name="room-privacy"]:checked').value;
        const roomCode = this.generateRoomCode();
        const room = {
            id: this.generateId(),
            name: roomName,
            code: roomCode,
            privacy: privacy, // 'private' or 'public'
            host: this.currentUser,
            participants: [this.currentUser],
            messages: [],
            createdAt: new Date()
        };

        this.rooms.set(room.id, room);
        this.hideCreateRoomModal();
        this.joinRoom(room);
        
        const privacyText = privacy === 'private' ? 'private' : 'public';
        this.showToast(`${privacyText.charAt(0).toUpperCase() + privacyText.slice(1)} room "${roomName}" created!`, 'success');
    }

    // Room joining
    joinRoomByCode() {
        const roomCode = document.getElementById('room-code-input').value.trim().toUpperCase();
        if (!roomCode) {
            this.showToast('Please enter a room code', 'error');
            return;
        }

        // Search both public and private rooms by code
        const room = Array.from(this.rooms.values()).find(r => r.code === roomCode);
        if (room) {
            this.joinRoom(room);
            document.getElementById('room-code-input').value = '';
            const privacyText = room.privacy === 'private' ? 'private' : 'public';
            this.showToast(`Joined ${privacyText} room "${room.name}"`, 'success');
        } else {
            this.showToast('Room not found. Please check the room code.', 'error');
        }
    }

    joinRoom(room) {
        // Add user to room if not already present
        if (!room.participants.find(p => p.id === this.currentUser.id)) {
            room.participants.push(this.currentUser);
        }

        this.currentRoom = room;
        this.showChatView();
        this.updateRoomDisplay();
        this.loadRoomMessages();
    }

    leaveRoom() {
        if (this.currentRoom) {
            // Remove user from room participants
            this.currentRoom.participants = this.currentRoom.participants.filter(
                p => p.id !== this.currentUser.id
            );

            // If no participants left, remove the room
            if (this.currentRoom.participants.length === 0) {
                this.rooms.delete(this.currentRoom.id);
            }

            this.currentRoom = null;
            this.showLobbyView();
            this.updateRoomsDisplay();
            this.showToast('Left the room', 'info');
        }
    }

    // View management
    showLobbyView() {
        document.getElementById('lobby-view').classList.add('active');
        document.getElementById('chat-view').classList.remove('active');
        this.updateRoomsDisplay();
    }

    showChatView() {
        document.getElementById('lobby-view').classList.remove('active');
        document.getElementById('chat-view').classList.add('active');
    }

    // Room display updates
    updateRoomsDisplay() {
        const roomsGrid = document.getElementById('rooms-grid');
        const rooms = Array.from(this.rooms.values());
        
        // Only show public rooms in the lobby
        const publicRooms = rooms.filter(room => room.privacy === 'public');

        if (publicRooms.length === 0) {
            roomsGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-door-open"></i>
                    <h3>No public rooms available</h3>
                    <p>Create a new room to get started!</p>
                </div>
            `;
            return;
        }

        roomsGrid.innerHTML = publicRooms.map(room => `
            <div class="room-card" onclick="chatLobby.joinRoom(chatLobby.rooms.get('${room.id}'))">
                <div class="room-header">
                    <div>
                        <div class="room-name">${this.escapeHtml(room.name)}</div>
                        <div class="room-code">#${room.code}</div>
                        <div class="room-privacy ${room.privacy}">
                            <i class="fas fa-${room.privacy === 'private' ? 'lock' : 'globe'}"></i>
                            ${room.privacy === 'private' ? 'Private' : 'Public'} Room
                        </div>
                    </div>
                </div>
                <div class="room-host">
                    <i class="fas fa-crown"></i>
                    Hosted by ${this.escapeHtml(room.host.username)}
                </div>
                <div class="room-stats">
                    <span><i class="fas fa-users"></i> ${room.participants.length} participant${room.participants.length !== 1 ? 's' : ''}</span>
                    <span><i class="fas fa-clock"></i> ${this.formatTime(room.createdAt)}</span>
                </div>
            </div>
        `).join('');
    }

    updateRoomDisplay() {
        if (!this.currentRoom) return;

        document.getElementById('room-name').textContent = this.currentRoom.name;
        document.getElementById('room-code-display').textContent = `#${this.currentRoom.code}`;
        document.getElementById('participant-count').textContent = 
            `${this.currentRoom.participants.length} participant${this.currentRoom.participants.length !== 1 ? 's' : ''}`;
            
        // Update room privacy indicator in chat header
        const roomInfo = document.querySelector('.room-info');
        let privacyIndicator = roomInfo.querySelector('.room-privacy-indicator');
        if (!privacyIndicator) {
            privacyIndicator = document.createElement('div');
            privacyIndicator.className = 'room-privacy-indicator';
            roomInfo.appendChild(privacyIndicator);
        }
        
        privacyIndicator.innerHTML = `
            <i class="fas fa-${this.currentRoom.privacy === 'private' ? 'lock' : 'globe'}"></i>
            ${this.currentRoom.privacy === 'private' ? 'Private' : 'Public'} Room
        `;
        privacyIndicator.className = `room-privacy-indicator ${this.currentRoom.privacy}`;
    }

    // Chat functionality
    sendMessage() {
        const messageInput = document.getElementById('message-input');
        const message = messageInput.value.trim();

        if (!message || !this.currentRoom) return;

        const chatMessage = {
            id: this.generateId(),
            content: message,
            username: this.currentUser.username,
            userId: this.currentUser.id,
            timestamp: new Date(),
            isOwn: true
        };

        this.currentRoom.messages.push(chatMessage);
        this.addMessageToChat(chatMessage);
        messageInput.value = '';
    }

    addMessageToChat(message) {
        const messagesContainer = document.getElementById('chat-messages');
        const messageElement = this.createMessageElement(message);
        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    createMessageElement(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.isOwn ? 'own' : 'other'}`;
        
        const timeString = message.timestamp.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });

        messageDiv.innerHTML = `
            <div class="message-header">
                <span class="message-username">${this.escapeHtml(message.username)}</span>
                <span class="message-time">${timeString}</span>
            </div>
            <div class="message-content">${this.escapeHtml(message.content)}</div>
        `;

        return messageDiv;
    }

    loadRoomMessages() {
        const messagesContainer = document.getElementById('chat-messages');
        messagesContainer.innerHTML = '';

        if (this.currentRoom && this.currentRoom.messages) {
            this.currentRoom.messages.forEach(message => {
                this.addMessageToChat(message);
            });
        }
    }

    // In a real app, this would handle message delivery from a server
    // For now, messages are only stored locally

    // Utility functions
    copyRoomCode() {
        if (this.currentRoom) {
            navigator.clipboard.writeText(this.currentRoom.code).then(() => {
                this.showToast('Room code copied to clipboard!', 'success');
            }).catch(() => {
                this.showToast('Failed to copy room code', 'error');
            });
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatTime(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    }

    hideAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        toastContainer.appendChild(toast);

        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 100);

        // Remove toast after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize the application
let chatLobby;
document.addEventListener('DOMContentLoaded', () => {
    chatLobby = new ChatLobby();
});

// Initialize with empty rooms - users will create their own rooms
