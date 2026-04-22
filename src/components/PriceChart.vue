<script setup lang="ts">
import { computed } from 'vue';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler,
} from 'chart.js';
import { Line } from 'vue-chartjs';

ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale, Filler);

const props = defineProps<{
  points: { date: string; close: number }[];
  label?: string;
  color?: string;
}>();

const chartData = computed(() => {
  const color = props.color || '#818cf8';
  return {
    labels: props.points.map((p) => p.date),
    datasets: [
      {
        label: props.label || 'Price',
        data: props.points.map((p) => p.close),
        borderColor: color,
        backgroundColor: color + '22',
        fill: true,
        tension: 0.25,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
      },
    ],
  };
});

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { mode: 'index' as const, intersect: false },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#58637a', maxTicksLimit: 8 },
    },
    y: {
      grid: { color: 'rgba(88, 99, 122, 0.15)' },
      ticks: {
        color: '#58637a',
        callback: (value: any) => `$${Number(value).toFixed(0)}`,
      },
    },
  },
  interaction: { mode: 'nearest' as const, axis: 'x' as const, intersect: false },
}));
</script>

<template>
  <div style="height: 320px; position: relative">
    <Line :data="chartData" :options="chartOptions" />
  </div>
</template>
