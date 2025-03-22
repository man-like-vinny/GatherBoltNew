const ctx = document.getElementById('line').getContext('2d');
const myChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat', 'Sun'],
        datasets: [{
            label: 'Profit of Sales',
            data: [120, 190, 10, 505, 200, 199, 101],
            backgroundColor: [
                'rgb(69, 154, 125)'
            ],
            borderColor: [
               ' rgb(69, 154, 125)'
            ],
            borderWidth: 2
        }]
    },
    options: {
      responsive: true
    }

    
});
