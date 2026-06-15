<template>
    <div
        class="task-dock-item-wrapper"
        :class="{
            'task-dock-item-wrapper--expanded': expanded,
            'task-dock-item-wrapper--collapsible': collapsible,
        }"
        @click="onClick"
    >
        <div class="task-dock-item-wrapper__header">
            <span>{{ label }}</span>
            <span v-if="collapsible">{{ expanded ? 'expanded' : 'shrunk' }}</span>
        </div>
        <div
            v-if="expanded"
            class="task-dock-item-wrapper__body"
        >
            <slot />
        </div>
    </div>
</template>

<script
    setup
    lang="ts"
>
const {
	label,
	expanded = false,
	collapsible = true,
} = defineProps<{
	label: string;
	expanded?: boolean;
	collapsible?: boolean;
}>();

const emit = defineEmits<{
	click: [];
}>();

function onClick() {
	if (!collapsible) return;
	emit('click');
}
</script>

<style scoped>
.task-dock-item-wrapper {
    width: 200px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid red;
}

.task-dock-item-wrapper--collapsible {
    cursor: pointer;
}

.task-dock-item-wrapper__header {
    display: flex;
}

.task-dock-item-wrapper__body {
    flex: 1;
    overflow: auto;
}
</style>
