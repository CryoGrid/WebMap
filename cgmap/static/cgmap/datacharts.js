$(window).on('map:init', function (e) {
    var detail = e.originalEvent ?
                 e.originalEvent.detail : e.detail;
    var chartData = [];
    console.log('ui element cell_data: ', document.getElementById('cell_data'))
    document.getElementById('cell_data').addEventListener("change", function(){
        console.log('cell data has changed');
    });


    function changeData(){
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
