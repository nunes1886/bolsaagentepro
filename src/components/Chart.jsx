import Chart from 'react-apexcharts';

export default function StockChart({ seriesData }) {
  const options = {
    chart: { type: 'area', toolbar: { show: false }, background: 'transparent' },
    colors: ['#3b82f6'],
    stroke: { curve: 'smooth', width: 2 },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.1 } },
    grid: { borderColor: '#1e293b' },
    xaxis: { 
      categories: seriesData.map(d => d.x),
      labels: { style: { colors: '#64748b' } } 
    },
    yaxis: { labels: { style: { colors: '#64748b' } } },
    theme: { mode: 'dark' },
    tooltip: { theme: 'dark' }
  };

  const series = [{ name: 'Preço', data: seriesData.map(d => d.y) }];

  return <Chart options={options} series={series} type="area" height="100%" width="100%" />;
}