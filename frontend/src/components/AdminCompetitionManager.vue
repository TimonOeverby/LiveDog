<template>
    <div class="admin-competition-manager">
        <div class="admin-header">
            <h3>Admin - Konkurranseadministrasjon</h3>
            <button class="toggle-btn" @click="showCreateForm = !showCreateForm">
                {{ showCreateForm ? 'Skjul skjema' : 'Opprett ny konkurranse' }}
            </button>
        </div>

        <!-- CREATE COMPETITION FORM -->
        <div v-if="showCreateForm" class="create-form">
            <h4>Opprett ny konkurranse</h4>
            <form @submit.prevent="handleCreateCompetition">
                <div class="form-group">
                    <label for="name">Konkurransenavn *</label>
                    <input
                        id="name"
                        v-model="formData.name"
                        type="text"
                        required
                        placeholder="F.eks. NM i Hundedans 2026"
                    />
                </div>

                <div class="form-group">
                    <label for="description">Beskrivelse *</label>
                    <textarea
                        id="description"
                        v-model="formData.description"
                        required
                        placeholder="Beskriv konkurransen..."
                        rows="3"
                    ></textarea>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="startDate">Startdato og tid *</label>
                        <input
                            id="startDate"
                            v-model="formData.startDate"
                            type="datetime-local"
                            required
                        />
                    </div>

                    <div class="form-group">
                        <label for="endDate">Sluttdato og tid *</label>
                        <input
                            id="endDate"
                            v-model="formData.endDate"
                            type="datetime-local"
                            required
                        />
                    </div>
                </div>

                <div class="form-actions">
                    <button type="submit" :disabled="isSubmitting" class="submit-btn">
                        {{ isSubmitting ? 'Oppretter...' : 'Opprett konkurranse' }}
                    </button>
                    <button type="button" @click="resetForm" class="cancel-btn">Avbryt</button>
                </div>
            </form>

            <div v-if="error" class="error-message">
                {{ error }}
            </div>
            <div v-if="success" class="success-message">
                {{ success }}
            </div>
        </div>

        <!-- EDIT COMPETITION SECTION -->
        <div v-if="editingCompetition" class="edit-form">
            <h4>Rediger konkurranse</h4>
            <form @submit.prevent="handleUpdateCompetition">
                <div class="form-group">
                    <label for="edit-name">Konkurransenavn *</label>
                    <input id="edit-name" v-model="editFormData.name" type="text" required />
                </div>

                <div class="form-group">
                    <label for="edit-description">Beskrivelse *</label>
                    <textarea
                        id="edit-description"
                        v-model="editFormData.description"
                        required
                        rows="3"
                    ></textarea>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="edit-startDate">Startdato og tid *</label>
                        <input
                            id="edit-startDate"
                            v-model="editFormData.startDate"
                            type="datetime-local"
                            required
                        />
                    </div>

                    <div class="form-group">
                        <label for="edit-endDate">Sluttdato og tid *</label>
                        <input
                            id="edit-endDate"
                            v-model="editFormData.endDate"
                            type="datetime-local"
                            required
                        />
                    </div>
                </div>

                <div class="form-group">
                    <label for="edit-status">Status</label>
                    <select id="edit-status" v-model="editFormData.status">
                        <option value="UPCOMING">Kommende</option>
                        <option value="ACTIVE">Aktiv</option>
                        <option value="COMPLETED">Avsluttet</option>
                    </select>
                </div>

                <div class="form-actions">
                    <button type="submit" :disabled="isEditing" class="submit-btn">
                        {{ isEditing ? 'Lagrer...' : 'Lagre endringer' }}
                    </button>
                    <button type="button" @click="cancelEdit" class="cancel-btn">Avbryt</button>
                </div>
            </form>
        </div>

        <!-- MANAGE COMPETITIONS SECTION -->
        <div class="manage-section">
            <h4>Administrer konkurranser</h4>
            <p class="warning">NB: Sletting kan ikke angres!</p>

            <div v-if="competitions.length === 0" class="no-competitions">
                Ingen konkurranser tilgjengelig for sletting.
            </div>

            <div v-else class="competition-list">
                <div
                    v-for="competition in competitions"
                    :key="competition.id"
                    class="competition-item"
                >
                    <div class="competition-info">
                        <h5>{{ competition.name }}</h5>
                        <p>{{ competition.description }}</p>
                        <p class="dates">
                            {{ formatDate(competition.startDate) }} –
                            {{ formatDate(competition.endDate) }}
                        </p>
                        <span
                            class="status"
                            :class="getCompetitionStatus(competition).toLowerCase()"
                        >
                            {{ getCompetitionStatus(competition) }}
                        </span>
                    </div>
                    <div class="action-buttons">
                        <button @click="startEdit(competition)" class="edit-btn">Rediger</button>
                        <button
                            @click="handleDeleteCompetition(competition)"
                            :disabled="isDeleting === competition.id"
                            class="delete-btn"
                        >
                            {{ isDeleting === competition.id ? 'Sletter...' : 'Slett' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Competition } from '@/types'
import { createCompetition, deleteCompetition, updateCompetition } from '@/services/competitions'

defineProps<{
    competitions: Competition[]
}>()

const emit = defineEmits<{
    competitionCreated: [competition: Competition]
    competitionDeleted: [id: string]
    competitionUpdated: [competition: Competition]
}>()

const showCreateForm = ref(false)
const isSubmitting = ref(false)
const isDeleting = ref<string | null>(null)
const isEditing = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)

