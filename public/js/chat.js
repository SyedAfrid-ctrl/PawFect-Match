document.addEventListener('DOMContentLoaded', async () => {
    const chatContainer = document.getElementById('chatContainer');
    const messageInput = document.getElementById('messageInput');
    const chatForm = document.getElementById('chatForm');

    const userId = new URLSearchParams(window.location.search).get('user');
    const currentUserId = localStorage.getItem('userId');

    if (!userId || !currentUserId) {
        chatContainer.innerHTML = '<p class="text-red-600">Invalid chat session.</p>';
        return;
    }

    async function fetchMessages() {
        try {
            const res = await fetch(`/api/chat/${userId}`);
            const messages = await res.json();

            chatContainer.innerHTML = messages.map(msg => `
                <div class="${msg.sender === currentUserId ? 'text-right' : 'text-left'} mb-2">
                    <span class="inline-block px-4 py-2 rounded-lg ${msg.sender === currentUserId ? 'bg-primary text-white' : 'bg-gray-200 text-gray-800'}">
                        ${msg.content}
                    </span>
                </div>
            `).join('');
        } catch (error) {
            chatContainer.innerHTML = '<p class="text-red-600">Failed to load messages.</p>';
        }
    }

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const content = messageInput.value.trim();
        if (!content) return;

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ receiver: userId, content })
            });

            if (res.ok) {
                messageInput.value = '';
                fetchMessages();
            } else {
                alert('Failed to send message.');
            }
        } catch (error) {
            alert('Server error. Please try again later.');
        }
    });

    fetchMessages();
});
