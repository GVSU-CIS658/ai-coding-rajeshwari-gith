<script setup lang="ts">
import { computed } from 'vue';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'vue-chartjs';

ChartJS.register(ArcElement, Tooltip, Legend);

const props = defineProps<{
  slices: { label: string; value: number }[];
}>();

const palette = ['#818cf8', '#22d3ee', '#00c896', '#f59e0b', '#ff4560', '#a78bfa', '#f472b6', '#34d399'];

const chartData = computed(() => ({
  labels: props.slices.map((s) => s.label),
  datasets: [
    {
      data: props.slices.map((s) => s.value),
      backgroundColor: props.slices.map((_, i) => palette[i % palette.length]),
      borderColor: 'rgba(0,0,0,0.2)',
      borderWidth: 2,
    },
  ],
}));

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: '62%',
  plugins: {
    legend: {
      position: 'right' as const,
      labels: { color: '#dde4f0', padding: 12, font: { size: 12 } },
    },
    tooltip: {
      callbacks: {
        label: (ctx: any) => {
          const total = ctx.dataset.data.reduce((a: number, b: number) => a + b, 0);
          const pct = total ? ((ctx.raw / total) * 100).toFixed(1) : '0';
          return `${ctx.label}: $${Number(ctx.raw).toLocaleString('en-US', { maximumFractionDigits: 0 })} (${pct}%)`;
        },
      },
    },
  },
}));
</script>

<template>
  <div style="height: 280px; position: relative">
    <Doughnut :data="chartData" :options="chartOptions" />
  </div>
</template>