const formData = ref({
    name: '',
    description: '',
    startDate: '',
    endDate: ''
})

// Edit form state
const editingCompetition = ref<Competition | null>(null)
const editFormData = ref({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'UPCOMING' as 'UPCOMING' | 'ACTIVE' | 'COMPLETED'
})

function startEdit(competition: Competition) {
    editingCompetition.value = competition
    editFormData.value = {
        name: competition.name,
        description: competition.description,
        startDate: formatDateTimeLocal(competition.startDate),
        endDate: formatDateTimeLocal(competition.endDate),
        status: competition.status
    }
    error.value = null
    success.value = null
}

function cancelEdit() {
    editingCompetition.value = null
    error.value = null
}

async function handleUpdateCompetition() {
    if (!editingCompetition.value || isEditing.value) return

    isEditing.value = true
    error.value = null
    success.value = null

    try {
        const updated = await updateCompetition(editingCompetition.value.id, {
            name: editFormData.value.name,
            description: editFormData.value.description,
            startDate: editFormData.value.startDate,
            endDate: editFormData.value.endDate,
            status: editFormData.value.status
        })
        success.value = `Konkurranse "${updated.name}" ble oppdatert!`
        emit('competitionUpdated', updated)
        editingCompetition.value = null
    } catch (err: any) {
        error.value = err.response?.data?.error || 'Kunne ikke oppdatere konkurranse'
    } finally {
        isEditing.value = false
    }
}

function formatDateTimeLocal(date: Date): string {
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
}

function resetForm() {
    formData.value = {
        name: '',
        description: '',
        startDate: '',
        endDate: ''
    }
    error.value = null
    success.value = null
    showCreateForm.value = false
}

async function handleCreateCompetition() {
    if (isSubmitting.value) return

    isSubmitting.value = true
    error.value = null
    success.value = null

    try {
        const competition = await createCompetition(formData.value)
        success.value = `Konkurranse "${competition.name}" ble opprettet!`
        emit('competitionCreated', competition)
        resetForm()
    } catch (err: any) {
        error.value = err.response?.data?.error || 'Kunne ikke opprette konkurranse'
    } finally {
        isSubmitting.value = false
    }
}

async function handleDeleteCompetition(competition: Competition) {
    if (isDeleting.value) return

    const confirmMessage = `Er du sikker på at du vil slette "${competition.name}"? Denne handlingen kan ikke angres.`

    if (!confirm(confirmMessage)) {
        return
    }

    isDeleting.value = competition.id
    error.value = null

    try {
        await deleteCompetition(competition.id)
        success.value = `Konkurranse "${competition.name}" ble slettet!`
        emit('competitionDeleted', competition.id)
    } catch (err: any) {
        error.value = err.response?.data?.error || 'Kunne ikke slette konkurranse'
    } finally {
        isDeleting.value = null
    }
}

