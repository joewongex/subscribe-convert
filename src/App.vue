<template>
  <div class="min-h-screen bg-gray-800 text-white p-4 sm:p-6 lg:p-8">
    <div class="max-w-6xl mx-auto">
      <header class="text-center mb-8">
        <h1 class="text-4xl sm:text-5xl font-bold text-cyan-400">订阅转换器</h1>
        <p class="text-gray-400 mt-2">将订阅链接转换为 Mihomo (Clash.Meta) 配置</p>
      </header>

      <main class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- Input Panel -->
        <div class="flex flex-col">
          <label for="input-area" class="text-lg font-semibold mb-2">输入链接 (每行一个):</label>
          <textarea
            id="input-area"
            v-model="rawInput"
            placeholder="请在此处粘贴 vless, vmess, trojan, ss 链接..."
            class="flex-grow bg-gray-900 text-gray-200 rounded-lg p-4 border border-gray-700 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
          ></textarea>
        </div>

        <!-- Output Panel -->
        <div class="flex flex-col">
          <label for="output-area" class="text-lg font-semibold mb-2">输出结果 (JSON):</label>
          <div class="relative flex-grow">
            <pre
              id="output-area"
              class="h-full bg-gray-900 text-gray-200 rounded-lg p-4 border border-gray-700 overflow-auto"
            ><code>{{ formattedOutput }}</code></pre>
            <button
              v-if="formattedOutput"
              @click="copyOutput"
              class="absolute top-2 right-2 bg-gray-700 hover:bg-cyan-600 text-white font-bold py-1 px-3 rounded-lg text-sm"
            >
              {{ copyButtonText }}
            </button>
          </div>
        </div>
      </main>

      <footer class="text-center mt-8">
        <button
          @click="convert"
          class="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-8 rounded-lg text-lg transition-transform transform hover:scale-105"
        >
          转换
        </button>
        <button
          @click="clearAll"
          class="ml-4 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-8 rounded-lg text-lg"
        >
          清空
        </button>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { parse } from './core/parser';

const rawInput = ref('');
const outputProxies = ref([]);
const copyButtonText = ref('复制');

const formattedOutput = computed(() => {
  if (outputProxies.value.length === 0) {
    return '';
  }
  return JSON.stringify({ proxies: outputProxies.value }, null, 2);
});

function convert() {
  outputProxies.value = parse(rawInput.value);
}

function copyOutput() {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(formattedOutput.value).then(() => {
      copyButtonText.value = '已复制!';
      setTimeout(() => {
        copyButtonText.value = '复制';
      }, 2000);
    });
  }
}

function clearAll() {
  rawInput.value = '';
  outputProxies.value = [];
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
/* Using Tailwind CSS, so global styles are minimal. */
body {
  font-family: 'Inter', sans-serif;
}
</style>
