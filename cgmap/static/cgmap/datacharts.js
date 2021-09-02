$(window).on('map:init', function (e) {
    var detail = e.originalEvent ?
                 e.originalEvent.detail : e.detail;
    var ctx = document.getElementById('tempChart').getContext('2d');
    var chartData = [];
    console.log('ui element cell_data: ', document.getElementById('cell_data'))
    document.getElementById('cell_data').addEventListener("change", function(){
        console.log('cell data has changed');
    });

    const labels = ['January', 'February', 'March', 'April', 'May', 'June', 'July']
    const data = {
        labels: labels,
        datasets: [{
            label: 'depth level 1',
            data: [23, 12, 17, 10, 2, 24, 30],
            fill: false,
            borderColor: '#EB8702',
            tension: 0.1
        },
        {
            label: 'depth level 2',
            data: [20, 24, 10, 17, 3, 34, 27],
            fill: false,
            borderColor: '#BA700B',
            tension: 0.1
        }],
    };
    var tempChart = new Chart(ctx, {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            legend: {
                position: "right",
                align: "middle"
            },
            scales: {
                y: {
                    beginAtZero: true,
                    stacked: true
                }
            }
        }
    });

    const changeData = () => {
        tempChart.data.datasets[0].data = randomArray(7);
        tempChart.update();
    }

    const randomArray = (size) => {
        const randomArray = [];
        for (let i=0; i<size; i++) {
            randomArray.push(Math.random() * 45);
        }
        return randomArray;
    };
})




