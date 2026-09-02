<template>
    <Teleport to="body">
        <Transition name="modal">
            <div v-if="isOpen" class="image-modal-overlay" @click="handleClose">
                <div class="image-modal-content" @click.stop>
                    <button class="close-button" @click="handleClose" aria-label="Close">
                        ×
                    </button>
                    <img :src="imageUrl" :alt="altText" class="enlarged-image" />
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
import { watch } from 'vue'

interface Props {
    imageUrl: string
    altText: string
    isOpen: boolean
}

interface Emits {
    (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

function handleClose() {
    emit('close')
}

// Close on Escape key
function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
        handleClose()
    }
}

// Add/remove event listener for Escape key
watch(
    () => props.isOpen,
    (isOpen) => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeydown)
            document.body.style.overflow = 'hidden'
        } else {
            document.removeEventListener('keydown', handleKeydown)
            document.body.style.overflow = ''
        }
    }
)
</script>

<style scoped>
.image-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    padding: 1rem;
}

.image-modal-content {
    position: relative;
    max-width: 90vw;
    max-height: 90vh;
    display: flex;
    align-items: center;
    justify-content: center;
}

.enlarged-image {
    max-width: 100%;
    max-height: 90vh;
    object-fit: contain;
    border-radius: 8px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
}

.close-button {
    position: absolute;
    top: -3rem;
    right: 0;
    background: rgba(255, 255, 255, 0.9);
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    font-size: 28px;
    line-height: 1;
    cursor: pointer;
    color: #333;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
}

.close-button:hover {
    background: white;
    transform: scale(1.1);
}

/* Transition animations */
.modal-enter-active,
.modal-leave-active {
    transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
    opacity: 0;
}

.modal-enter-active .image-modal-content,
.modal-leave-active .image-modal-content {
    transition: transform 0.3s ease;
}

.modal-enter-from .image-modal-content,
.modal-leave-to .image-modal-content {
    transform: scale(0.9);
}
</style>
