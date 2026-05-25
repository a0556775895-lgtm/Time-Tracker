let trendChart = null;
let siteChart = null;
let comparisonChart = null;
let currentFilter = 'week';

document.addEventListener('DOMContentLoaded', () => {
    loadReports();
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.filter;
            loadReports();
        });
    });
    
    document.getElementById('exportBtn').addEventListener('click', exportToCSV);
    document.getElementById('backBtn').addEventListener('click', () => window.close());
});

function loadReports() {
    chrome.storage.local.get(['dailyHistory'], (result) => {
        const history = result.dailyHistory || [];
        
        // Filter data based on selected period
        const filteredData = filterDataByPeriod(history, currentFilter);
        
        // Update stats
        updateStats(filteredData);
        
        // Update charts
        updateTrendChart(filteredData, history);
        updateSiteChart(filteredData);
        updateComparisonChart(history);
        
        // Generate insights
        generateInsights(filteredData, history);
    });
}

function filterDataByPeriod(history, period) {
    const now = new Date();
    let startDate = new Date();
    
    switch(period) {
        case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
        case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
        case 'three-month':
            startDate.setMonth(now.getMonth() - 3);
            break;
        case 'all':
            startDate = new Date(0);
            break;
    }
    
    return history.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= startDate;
    });
}

function updateStats(data) {
    if (data.length === 0) {
        document.getElementById('totalUsage').textContent = '0 שעות';
        document.getElementById('avgUsage').textContent = '0 שעות';
        document.getElementById('maxDay').textContent = '0 שעות';
        document.getElementById('minDay').textContent = '0 שעות';
        return;
    }
    
    const totalMs = data.reduce((sum, item) => sum + (item.totalTime || 0), 0);
    const total = formatTime(totalMs);
    const avg = formatTime(Math.round(totalMs / data.length));
    
    const times = data.map(item => item.totalTime || 0);
    const max = formatTime(Math.max(...times));
    const min = formatTime(Math.min(...times));
    
    document.getElementById('totalUsage').textContent = total;
    document.getElementById('avgUsage').textContent = avg;
    document.getElementById('maxDay').textContent = max;
    document.getElementById('minDay').textContent = min;
}

function updateTrendChart(filteredData, allHistory) {
    const labels = filteredData.map(item => {
        const date = new Date(item.date);
        return date.toLocaleDateString('he-IL', { month: 'short', day: 'numeric' });
    });
    
    const data = filteredData.map(item => Math.round(item.totalTime / 1000 / 60)); // Convert to minutes
    
    const ctx = document.getElementById('trendChart').getContext('2d');
    
    if (trendChart) {
        trendChart.data.labels = labels;
        trendChart.data.datasets[0].data = data;
        trendChart.update();
    } else {
        trendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'דקות שימוש',
                    data: data,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#667eea',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: true, rtl: true }
                },
                scales: {
                    y: { beginAtZero: true, ticks: { callback: value => value + ' דק' } }
                }
            }
        });
    }
}

function updateSiteChart(data) {
    // Aggregate site times
    const siteTotals = {};
    data.forEach(item => {
        const siteTimes = item.siteTimes || {};
        Object.entries(siteTimes).forEach(([domain, time]) => {
            siteTotals[domain] = (siteTotals[domain] || 0) + time;
        });
    });
    
    // Sort and get top 8
    const topSites = Object.entries(siteTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);
    
    const labels = topSites.map(([domain]) => domain);
    const values = topSites.map(([, time]) => Math.round(time / 1000 / 60));
    
    const colors = [
        '#667eea', '#764ba2', '#f093fb', '#4facfe',
        '#00f2fe', '#43e97b', '#fa709a', '#fee140'
    ];
    
    const ctx = document.getElementById('siteChart').getContext('2d');
    
    if (siteChart) {
        siteChart.data.labels = labels;
        siteChart.data.datasets[0].data = values;
        siteChart.update();
    } else {
        siteChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors.slice(0, topSites.length),
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom', rtl: true }
                }
            }
        });
    }
}

