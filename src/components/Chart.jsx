import Chart from 'react-apexcharts';

export default function StockChart({ seriesData }) {
  if (!seriesData || seriesData.length === 0) return null;

  const options = {
    chart: { type: 'area', toolbar: { show: false }, background: 'transparent' },
    dataLabels: { enabled: false },
    colors: ['#3b82f6'],
    stroke: { curve: 'smooth', width: 2 },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05 } },
    grid: { borderColor: '#1e293b', strokeDashArray: 4 },
    xaxis: { 
      categories: seriesData.map(d => d.x),
      tickAmount: 6, // 🚀 Apenas 6 horários para não poluir
      labels: { style: { colors: '#64748b', fontSize: '10px' } },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: { labels: { style: { colors: '#64748b' }, formatter: (v) => v.toFixed(2) } },
    theme: { mode: 'dark' },
    tooltip: { theme: 'dark', x: { show: true } }
  };

  const series = [{ name: 'Preço', data: seriesData.map(d => d.y) }];

  return <Chart options={options} series={series} type="area" height="100%" width="100%" />;
}