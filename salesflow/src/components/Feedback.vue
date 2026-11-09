<script setup lang="ts">
// Bridges store.notify() to Naive UI messages, so pure modules can give feedback without
// importing UI code. Lives inside NMessageProvider.
import { watch } from 'vue'
import { useMessage } from 'naive-ui'
import { toast } from '../store'

const message = useMessage()
watch(() => toast.seq, () => message[toast.kind](toast.text, { duration: toast.kind === 'success' ? 3000 : 4500, keepAliveOnHover: true }))
</script>
<template><span hidden /></template>