function updateComparisonChart(history) {
    if (history.length < 14) {
        document.getElementById('comparisonContainer').innerHTML = 
            '<p style="text-align: center; color: #999;">צריך לפחות 14 ימים של נתונים</p>';
        return;
    }
    
    // Get last 2 weeks
    const week1 = history.slice(-14, -7);
    const week2 = history.slice(-7);
    
    const avg1 = Math.round(week1.reduce((s, i) => s + (i.totalTime || 0), 0) / week1.length / 1000 / 60);
    const avg2 = Math.round(week2.reduce((s, i) => s + (i.totalTime || 0), 0) / week2.length / 1000 / 60);
    
    const ctx = document.getElementById('comparisonChart').getContext('2d');
    
    if (comparisonChart) {
        comparisonChart.data.datasets[0].data = [avg1, avg2];
        comparisonChart.update();
    } else {
        comparisonChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['שבוע הקודם', 'השבוע'],
                datasets: [{
                    label: 'דקות ממוצע ביום',
                    data: [avg1, avg2],
                    backgroundColor: ['#764ba2', '#667eea'],
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true,
                indexAxis: 'y',
                plugins: { legend: { display: false } },
                scales: { x: { beginAtZero: true } }
            }
        });
    }
}

function generateInsights(filteredData, allHistory) {
    const insights = [];
    
    if (filteredData.length === 0) {
        document.getElementById('insights').innerHTML = '<p>אין נתונים עדיין</p>';
        return;
    }
    
    // Insight 1: Trend
    if (filteredData.length >= 2) {
        const first = filteredData[0].totalTime;
        const last = filteredData[filteredData.length - 1].totalTime;
        const diff = ((last - first) / first * 100).toFixed(0);
        
        if (diff > 10) {
            insights.push(`📈 השימוש שלך עלה ב-${diff}% בתקופה זו`);
        } else if (diff < -10) {
            insights.push(`📉 השימוש שלך ירד ב-${Math.abs(diff)}% - כל הכבוד! 🎉`);
        }
    }
    
    // Insight 2: Best day
    const maxDay = filteredData.reduce((max, item) => 
        (item.totalTime > max.totalTime) ? item : max
    );
    insights.push(`🏃 הנ"ך היותר עמוס היה ${new Date(maxDay.date).toLocaleDateString('he-IL')} עם ${formatTime(maxDay.totalTime)}`);
    
    // Insight 3: Top site
    let topSite = null;
    let maxTime = 0;
    filteredData.forEach(item => {
        Object.entries(item.siteTimes || {}).forEach(([domain, time]) => {
            if (time > maxTime) {
                maxTime = time;
                topSite = domain;
            }
        });
    });
    if (topSite) {
        insights.push(`🌐 האתר המובילי הוא ${topSite} עם ${formatTime(maxTime)}`);
    }
    
    // Insight 4: Consistency
    if (filteredData.length >= 3) {
        const avg = filteredData.reduce((s, i) => s + (i.totalTime || 0), 0) / filteredData.length;
        const variance = filteredData.reduce((s, i) => s + Math.pow((i.totalTime - avg), 2), 0) / filteredData.length;
        const stdDev = Math.sqrt(variance);
        
        if (stdDev < avg * 0.3) {
            insights.push(`✨ השימוש שלך עקבי מאד - זה טוב!`);
        } else {
            insights.push(`🎲 השימוש שלך משתנה הרבה - נסה להיות עקבי יותר`);
        }
    }
    
    const html = insights.map(insight => `<p>• ${insight}</p>`).join('');
    document.getElementById('insights').innerHTML = html;
}

function formatTime(ms) {
    if (ms === 0) return '0 דקות';
    const hours = Math.floor(ms / 1000 / 60 / 60);
    const minutes = Math.floor((ms / 1000 / 60) % 60);
    
    if (hours === 0) return `${minutes} דקות`;
    if (minutes === 0) return `${hours} שעות`;
    return `${hours} שעות ו-${minutes} דקות`;
}

function exportToCSV() {
    chrome.storage.local.get(['dailyHistory'], (result) => {
        const history = result.dailyHistory || [];
        const filteredData = filterDataByPeriod(history, currentFilter);
        
        let csv = 'תאריך,סה"כ זמן (דקות),אתרים\n';
        
        filteredData.forEach(item => {
            const date = item.date;
            const minutes = Math.round(item.totalTime / 1000 / 60);
            const sites = Object.entries(item.siteTimes || {})
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([domain, time]) => `${domain} (${Math.round(time / 1000 / 60)}דק)`)
                .join('; ');
            
            csv += `${date},${minutes},"${sites}"\n`;
        });
        
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `דוח-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
}
