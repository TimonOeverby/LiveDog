<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { getComments, addComment, deleteComment } from '../services/likes'
import { deleteAdminComment } from '../services/admin'

interface Comment {
    id: string
    content: string
    createdAt: string
    user: {
        id: string
        username?: string
        email: string
        imageUrl?: string
    }
}

const props = defineProps<{
    competitionId: string
    dogId: string
    dogName: string
}>()

const authStore = useAuthStore()
const comments = ref<Comment[]>([])
const newComment = ref('')
const loading = ref(false)
const submitting = ref(false)
const error = ref('')
const expanded = ref(false)

const canComment = computed(() => authStore.isAuthenticated && newComment.value.trim().length > 0)

function canRemoveComment(comment: Comment) {
    return authStore.user?.id === comment.user.id || authStore.isAdmin
}

async function loadComments() {
    loading.value = true
    try {
        const data = await getComments(props.competitionId, props.dogId)
        comments.value = data.comments
    } catch (err) {
        console.error('Failed to load comments:', err)
    } finally {
        loading.value = false
    }
}

async function submitComment() {
    if (!canComment.value) return

    submitting.value = true
    error.value = ''

    try {
        const data = await addComment(props.competitionId, props.dogId, newComment.value.trim())
        comments.value.unshift(data.comment)
        newComment.value = ''
    } catch (err: any) {
        error.value = err.response?.data?.error || 'Kunne ikke legge til kommentar'
    } finally {
        submitting.value = false
    }
}

async function removeComment(commentId: string) {
    if (!confirm('Slett denne kommentaren?')) return

    try {
        if (authStore.isAdmin) {
            await deleteAdminComment(commentId)
        } else {
            await deleteComment(props.competitionId, commentId)
        }
        comments.value = comments.value.filter((c) => c.id !== commentId)
    } catch (err: any) {
        error.value = err.response?.data?.error || 'Kunne ikke slette kommentar'
    }
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('no-NO', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    })
}

function toggleExpand() {
    expanded.value = !expanded.value
    if (expanded.value && comments.value.length === 0) {
        loadComments()
    }
}

onMounted(() => {
    // Load comments count initially
    loadComments()
})
</script>

<template>
    <div class="comment-section">
        <button @click="toggleExpand" class="toggle-btn">
            <span>💬</span>
            <span>Kommentarer ({{ comments.length }})</span>
            <span class="dog-context">for {{ dogName }}</span>
        </button>

        <div v-if="expanded" class="comments-container">
            <p class="comments-title">Kommentarer til {{ dogName }}</p>
            <div v-if="loading" class="loading">Laster...</div>

            <div v-else class="comments-list">
                <div v-for="comment in comments" :key="comment.id" class="comment">
                    <div class="comment-header">
                        <span class="author">{{
                            comment.user.username || comment.user.email.split('@')[0]
                        }}</span>
                        <span class="date">{{ formatDate(comment.createdAt) }}</span>
                    </div>
                    <p class="content">{{ comment.content }}</p>
                    <button
                        v-if="canRemoveComment(comment)"
                        @click="removeComment(comment.id)"
                        class="delete-btn"
                    >
                        Slett
                    </button>
                </div>

                <p v-if="comments.length === 0" class="no-comments">Ingen kommentarer ennå</p>
            </div>

            <div v-if="authStore.isAuthenticated" class="add-comment">
                <textarea
                    v-model="newComment"
                    placeholder="Skriv en kommentar..."
                    rows="2"
                    maxlength="500"
                ></textarea>
                <div class="comment-actions">
                    <span class="char-count">{{ newComment.length }}/500</span>
                    <button
                        @click="submitComment"
                        :disabled="!canComment || submitting"
                        class="submit-btn"
                    >
                        {{ submitting ? 'Sender...' : 'Send' }}
                    </button>
                </div>
                <p v-if="error" class="error">{{ error }}</p>
            </div>

            <p v-else class="login-prompt">Logg inn for å kommentere</p>
        </div>
    </div>
</template>

<style scoped>
.comment-section {
    margin: 0;
    flex: 1;
    min-width: 260px;
}

.toggle-btn {
    display: inline-flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.375rem;
    padding: 0.375rem 0.75rem;
    background: var(--bg-white);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
    cursor: pointer;
    font-size: 0.875rem;
    color: var(--text-secondary);
}

.toggle-btn:hover {
    background: var(--bg-primary);
}

.dog-context {
    color: var(--text-muted);
    font-size: 0.8125rem;
}

.comments-container {
    margin-top: var(--space-sm);
    padding: var(--space-sm);
    background: var(--bg-white);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
}

.comments-title {
    margin: 0 0 var(--space-xs);
    font-weight: 600;
    font-size: 0.875rem;
}

.loading {
    text-align: center;
    color: var(--text-muted);
    font-size: 0.875rem;
}

.comments-list {
    display: grid;
    gap: var(--space-sm);
    margin-bottom: var(--space-sm);
    max-height: 300px;
    overflow-y: auto;
}

.comment {
    padding: var(--space-sm);
    background: var(--bg-primary);
    border-radius: var(--radius-md);
}

.comment-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.25rem;
}

.author {
    font-weight: 500;
    font-size: 0.875rem;
    color: var(--text-primary);
}

.date {
    font-size: 0.75rem;
    color: var(--text-muted);
}

.content {
    margin: 0;
    font-size: 0.875rem;
    color: var(--text-secondary);
    word-break: break-word;
}

.delete-btn {
    margin-top: 0.5rem;
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    background: var(--error-bg);
    color: var(--error);
    border: none;
    border-radius: var(--radius-sm);
    cursor: pointer;
}

.delete-btn:hover {
    background: var(--error);
    color: white;
}

.no-comments {
    text-align: center;
    color: var(--text-muted);
    font-size: 0.875rem;
    font-style: italic;
}

.add-comment {
    padding-top: var(--space-sm);
    border-top: 1px solid var(--border-light);
}

.add-comment textarea {
    width: 100%;
    resize: vertical;
    margin-bottom: var(--space-xs);
}

.comment-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.char-count {
    font-size: 0.75rem;
    color: var(--text-muted);
}

.submit-btn {
    padding: 0.375rem 0.75rem;
    background: var(--accent);
    color: white;
    border: none;
    border-radius: var(--radius-md);
    font-size: 0.875rem;
    cursor: pointer;
}

.submit-btn:hover:not(:disabled) {
    background: var(--accent-hover);
}

.submit-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.error {
    font-size: 0.75rem;
    color: var(--error);
    margin-top: 0.25rem;
}

.login-prompt {
    text-align: center;
    font-size: 0.875rem;
    color: var(--text-muted);
    padding: var(--space-sm);
}
</style>
