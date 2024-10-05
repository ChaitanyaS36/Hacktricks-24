const scoreboardData = document.getElementById('scoreboard-data');

function updateScoreboard() {
    fetch('/scoreboard/data')
  .then(response => {
    if (!response.ok) {
      throw new Error('Error retrieving scoreboard data');
    }
    return response.json();
  })
  .then(data => {
    const scoreboardData = document.getElementById('scoreboard-data');
    scoreboardData.innerHTML = '';
    if (Array.isArray(data)) {
      data.forEach(team => {
        const tableRow = document.createElement('tr');
        tableRow.innerHTML = `
          <td>${team.team_name}</td>
          <td>${team.points}</td>
        `;
        scoreboardData.appendChild(tableRow);
      });
    } else if (data.message) {
      const tableRow = document.createElement('tr');
      tableRow.innerHTML = `
        <td colspan="2">${data.message}</td>
      `;
      scoreboardData.appendChild(tableRow);
    } else {
      const tableRow = document.createElement('tr');
      tableRow.innerHTML = `
        <td>${data.team_name}</td>
        <td>${data.points}</td>
      `;
      scoreboardData.appendChild(tableRow);
    }
  })
  .catch(error => console.error('Error:', error));
}

updateScoreboard(); // Initial update
setInterval(updateScoreboard, 10000); // Update every 10 seconds
