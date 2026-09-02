<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()

const currentPassword = ref('')
const newEmail = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const errorMsg = ref('')
const successMsg = ref('')
const isLoading = ref(false)

const handleSubmit = async () => {
    errorMsg.value = ''
    successMsg.value = ''

    if (newPassword.value && newPassword.value !== confirmPassword.value) {
        errorMsg.value = 'Passordene stemmer ikke med det nye passordet'
        return
    }

    if (!newEmail.value && !newPassword.value) {
        errorMsg.value = 'Fyll inn ny e-post og/eller nytt passord'
        return
    }

    isLoading.value = true
    try {
        const res = await fetch(
            `http://localhost:3000/api/users/${authStore.user?.id}/credentials`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${authStore.token}`
                },
                body: JSON.stringify({
                    currentPassword: currentPassword.value,
                    newEmail: newEmail.value || undefined,
                    newPassword: newPassword.value || undefined
                })
            }
        )

        const data = await res.json()
        if (!res.ok) {
            errorMsg.value = data.error || 'Noe gikk galt'
            return
        }

        // update email in auth store if it changed
        if (newEmail.value && authStore.user) {
            authStore.user.email = data.user.email
        }

        successMsg.value = 'Endringer lagret!'
        currentPassword.value = ''
        newEmail.value = ''
        newPassword.value = ''
        confirmPassword.value = ''
    } catch {
        errorMsg.value = 'Noe gikk galt'
    } finally {
        isLoading.value = false
    }
}
</script>

<template>
    <div class="credentials">
        <div class="credentials-header">
            <h2>Endre innloggingsinfo</h2>
            <p>Oppdater e-post eller passord. Nåværende passord kreves.</p>
        </div>

        <form class="card" @submit.prevent="handleSubmit">
            <div class="form-group">
                <label for="currentPassword">Nåværende passord:</label>
                <input id="currentPassword" v-model="currentPassword" type="password" required />
            </div>

            <hr />

            <div class="form-group">
                <label for="newEmail">Ny e-post (valgfritt):</label>
                <input
                    id="newEmail"
                    v-model="newEmail"
                    type="email"
                    :placeholder="authStore.user?.email"
                />
            </div>

            <div class="form-group">
                <label for="newPassword">Nytt passord (valgfritt):</label>
                <input id="newPassword" v-model="newPassword" type="password" />
            </div>

            <div class="form-group">
                <label for="confirmPassword">Bekreft nytt passord:</label>
                <input id="confirmPassword" v-model="confirmPassword" type="password" />
            </div>

            <p v-if="successMsg" class="success-text">{{ successMsg }}</p>
            <p v-if="errorMsg" class="error-text">{{ errorMsg }}</p>

            <button type="submit" class="btn-primary" :disabled="isLoading || !currentPassword">
                {{ isLoading ? 'Lagrer...' : 'Lagre endringer' }}
            </button>
        </form>
    </div>
</template>

<style scoped>
.credentials {
    max-width: 460px;
    margin: var(--space-xl) auto 0;
    padding: var(--space-sm);
}

.credentials-header {
    text-align: center;
    margin-bottom: 0.8rem;
}

.credentials-header p {
    margin-top: 0.35rem;
    color: var(--text-muted);
    font-size: 0.93rem;
}

h2 {
    margin-bottom: 0.1rem;
}

form {
    padding: var(--space-lg);
}

hr {
    border: none;
    border-top: 1px solid var(--border);
    margin: var(--space-sm) 0;
}

.form-group {
    margin-bottom: var(--space-sm);
}

button {
    width: 100%;
    margin-top: var(--space-xs);
}

.success-text {
    background: var(--success-bg);
    color: var(--success);
    border: 1px solid color-mix(in srgb, var(--success) 25%, transparent);
    border-radius: var(--radius-md);
    padding: 0.62rem 0.75rem;
    font-size: 0.88rem;
    margin-bottom: var(--space-sm);
}

.error-text {
    background: var(--error-bg);
    color: var(--error);
    border: 1px solid color-mix(in srgb, var(--error) 25%, transparent);
    border-radius: var(--radius-md);
    padding: 0.62rem 0.75rem;
    font-size: 0.88rem;
    margin-bottom: var(--space-sm);
}
</style>
