// frontend/js/analytics.js

async function loadAnalytics() {
  const user = window._currentUser;
  if (!user || user.role !== 'student') return;
  try {
    const [data, classAvg] = await Promise.all([
      StudentsAPI.dashboard(user.id),
      MarksAPI.classAverage()
    ]);

    const avgMap = {};
    classAvg.forEach(r => avgMap[r.subject] = r.avg);

    const subjects   = data.marks.map(m => m.subject.length > 7 ? m.subject.slice(0,7)+'…' : m.subject);
    const myScores   = data.marks.map(m => m.total);
    const classScores= data.marks.map(m => avgMap[m.subject] || 65);

    // Test scores (synthesised from marks data)
    const testLabels  = data.marks.flatMap(m => [`${m.subject.slice(0,4)} T1`, `${m.subject.slice(0,4)} T2`]);
    const testScores  = data.marks.flatMap(m => [
      Math.round(m.test1 / 50 * 100),
      Math.round(m.test2 / 50 * 100),
    ]);

    createChart('chart-tests', {
      type: 'bar',
      data: {
        labels: testLabels,
        datasets: [{
          label: 'Score %',
          data: testScores,
          backgroundColor: testScores.map(s => s >= 85 ? 'rgba(16,185,129,0.7)' : s >= 65 ? 'rgba(79,156,249,0.7)' : 'rgba(245,158,11,0.7)'),
          borderRadius: 6,
        }]
      },
      options: { responsive:true, plugins:{ legend:{ display:false } }, scales: baseScaleOpts(0,100) }
    });

    // Monthly attendance chart
    const attBySubj = data.attBySubject || [];
    const monthlyPct = [88, 85, 90, 83, 92, 88]; // representational
    createChart('chart-att-monthly', {
      type: 'bar',
      data: {
        labels: ['Aug','Sep','Oct','Nov','Dec','Jan'],
        datasets: [
          { label:'Present', data:[22,20,21,19,23,22], backgroundColor:'rgba(16,185,129,0.7)', borderRadius:5 },
          { label:'Absent',  data:[2,4,3,5,1,2],       backgroundColor:'rgba(239,68,68,0.7)',  borderRadius:5 },
        ]
      },
      options: {
        responsive:true,
        plugins:{ legend:{ labels:{ color:CHART_DEFAULTS.legendColor } } },
        scales: { x:{ stacked:true, grid:{ display:false }, ticks:{ color:CHART_DEFAULTS.tickColor } }, y:{ stacked:true, grid:{ color:CHART_DEFAULTS.gridColor }, ticks:{ color:CHART_DEFAULTS.tickColor } } }
      }
    });

    // Comparison chart
    createChart('chart-comparison', {
      type: 'bar',
      data: {
        labels: subjects,
        datasets: [
          { label:'Your Score',  data:myScores,    backgroundColor:'rgba(79,156,249,0.75)', borderRadius:5 },
          { label:'Class Avg',   data:classScores, backgroundColor:'rgba(124,58,237,0.5)',  borderRadius:5 },
        ]
      },
      options: {
        responsive:true,
        plugins:{ legend:{ labels:{ color:CHART_DEFAULTS.legendColor } } },
        scales: baseScaleOpts(40, 100),
      }
    });

    // Strengths
    const sorted = [...data.marks].sort((a,b) => b.total - a.total);
    const strongEl = document.getElementById('strong-subjects-list');
    strongEl.innerHTML = '';
    sorted.slice(0, 4).forEach(m => {
      strongEl.innerHTML += `
        <div class="subject-bar-item">
          <div class="subject-bar-row"><span>${m.subject}</span><span class="text-green">${m.total}/100</span></div>
          ${progressBar(m.total, 'var(--accent3)')}
        </div>`;
    });

    // Weak
    const weakEl = document.getElementById('weak-subjects-list');
    weakEl.innerHTML = '';
    sorted.slice(-4).reverse().forEach(m => {
      const col = m.total < 60 ? 'var(--danger)' : 'var(--accent4)';
      weakEl.innerHTML += `
        <div class="subject-bar-item">
          <div class="subject-bar-row"><span>${m.subject}</span><span style="color:${col}">${m.total}/100</span></div>
          ${progressBar(m.total, col)}
        </div>`;
    });

  } catch (err) {
    showToast('Failed to load analytics: ' + err.message, 'error');
  }
}
