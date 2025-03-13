const scoreboardData = document.getElementById('scoreboard-data');

function updateScoreboard() {
    fetch('scoreboard.php')
        .then(response => response.json())
        .then(data => {
            scoreboardData.innerHTML = ''; // Clear the table body
            let rank = 1;
            data.forEach(team => {
                const tableRow = document.createElement('tr');
                tableRow.innerHTML = `
                    <td>${rank}</td>
                    <td>${team.teamname}</td>
                    <td>${team.points}</td>
                `;
                scoreboardData.appendChild(tableRow);
                rank++;
            });
        })
        .catch(error => console.error('Error:', error));
}

updateScoreboard(); // Initial update
setInterval(updateScoreboard, 5000); // Update every 5 seconds