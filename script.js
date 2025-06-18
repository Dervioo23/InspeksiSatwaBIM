const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxhMg1knG3BJw7uWtfV4XuMxZ5_FGFK1htYYU2DsV4AcZBdtvFvMurqBQslp7L7IuTrjQ/exec';

const form = document.getElementById('laporanForm');
const successMsg = document.getElementById('successMsg');
const searchInput = document.getElementById('searchInput');
const refreshButton = document.getElementById('refreshButton');
const downloadExcelButton = document.getElementById('downloadExcel');
const tabelDataContainer = document.getElementById('tabelData');
const chartContainer = document.getElementById('chartContainer');

let animalChartInstance;

// Fungsi untuk mengirim data laporan (POST)
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  successMsg.className = 'mt-4 text-center font-medium text-sm text-blue-600';
  successMsg.textContent = '⏳ Mengirim laporan...';

  const formData = new FormData(form);
  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      body: formData,
    });
    const result = await response.json();
    if (result.result === 'success') {
      successMsg.className = 'mt-4 text-center font-medium text-sm text-green-600';
      successMsg.textContent = '✅ Laporan berhasil diupdate/ditambahkan!';
      form.reset();
      loadData();
      setTimeout(() => {
        successMsg.textContent = '';
      }, 5000);
    } else {
      throw new Error(result.error || 'Terjadi kesalahan yang tidak diketahui.');
    }
  } catch (err) {
    successMsg.className = 'mt-4 text-center font-medium text-sm text-red-600';
    successMsg.textContent = `❌ Gagal: ${err.message}`;
  }
});

// =======================================================
// PERBAIKAN DI FUNGSI INI
// =======================================================
function renderChart(data) {
  if (animalChartInstance) {
    animalChartInstance.destroy();
  }

  if (data.length === 0) {
    chartContainer.innerHTML = '<p class="flex items-center justify-center h-full text-slate-500">Data tidak cukup untuk menampilkan grafik.</p>';
    return;
  }

  if (!document.getElementById('animalChart')) {
    chartContainer.innerHTML = '<canvas id="animalChart"></canvas>';
  }

  const ctx = document.getElementById('animalChart').getContext('2d');

  const headers = Object.keys(data[0]);
  const zonaHeaders = headers.filter((h) => h.toLowerCase().startsWith('zona'));
  const zoneTotals = {};
  zonaHeaders.forEach((zona) => {
    zoneTotals[zona] = data.reduce((sum, row) => sum + (parseInt(row[zona], 10) || 0), 0);
  });

  const chartLabels = Object.keys(zoneTotals);
  const chartData = Object.values(zoneTotals);

  animalChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: chartLabels,
      datasets: [
        {
          label: 'Total Hewan',
          data: chartData,
          backgroundColor: 'rgba(79, 70, 229, 0.8)',
          borderColor: 'rgba(79, 70, 229, 1)',
          borderWidth: 1,
          borderRadius: 5,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true, grid: { color: '#e2e8f0' } }, x: { grid: { display: false } } },
      plugins: { legend: { display: false } },
    },
  });
}

function showInfo(data) {
  if (data.length === 0) {
    tabelDataContainer.innerHTML = '<p class="p-8 text-center text-slate-500">Belum ada data laporan.</p>';
    return;
  }

  const headers = Object.keys(data[0]);
  let tableHTML = '<table class="w-full text-sm text-left text-slate-600">';
  tableHTML += '<thead class="text-xs text-slate-700 uppercase bg-slate-100"><tr>';
  headers.forEach((key) => {
    tableHTML += `<th scope="col" class="px-6 py-3">${key}</th>`;
  });
  tableHTML += '</tr></thead>';
  tableHTML += '<tbody class="bg-white divide-y divide-slate-200">';
  data.forEach((row) => {
    tableHTML += '<tr class="hover:bg-slate-50 transition">';
    headers.forEach((header) => {
      tableHTML += `<td class="px-6 py-4">${row[header] || ''}</td>`;
    });
    tableHTML += '</tr>';
  });
  tableHTML += '</tbody></table>';

  tabelDataContainer.innerHTML = tableHTML;
  searchInput.disabled = false;
}

async function loadData() {
  tabelDataContainer.innerHTML = '<p class="p-8 text-center text-slate-500">Memuat data tabel...</p>';
  chartContainer.innerHTML = '<p class="flex items-center justify-center h-full text-slate-500">Memuat data grafik...</p>';
  searchInput.value = '';
  searchInput.disabled = true;

  try {
    const response = await fetch(SCRIPT_URL);
    if (!response.ok) throw new Error(`Gagal terhubung ke server (status: ${response.status})`);
    const data = await response.json();
    if (data.result === 'error') throw new Error(data.error);

    const sortedData = data.sort((a, b) => (a[Object.keys(a)[0]] || '').localeCompare(b[Object.keys(b)[0]] || ''));

    showInfo(sortedData);
    renderChart(sortedData);
  } catch (error) {
    tabelDataContainer.innerHTML = `<p class="p-8 text-center text-red-600">Gagal memuat data tabel: ${error.message}</p>`;
    chartContainer.innerHTML = `<p class="flex items-center justify-center h-full text-red-600">Gagal memuat data grafik.</p>`;
    console.error('Error loading data:', error);
  }
}

function filterTable() {
  const searchTerm = searchInput.value.toLowerCase();
  const table = tabelDataContainer.querySelector('table');
  if (!table) return;

  const rows = table.getElementsByTagName('tr');
  for (let i = 1; i < rows.length; i++) {
    rows[i].style.display = rows[i].textContent.toLowerCase().includes(searchTerm) ? '' : 'none';
  }
}

// EVENT LISTENERS
window.addEventListener('DOMContentLoaded', loadData);
refreshButton.addEventListener('click', loadData);
searchInput.addEventListener('keyup', filterTable);

downloadExcelButton.onclick = function () {
  const SPREADSHEET_ID = '13ZuBdQHtqp6nHLFOIjgMcoKvvRKRwFndWE54B1d40kc';
  const downloadUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=xlsx`;
  window.open(downloadUrl, '_blank');
};