function formatDate(date: Date): string {
    return date.toLocaleString('no-NO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

// Helper function to determine competition status based on dates
function getCompetitionStatus(competition: Competition): 'UPCOMING' | 'ACTIVE' | 'COMPLETED' {
    const now = new Date()
    const start = new Date(competition.startDate)
    const end = new Date(competition.endDate)

    if (now < start) {
        return 'UPCOMING'
    } else if (now >= start && now <= end) {
        return 'ACTIVE'
    } else {
        return 'COMPLETED'
    }
}
</script>

<style scoped>
.admin-competition-manager {
    background: var(--bg-white);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-lg);
    padding: var(--space-md);
    margin-top: var(--space-lg);
}

.admin-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-md);
}

.admin-header h3 {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
}

.toggle-btn {
    background: var(--accent);
    color: white;
}

.toggle-btn:hover {
    background: var(--accent-hover);
}

.create-form,
.edit-form {
    background: var(--bg-white);
    border-radius: var(--radius-md);
    padding: var(--space-md);
    margin-bottom: var(--space-md);
    border: 1px solid var(--border-light);
}

.form-group {
    margin-bottom: var(--space-sm);
}

.form-group label {
    display: block;
    margin-bottom: 0.375rem;
    font-weight: 500;
    color: var(--text-primary);
}

.form-group input,
.form-group textarea,
.form-group select {
    width: 100%;
}

.form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-sm);
}

.form-actions {
    display: flex;
    gap: var(--space-sm);
    margin-top: var(--space-md);
}

.submit-btn {
    background: var(--accent);
    color: white;
}

.submit-btn:hover:not(:disabled) {
    background: var(--accent-hover);
}

.cancel-btn {
    background: var(--bg-white);
    color: var(--text-secondary);
    border: 1px solid var(--border-medium);
}

.cancel-btn:hover {
    background: var(--bg-primary);
}

.error-message {
    composes: message message-error;
    margin-top: var(--space-sm);
}

.success-message {
    composes: message message-success;
    margin-top: var(--space-sm);
}

.manage-section {
    background: var(--bg-white);
    border-radius: var(--radius-md);
    padding: var(--space-md);
    border: 1px solid var(--border-light);
}

.warning {
    color: var(--warning);
    background: #fffbeb;
    border: 1px solid #fcd34d;
    border-radius: var(--radius-md);
    padding: var(--space-sm);
    margin-bottom: var(--space-sm);
    font-size: 0.875rem;
}

.no-competitions {
    color: var(--text-muted);
    font-style: italic;
}

.competition-list {
    display: grid;
    gap: var(--space-sm);
}

.competition-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-sm);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
    background: var(--bg-primary);
}

.competition-info {
    flex: 1;
}

.competition-info h5 {
    margin: 0 0 0.25rem 0;
    font-weight: 500;
}

.competition-info p {
    margin: 0.125rem 0;
    color: var(--text-secondary);
    font-size: 0.875rem;
}

.dates {
    font-size: 0.875rem;
    color: var(--text-muted);
}

.status {
    display: inline-block;
    padding: 0.125rem 0.5rem;
    border-radius: var(--radius-sm);
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: uppercase;
    margin-top: 0.25rem;
}

.status.upcoming {
    background: #e0e7ff;
    color: #4338ca;
}

.status.active {
    background: #dcfce7;
    color: #15803d;
}

.status.completed {
    background: #f3f4f6;
    color: #6b7280;
}

.action-buttons {
    display: flex;
    gap: 0.5rem;
    margin-left: var(--space-sm);
}

.edit-btn {
    background: var(--accent-light);
    color: var(--accent);
}

.edit-btn:hover {
    background: var(--accent);
    color: white;
}

.delete-btn {
    background: var(--error-bg);
    color: var(--error);
}

.delete-btn:hover:not(:disabled) {
    background: var(--error);
    color: white;
}

@media (max-width: 768px) {
    .form-row {
        grid-template-columns: 1fr;
    }

    .form-actions {
        flex-direction: column;
    }

    .competition-item {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-sm);
    }

    .action-buttons {
        margin-left: 0;
        width: 100%;
    }
}
</style>
