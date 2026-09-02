<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const errorMsg = ref('')
const successMsg = ref('')
const isLoading = ref(false)

const handleLogin = async () => {
    errorMsg.value = ''
    successMsg.value = ''
    isLoading.value = true

    try {
        await authStore.login(email.value, password.value)
        successMsg.value = authStore.message || 'Innlogging vellykket!'

        // Redirect after showing success message
        setTimeout(() => {
            router.push('/')
        }, 1500)
    } catch (err: any) {
        errorMsg.value = authStore.message || err.message
    } finally {
        isLoading.value = false
    }
}
</script>

<template>
    <div class="login">
        <div class="login-header">
            <h2>Logg inn</h2>
            <p>Velkommen tilbake. Logg inn for å administrere hunder og konkurranser.</p>
        </div>

        <form class="card" @submit.prevent="handleLogin">
            <div class="form-group">
                <label for="email">E-post:</label>
                <input id="email" v-model="email" type="email" required />
            </div>
            <div class="form-group">
                <label for="password">Passord:</label>
                <input id="password" v-model="password" type="password" required />
            </div>

            <p v-if="successMsg" class="success-text">{{ successMsg }}</p>
            <p v-if="errorMsg" class="error-text">{{ errorMsg }}</p>

            <button type="submit" class="btn-primary" :disabled="isLoading">
                {{ isLoading ? 'Logger inn...' : 'Logg inn' }}
            </button>
        </form>
        <RouterLink to="/register">Har du ikke konto? Registrer deg</RouterLink>
    </div>
</template>

<style scoped>
.login {
    max-width: 460px;
    margin: var(--space-xl) auto 0;
    padding: var(--space-sm);
}

.login-header {
    text-align: center;
    margin-bottom: 0.8rem;
}

.login-header p {
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

a {
    display: block;
    margin-top: 0.9rem;
    text-align: center;
    font-size: 0.9rem;
    font-weight: 600;
}
</style>
