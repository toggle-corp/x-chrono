function getInterval(time) {
    var hrs = time/1000.0/3600.0;
    if (hrs < 1) {
        var mins = time/1000.0/60.0;
        return mins.toFixed(2) + " mins";
    }
    else
        return hrs.toFixed(2) + " hrs";
}